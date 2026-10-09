import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiUrl } from "./api";

// Llama al API desde el servidor de Next (server components, layouts, route
// handlers) reenviando la cookie de sesión del navegador por la red interna.
//   const notes = await apiFetchServer<Note[]>("/notes");
// Si el API responde 401 (sesión caducada o inexistente), manda al login.
export async function apiFetchServer<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookie = (await headers()).get("cookie") ?? "";
  const reqHeaders = new Headers(init.headers);
  reqHeaders.set("cookie", cookie);
  const res = await fetch(apiUrl(path), { ...init, headers: reqHeaders });
  if (res.status === 401) redirect("/login");
  if (!res.ok) throw new Error(`El API respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}
