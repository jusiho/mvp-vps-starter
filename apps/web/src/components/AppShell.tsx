import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/session";
import { AppNav } from "./app-nav";
import { LogoutButton } from "./logout-button";

// Marco de las páginas privadas: navegación arriba, usuario y cerrar sesión.
// Lo pone el layout de src/app/(app); las páginas solo ponen su contenido.
export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4 dark:border-zinc-800">
        <AppNav />
        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="hidden sm:inline">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 py-10">{children}</main>
    </div>
  );
}
