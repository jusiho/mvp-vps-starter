import { createAuthClient } from "better-auth/react";

// Cliente de Better Auth para componentes de cliente ("use client"):
//   authClient.signUp.email(...), signIn.email(...), signOut(), useSession().
// Habla directo con el API: en producción https://api.tudominio.com (fijada
// en el build), en local http://localhost:4000.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
});
