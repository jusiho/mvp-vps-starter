import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global: PrismaService queda disponible en todos los módulos sin importarlo.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
