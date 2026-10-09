// Tipo de la nota tal como la devuelve el API (GET /notes).
export type Note = {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
};
