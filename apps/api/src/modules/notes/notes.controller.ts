import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createNoteSchema, type CreateNoteInput } from './notes.schemas';
import { NotesService } from './notes.service';

/**
 * Rutas HTTP de las notas. El controlador solo valida la entrada, saca el
 * usuario de la sesión y delega en el service. El guard global ya exige
 * sesión: sin cookie válida responde 401 antes de llegar aquí.
 */
@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  // GET /notes -> notas del usuario, la más reciente primero
  @Get()
  list(@Session() session: UserSession) {
    return this.notes.list(session.user.id);
  }

  // POST /notes { title, content? } -> 201 con la nota creada
  @Post()
  create(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(createNoteSchema)) input: CreateNoteInput,
  ) {
    return this.notes.create(session.user.id, input);
  }

  // DELETE /notes/:id -> 204, o 404 si no es del usuario
  @Delete(':id')
  @HttpCode(204)
  remove(@Session() session: UserSession, @Param('id') id: string) {
    return this.notes.remove(session.user.id, id);
  }
}
