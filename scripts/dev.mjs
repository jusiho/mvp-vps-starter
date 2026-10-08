#!/usr/bin/env node
/**
 * Arranca todo para desarrollar:  npm run dev
 *
 *   - La primera vez (sin .env o sin dependencias) corre `npm run setup` solo.
 *   - Levanta Postgres (Docker), instala lo que falte y aplica las migraciones
 *     pendientes. Nunca hay que migrar a mano.
 *   - Arranca el API (http://localhost:4000) y la web (http://localhost:3000)
 *     con recarga automática. Ctrl+C detiene los dos.
 */
import { execSync, spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  apiDir,
  c,
  dockerAvailable,
  fail,
  installDeps,
  migrate,
  ok,
  readEnv,
  root,
  startDb,
  webDir,
} from "./lib.mjs";

const firstTime =
  !existsSync(join(root, ".env")) ||
  !existsSync(join(apiDir, ".env")) ||
  !existsSync(join(apiDir, "node_modules")) ||
  !existsSync(join(webDir, "node_modules"));

if (firstTime) {
  console.log(c.bold("\nPrimera vez: preparando el proyecto..."));
  execSync("node scripts/setup.mjs", { cwd: root, stdio: "inherit" });
}

console.log(c.bold("\nmvp-vps-starter · desarrollo"));
const env = readEnv(join(root, ".env"));
if (!dockerAvailable()) fail("Docker no está disponible. Abre Docker Desktop y vuelve a intentarlo.");
await startDb(env);
installDeps();
const applied = migrate();
ok(applied ? "Migraciones nuevas aplicadas" : "Base de datos al día");

console.log(`
  Web   ${c.bold("http://localhost:3000")}
  API   ${c.bold("http://localhost:4000/health")}
  ${c.dim("Ctrl+C para detener los dos.")}
`);

// ── Dos procesos, una terminal ───────────────────────────────
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (process.platform === "win32") {
      // Mata el árbol completo: npm → nest/next → node.
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        // ya había terminado
      }
    }
  }
  process.exit(code);
}

function start(name, color, cmd, cwd) {
  const child = spawn(cmd, {
    cwd,
    shell: true,
    // Colores aunque la salida vaya por tubería (salvo que el usuario los apague).
    env: { ...process.env, ...(process.env.NO_COLOR ? {} : { FORCE_COLOR: "1" }) },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  const tag = color(`[${name}]`);
  // `nest --watch` limpia la pantalla en cada recompilación; con dos procesos
  // en la misma terminal eso borraría la salida del otro.
  const clearScreen = /\x1b\[(?:\d*J|H|\d+;\d+H)/g;
  const prefix = (stream, out) => {
    let pending = "";
    stream.on("data", (chunk) => {
      pending += chunk;
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? "";
      for (const line of lines) out.write(`${tag} ${line.replace(clearScreen, "")}\n`);
    });
  };
  prefix(child.stdout, process.stdout);
  prefix(child.stderr, process.stderr);
  child.on("exit", (code) => {
    if (stopping) return;
    console.log(`\n${tag} se detuvo (código ${code ?? 0}). Deteniendo el resto...`);
    stop(code ?? 1);
  });
  children.push(child);
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

start("api", c.cyan, "npm run start:dev", apiDir);
start("web", c.magenta, "npm run dev", webDir);
