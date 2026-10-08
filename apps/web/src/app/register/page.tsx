import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
      <div className="mt-8">
        <AuthForm mode="register" />
      </div>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-accent underline underline-offset-4 hover:no-underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </main>
  );
}
