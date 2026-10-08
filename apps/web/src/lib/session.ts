import { headers } from "next/headers";
import { apiUrl } from "./api";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

// Sesión actual para server components, layouts y route handlers.
// Reenvía la cookie del navegador al API (por la red interna) y devuelve el
// usuario, o null si no hay sesión válida.
//
//   const session = await getSession();
//   if (!session) redirect("/login");
export async function getSession(): Promise<{ user: SessionUser } | null> {
  const cookie = (await headers()).get("cookie");
  if (!cookie) return null;
  try {
    const res = await fetch(apiUrl("/api/auth/get-session"), {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: SessionUser } | null;
    return data?.user ? { user: data.user } : null;
  } catch {
    return null;
  }
}
