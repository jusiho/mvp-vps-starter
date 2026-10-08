#!/usr/bin/env node
/**
 * Prepara tu máquina para desarrollar, en un comando:  npm run setup
 *
 *   1. Crea los .env (raíz y apps/api) con una clave de Postgres aleatoria.
 *   2. Levanta Postgres con Docker y espera a que acepte conexiones.
 *   3. Instala las dependencias de web y api.
 *   4. Genera el cliente de Prisma y aplica las migraciones.
 *
 * Es idempotente: puedes relanzarlo cuando quieras. No pisa un .env existente.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  apiDir,
  c,
  dockerAvailable,
  fail,
  info,
  installDeps,
  migrate,
  ok,
  portFree,
  readEnv,
  root,
  startDb,
  warn,
} from "./lib.mjs";

const TOTAL = 4;
let step = 0;
function heading(text) {
  step += 1;
  console.log(`\n${c.bold(`[${step}/${TOTAL}]`)} ${text}`);
}

// ── 1. .env ──────────────────────────────────────────────────
async function setupEnv() {
  heading("Configuración (.env)");
  const envPath = join(root, ".env");

  if (existsSync(envPath)) {
    ok(".env ya existe, no se toca");
  } else {
    const examplePath = join(root, ".env.example");
    if (!existsSync(examplePath)) fail("Falta .env.example en la raíz del repo.");
    let content = readFileSync(examplePath, "utf8");

    // Clave aleatoria en hex: sin símbolos que rompan DATABASE_URL.
    const password = randomBytes(24).toString("hex");
    content = content.replace(/^POSTGRES_PASSWORD=.*$/m, `POSTGRES_PASSWORD=${password}`);
    // Secreto con el que Better Auth firma las sesiones.
    const authSecret = randomBytes(32).toString("hex");
    content = content.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${authSecret}`);

    // Si el 5432 está ocupado (un Postgres instalado en la máquina), usa otro.
    let port = 5432;
    while (!(await portFree(port)) && port < 5440) port += 1;
    content = content.replace(/^POSTGRES_PORT=.*$/m, `POSTGRES_PORT=${port}`);

    writeFileSync(envPath, content);
    ok(".env creado con secretos aleatorios (Postgres y sesiones)");
    if (port !== 5432) warn(`El puerto 5432 estaba ocupado: Postgres usará el ${port}`);
  }

  const env = readEnv(envPath);
  for (const key of ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"]) {
    if (!env[key]) fail(`Falta ${key} en .env`);
  }
  if (!env.BETTER_AUTH_SECRET) {
    // .env de una versión anterior del starter: se completa sin pisarlo.
    env.BETTER_AUTH_SECRET = randomBytes(32).toString("hex");
    const current = readFileSync(envPath, "utf8").trimEnd();
    writeFileSync(envPath, `${current}\nBETTER_AUTH_SECRET=${env.BETTER_AUTH_SECRET}\n`);
    ok("BETTER_AUTH_SECRET agregado al .env");
  }

  const apiEnvPath = join(apiDir, ".env");
  if (existsSync(apiEnvPath)) {
    ok("apps/api/.env ya existe, no se toca");
  } else {
    const port = env.POSTGRES_PORT || "5432";
    const url = `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@localhost:${port}/${env.POSTGRES_DB}`;
    writeFileSync(
      apiEnvPath,
      `# Generado por "npm run setup" a partir del .env de la raiz.\n` +
        `DATABASE_URL=${url}\n` +
        `BETTER_AUTH_SECRET=${env.BETTER_AUTH_SECRET}\n`,
    );
    ok("apps/api/.env creado apuntando al Postgres local");
  }
  return env;
}

// ── 2. Docker ────────────────────────────────────────────────
async function setupDb(env) {
  heading("Base de datos (Postgres en Docker)");
  if (!dockerAvailable()) {
    fail("Docker no está disponible. Instala Docker Desktop, ábrelo y relanza `npm run setup`.");
  }
  await startDb(env);
  ok(`Postgres corriendo en localhost:${env.POSTGRES_PORT || 5432}`);
}

// ── 3. Dependencias ──────────────────────────────────────────
function setupDeps() {
  heading("Dependencias (npm install)");
  info("La primera vez puede tardar un par de minutos...");
  installDeps();
}

// ── 4. Esquema ───────────────────────────────────────────────
function setupSchema() {
  heading("Esquema de base de datos (Prisma)");
  const applied = migrate();
  ok("Cliente de Prisma generado");
  ok(applied ? "Migraciones aplicadas" : "La base de datos ya estaba al día");
}

// ── Main ─────────────────────────────────────────────────────
console.log(c.bold("\nmvp-vps-starter · preparación"));
const env = await setupEnv();
await setupDb(env);
setupDeps();
setupSchema();

console.log(`
${c.green(c.bold("Listo."))}

  Arranca con    ${c.bold("npm run dev")}
  Web            http://localhost:3000
  API            http://localhost:4000/health

  ${c.dim("A partir de aquí, pídele a la IA lo que quieras construir: AGENTS.md le explica cómo.")}
`);
