import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getSession } from "@/lib/session";

// Página privada: el proxy redirige si no hay cookie, y aquí se verifica la
// sesión de verdad contra el API. Copia este patrón en cualquier página privada.
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight">
        Hola, {session.user.name}
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {session.user.email}
      </p>
      <p className="mt-8 max-w-prose text-zinc-600 dark:text-zinc-400">
        Esta página solo se ve con sesión iniciada. Es el punto de partida de
        tu panel: pídele a la IA lo que quieras ver aquí.
      </p>
      <div className="mt-8 flex items-center gap-6">
        <LogoutButton />
        <Link
          href="/"
          className="text-sm text-accent underline underline-offset-4 hover:no-underline"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
