import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente de Prisma como servicio inyectable de Nest.
 * Se conecta al arrancar la app y cierra la conexión al apagarla.
 *
 * Uso en cualquier servicio:
 *   constructor(private readonly prisma: PrismaService) {}
 *   await this.prisma.user.findMany();
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
