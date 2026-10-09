import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { CreateNoteInput } from './notes.schemas';

/**
 * Lógica y acceso a datos de las notas. Todo recibe el `userId` de la sesión
 * y filtra por él: un usuario nunca ve ni toca notas de otro.
 */
@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, input: CreateNoteInput) {
    return this.prisma.note.create({ data: { ...input, userId } });
  }

  async remove(userId: string, id: string) {
    // deleteMany con { id, userId }: si la nota es de otro usuario no borra
    // nada, y se responde 404 sin revelar que existe.
    const { count } = await this.prisma.note.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('Nota no encontrada');
  }
}
