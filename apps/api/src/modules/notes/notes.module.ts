import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

// Módulo de ejemplo: copia esta estructura (module, controller, service,
// schemas) para cada funcionalidad nueva y bórralo cuando ya no lo necesites.
@Module({
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
