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
