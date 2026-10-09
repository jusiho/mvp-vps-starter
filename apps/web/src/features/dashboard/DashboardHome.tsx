import Link from "next/link";
import type { SessionUser } from "@/lib/session";

// Primera pantalla del panel. Reemplaza este contenido por el de tu negocio.
export function DashboardHome({ user }: { user: SessionUser }) {
  return (
    <div className="max-w-prose">
      <h1 className="text-3xl font-semibold tracking-tight">Hola, {user.name}</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Este es el punto de partida de tu panel. Pídele a la IA las pantallas
        que necesites: cada una sigue el mismo patrón que{" "}
        <Link
          href="/notes"
          className="text-accent underline underline-offset-4 hover:no-underline"
        >
          Notas
        </Link>
        , el ejemplo que ya viene incluido.
      </p>
    </div>
  );
}
