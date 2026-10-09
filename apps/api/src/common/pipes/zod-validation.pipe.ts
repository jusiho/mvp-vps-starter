import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Valida la entrada de una ruta con un esquema Zod.
 *
 *   @Post()
 *   create(@Body(new ZodValidationPipe(createNoteSchema)) input: CreateNoteInput) {}
 *
 * Si no valida, responde 400 con la lista de errores por campo. Lo que sale
 * del pipe ya está tipado y limpio (trim, defaults), listo para el service.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Datos inválidos',
        errors: result.error.issues.map((issue) => ({
          path: issue.path.map(String).join('.'),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
