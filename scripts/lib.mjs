// Utilidades compartidas por setup.mjs y dev.mjs. Sin dependencias externas.
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const apiDir = join(root, "apps", "api");
export const webDir = join(root, "apps", "web");

export const c = {
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  magenta: (t) => `\x1b[35m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
};

export const ok = (t) => console.log(`      ${c.green("✓")} ${t}`);
export const info = (t) => console.log(`      ${c.dim(t)}`);
export const warn = (t) => console.log(`      ${c.yellow("!")} ${t}`);

export function fail(message, detail) {
  console.error(`\n${c.red("✗")} ${message}`);
  if (detail) console.error(c.dim(String(detail).trim().slice(0, 800)));
  process.exit(1);
}

/** Ejecuta un comando y devuelve su salida. Lanza si falla. */
export function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, stdio: "pipe", encoding: "utf8", ...opts });
}

/** Junta stdout y stderr de un error de execSync: el detalle puede ir en cualquiera. */
export function output(e) {
  return `${e?.stdout ?? ""}\n${e?.stderr ?? ""}`.trim();
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lee un .env sencillo (KEY=valor). Ignora comentarios y quita comillas. */
export function readEnv(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return env;
}

/** Puertos del host que ya publican otros contenedores (p. ej. otro proyecto). */
function dockerPublishedPorts() {
  const r = spawnSync("docker", ["ps", "--format", "{{.Ports}}"], { stdio: "pipe", encoding: "utf8" });
  const ports = new Set();
  if (r.status === 0) {
    for (const m of (r.stdout ?? "").matchAll(/:(\d+)->/g)) ports.add(Number(m[1]));
  }
  return ports;
}

/** true si nadie escucha en ese puerto de la máquina (ni un proceso ni Docker). */
export async function portFree(port) {
  if (dockerPublishedPorts().has(port)) return false;
  // En Windows, un bind a 127.0.0.1 puede pasar aunque otro proceso tenga
  // 0.0.0.0 en el mismo puerto: se prueban las dos direcciones.
  for (const host of ["0.0.0.0", "127.0.0.1"]) {
    const free = await new Promise((resolve) => {
      const server = createServer();
      server.once("error", () => resolve(false));
      server.listen(port, host, () => server.close(() => resolve(true)));
    });
    if (!free) return false;
  }
  return true;
}

/** Cambia el puerto local de Postgres en .env y en apps/api/.env. */
export function setDbPort(port) {
  const envPath = join(root, ".env");
  let content = readFileSync(envPath, "utf8");
  content = /^POSTGRES_PORT=.*$/m.test(content)
    ? content.replace(/^POSTGRES_PORT=.*$/m, `POSTGRES_PORT=${port}`)
    : `${content.trimEnd()}\nPOSTGRES_PORT=${port}\n`;
  writeFileSync(envPath, content);

  const apiEnvPath = join(apiDir, ".env");
  if (existsSync(apiEnvPath)) {
    const api = readFileSync(apiEnvPath, "utf8").replace(/@localhost:\d+\//, `@localhost:${port}/`);
    writeFileSync(apiEnvPath, api);
  }
}

export function dockerAvailable() {
  const r = spawnSync("docker", ["compose", "version"], { stdio: "pipe" });
  return r.status === 0;
}

/** Levanta el servicio db de docker-compose.yml y espera a que acepte conexiones. */
export async function startDb(env) {
  let port = Number(env.POSTGRES_PORT || 5432);
  for (let attempt = 0; ; attempt++) {
    try {
      run("docker compose up -d db");
      break;
    } catch (e) {
      const out = output(e);
      // El puerto lo tiene otro programa u otro proyecto de Docker: se prueba
      // el siguiente y se corrigen los .env, sin pedirle nada al usuario.
      const portBusy = /address already in use|already allocated|Ports are not available|bind/i.test(out);
      if (portBusy && attempt < 8) {
        warn(`El puerto ${port} estaba ocupado: Postgres usará el ${port + 1}`);
        port += 1;
        setDbPort(port);
        env.POSTGRES_PORT = String(port);
        continue;
      }
      fail("No se pudo levantar Postgres con Docker. ¿Está Docker Desktop abierto?", out);
    }
  }
  // `docker compose up -d` vuelve enseguida, pero Postgres tarda unos segundos
  // en aceptar conexiones. Sin esta espera la migración falla en un clon nuevo.
  process.stdout.write(`      ${c.dim("Esperando a Postgres")}`);
  for (let i = 0; i < 60; i++) {
    const r = spawnSync(
      "docker",
      ["compose", "exec", "-T", "db", "pg_isready", "-U", env.POSTGRES_USER, "-d", env.POSTGRES_DB],
      { cwd: root, stdio: "pipe" },
    );
    if (r.status === 0) {
      process.stdout.write(` ${c.green("listo")}\n`);
      return;
    }
    process.stdout.write(".");
    await sleep(1000);
  }
  process.stdout.write("\n");
  fail("Postgres no respondió en 60 s. Revisa: docker compose logs db");
}

/** Instala dependencias de web y api (rápido si ya están al día). */
export function installDeps() {
  for (const [name, dir] of [["api", apiDir], ["web", webDir]]) {
    try {
      run("npm install --no-audit --no-fund", { cwd: dir });
      ok(`apps/${name}`);
    } catch (e) {
      fail(`Falló npm install en apps/${name}.`, output(e));
    }
  }
}

/**
 * Genera el cliente de Prisma y aplica las migraciones pendientes.
 * Devuelve true si aplicó alguna.
 */
export function migrate() {
  try {
    run("npx prisma generate", { cwd: apiDir });
  } catch (e) {
    const out = output(e);
    if (/EPERM|operation not permitted/i.test(out)) {
      fail(
        "Prisma no pudo escribir el cliente porque un servidor de desarrollo lo está usando.\n" +
          "  Detén `npm run dev` y vuelve a intentarlo.",
      );
    }
    fail("Falló `prisma generate`.", out);
  }
  try {
    const out = run("npx prisma migrate deploy", { cwd: apiDir });
    return /have been applied/.test(out);
  } catch (e) {
    const out = output(e);
    if (/authentication failed|P1000/i.test(out)) {
      fail(
        "Postgres rechazó la clave. Suele pasar si se borró el .env: la base de datos\n" +
          "  guardó la clave anterior. Para empezar de cero (borra los datos locales):\n" +
          "    docker compose down -v && npm run setup",
      );
    }
    fail("Falló al aplicar las migraciones de la base de datos.", out);
  }
}
