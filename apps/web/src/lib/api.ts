// URL base del API según dónde corre el código:
// - En el servidor de Next (server components, route handlers, server actions):
//   API_URL, la red interna de Docker (http://api:4000). No sale a internet.
// - En el navegador: NEXT_PUBLIC_API_URL (https://api.tudominio.com), que se
//   fija al compilar la imagen.
// En desarrollo local, sin variables, apunta a http://localhost:4000.
const LOCAL_API = "http://localhost:4000";

export function apiUrl(path = ""): string {
  const base =
    typeof window === "undefined"
      ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)
      : process.env.NEXT_PUBLIC_API_URL;
  return `${base ?? LOCAL_API}${path}`;
}

// Error del API con el detalle que devuelve el backend (400 trae `errors`).
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}

// Llama al API desde el navegador (client components) con la cookie de sesión.
//   await apiFetch<Note>("/notes", { method: "POST", body: JSON.stringify(data) });
// Para leer datos en server components usa apiFetchServer() de ./api-server.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(apiUrl(path), { ...init, headers, credentials: "include" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string;
      errors?: { path: string; message: string }[];
    } | null;
    throw new ApiError(res.status, body?.message ?? `Error ${res.status}`, body?.errors);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
