import Link from "next/link";
import type { ReactNode } from "react";
import { apiUrl } from "@/lib/api";
import { getSession } from "@/lib/session";

// Página de arranque: confirma que todo funciona, muestra qué trae el MVP y
// qué hacer después. Se renderiza en cada petición para enseñar el estado real.
// Reemplázala por tu propia home cuando la tengas.
export const dynamic = "force-dynamic";

type Health = { api: boolean; db: boolean };

async function getHealth(): Promise<Health> {
  try {
    const res = await fetch(apiUrl("/health"));
    const data = (await res.json()) as { db?: string };
    return { api: true, db: data.db === "ok" };
  } catch {
    return { api: false, db: false };
  }
}

// Dirección pública del API, para mostrarla tal cual la usa el navegador.
const apiHost = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
  .replace(/^https?:\/\//, "");

type State = "ok" | "down" | "neutral";

function Row({
  state,
  name,
  detail,
  action,
}: {
  state: State;
  name: string;
  detail: string;
  action?: ReactNode;
}) {
  const dot = {
    ok: "bg-accent",
    down: "bg-danger",
    neutral: "border-2 border-zinc-400 dark:border-zinc-500",
  }[state];
  return (
    <li className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1 border-t border-zinc-200 py-4 sm:grid-cols-[auto_9rem_1fr_auto] sm:gap-x-5 dark:border-zinc-800">
      <span
        aria-hidden
        className={`relative top-px inline-block size-2.5 rounded-full ${dot}`}
      />
      <span className="font-medium">{name}</span>
      <span className="col-start-2 text-zinc-600 sm:col-start-3 dark:text-zinc-400">
        {detail}
      </span>
      {action && (
        <span className="col-start-2 text-sm sm:col-start-4 sm:text-right">
          {action}
        </span>
      )}
    </li>
  );
}

const stack: [string, string][] = [
  ["Next.js", "la interfaz: páginas, formularios y SEO"],
  ["NestJS", "tu lógica de negocio y tus endpoints"],
  ["Prisma", "tus tablas, con migraciones automáticas"],
  ["Better Auth", "registro e inicio de sesión, con sesiones seguras"],
  ["PostgreSQL", "tus datos, con respaldo en un comando"],
  ["Caddy", "HTTPS automático en tu dominio"],
];

const link = "text-accent underline underline-offset-4 hover:no-underline";

export default async function Home() {
  const [health, session] = await Promise.all([getHealth(), getSession()]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Tu MVP está en línea
      </h1>
      <p className="mt-4 max-w-prose text-lg text-zinc-600 dark:text-zinc-400">
        Todo lo de esta lista ya funciona. Lo que sigue es tuyo.
      </p>

      <ul className="mt-10 border-b border-zinc-200 dark:border-zinc-800">
        <Row state="ok" name="Frontend" detail="Next.js responde" />
        <Row
          state={health.api ? "ok" : "down"}
          name="API"
          detail={
            health.api
              ? `NestJS responde en ${apiHost}`
              : `NestJS no responde en ${apiHost}`
          }
        />
        <Row
          state={health.db ? "ok" : "down"}
          name="Base de datos"
          detail={health.db ? "Postgres conectada" : "Sin conexión a Postgres"}
        />
        {session ? (
          <Row
            state="ok"
            name="Sesión"
            detail={`Entraste como ${session.user.name} (${session.user.email})`}
            action={
              <Link href="/dashboard" className={link}>
                Ir al panel
              </Link>
            }
          />
        ) : (
          <Row
            state="neutral"
            name="Sesión"
            detail="Nadie ha entrado todavía"
            action={
              <>
                <Link href="/register" className={link}>
                  Crear cuenta
                </Link>
                <span className="mx-2 text-zinc-400">o</span>
                <Link href="/login" className={link}>
                  Iniciar sesión
                </Link>
              </>
            }
          />
        )}
      </ul>

      <h2 className="mt-14 text-xl font-semibold">Lo que ya trae tu MVP</h2>
      <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-x-5 gap-y-2 text-zinc-600 dark:text-zinc-400">
        {stack.map(([name, what]) => (
          <div key={name} className="contents">
            <dt className="font-medium text-foreground">{name}</dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-14 text-xl font-semibold">Siguientes pasos</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 text-zinc-600 marker:text-foreground dark:text-zinc-400">
        <li>
          {session ? (
            <>
              Ya tienes cuenta.{" "}
              <Link href="/dashboard" className={link}>
                Entra al panel
              </Link>{" "}
              y mira el punto de partida.
            </>
          ) : (
            <>
              <Link href="/register" className={link}>
                Crea tu cuenta
              </Link>{" "}
              y entra al panel: así compruebas el login completo.
            </>
          )}
        </li>
        <li>
          Pídele a la IA tu primera función: una tabla, una pantalla, un
          formulario. <code className="font-mono text-sm">AGENTS.md</code> le
          explica cómo construir sin romper nada.
        </li>
        <li>
          Cuando quieras mostrarlo, súbelo a un VPS con{" "}
          <code className="font-mono text-sm">docker compose up</code>. La guía
          paso a paso está en{" "}
          <code className="font-mono text-sm">docs/deployment.md</code>.
        </li>
      </ol>

      <p className="mt-16 text-sm text-zinc-500">
        Esta página vive en{" "}
        <code className="font-mono">apps/web/src/app/page.tsx</code>.
        Reemplázala por la tuya cuando quieras.
      </p>
    </main>
  );
}
