"use client";

// Pantalla de error de las páginas privadas (por ejemplo, el API no responde).
// Next la muestra en lugar de la página y permite reintentar.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-prose">
      <h1 className="text-2xl font-semibold tracking-tight">No se pudo cargar esta página</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        El API no respondió. Revisa que esté en marcha y vuelve a intentarlo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-medium text-background"
      >
        Reintentar
      </button>
    </div>
  );
}
