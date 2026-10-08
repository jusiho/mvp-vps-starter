"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/60";

// Formulario de inicio de sesión y de registro (email + contraseña).
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const result =
      mode === "register"
        ? await authClient.signUp.email({
            name: String(form.get("name")),
            email,
            password,
          })
        : await authClient.signIn.email({ email, password });

    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Algo salió mal, intenta de nuevo.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      {mode === "register" && (
        <input
          name="name"
          placeholder="Tu nombre"
          autoComplete="name"
          required
          className={inputClass}
        />
      )}
      <input
        name="email"
        type="email"
        placeholder="Correo"
        autoComplete="email"
        required
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        placeholder="Contraseña (mínimo 8 caracteres)"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        minLength={8}
        required
        className={inputClass}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {loading ? "Un momento..." : mode === "register" ? "Crear cuenta" : "Entrar"}
      </button>
    </form>
  );
}
