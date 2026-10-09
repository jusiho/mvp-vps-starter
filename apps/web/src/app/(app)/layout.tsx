import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/session";

// Todas las rutas dentro de (app) son privadas: sin sesión, al login.
// El grupo no cambia la URL: /dashboard y /notes siguen igual.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AppShell user={session.user}>{children}</AppShell>;
}
