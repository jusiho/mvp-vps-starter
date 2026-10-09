// Se muestra mientras la página lee las notas del API.
export default function NotesLoading() {
  return (
    <div className="max-w-prose">
      <h1 className="text-3xl font-semibold tracking-tight">Notas</h1>
      <p className="mt-8 text-zinc-500">Cargando notas...</p>
    </div>
  );
}
