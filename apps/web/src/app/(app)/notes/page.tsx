import { NotesPanel } from "@/features/notes/NotesPanel";
import type { Note } from "@/features/notes/types";
import { apiFetchServer } from "@/lib/api-server";

// Página delgada: lee en el servidor y renderiza la feature.
export default async function NotesPage() {
  const notes = await apiFetchServer<Note[]>("/notes");
  return <NotesPanel notes={notes} />;
}
