import { Global, Module } from '@nestjs/common';
import { prisma, PrismaService } from './prisma.service';

// @Global: PrismaService queda disponible en todos los módulos sin importarlo.
@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: prisma }],
  exports: [PrismaService],
})
export class PrismaModule {}
