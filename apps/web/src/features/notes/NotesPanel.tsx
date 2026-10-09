"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import type { Note } from "./types";

const inputClass =
  "w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/60";

/**
 * Pantalla de notas. La lista llega del servidor (la página la lee con
 * apiFetchServer); crear y borrar se hacen desde el navegador con apiFetch y
 * después `router.refresh()` vuelve a pedir la lista al servidor.
 */
export function NotesPanel({ notes }: { notes: Note[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setSaving(true);
    try {
      await apiFetch<Note>("/notes", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          content: data.get("content") || undefined,
        }),
      });
      form.reset();
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.errors[0]?.message ?? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setError("No se pudo borrar la nota");
    }
  }

  return (
    <div className="max-w-prose">
      <h1 className="text-3xl font-semibold tracking-tight">Notas</h1>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        <input name="title" placeholder="Título" required maxLength={120} className={inputClass} />
        <textarea
          name="content"
          placeholder="Escribe algo (opcional)"
          rows={3}
          maxLength={5000}
          className={inputClass}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar nota"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="mt-10 text-zinc-600 dark:text-zinc-400">
          Todavía no hay notas. Escribe la primera arriba.
        </p>
      ) : (
        <ul className="mt-10 border-b border-zinc-200 dark:border-zinc-800">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-4 border-t border-zinc-200 py-4 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{note.title}</p>
                {note.content && (
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                    {note.content}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(note.createdAt).toLocaleString("es")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="shrink-0 text-sm text-zinc-500 hover:text-danger"
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
