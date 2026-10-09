import { z } from 'zod';

// Esquemas de entrada del módulo. Son la única fuente de validación: el
// controlador los aplica con ZodValidationPipe y de aquí salen los tipos.
export const createNoteSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(120),
  content: z.string().trim().max(5000).optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
