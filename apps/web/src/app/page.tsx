import { apiUrl } from "@/lib/api";

// Se renderiza en cada petición (no en el build) para mostrar el estado real.
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

function Status({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? "text-green-600" : "text-red-600"}>
      {ok ? "ok" : "sin conexión"}
    </span>
  );
}

export default async function Home() {
  const health = await getHealth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Tu MVP está en línea 🚀
      </h1>
      <ul className="flex flex-col gap-2 text-left font-mono text-sm">
        <li>
          Frontend (Next.js): <Status ok />
        </li>
        <li>
          API (NestJS): <Status ok={health.api} />
        </li>
        <li>
          Base de datos (Postgres): <Status ok={health.db} />
        </li>
      </ul>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Edita <code>apps/web/src/app/page.tsx</code> para empezar. La guía de
        arquitectura está en <code>AGENTS.md</code>.
      </p>
    </main>
  );
}
