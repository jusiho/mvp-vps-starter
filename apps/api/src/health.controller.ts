import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './infra/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /health -> { status: "ok", db: "ok", ts: "..." }
  // Responde 503 si la base de datos no contesta (útil para monitoreo).
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
    return { status: 'ok', db: 'ok', ts: new Date().toISOString() };
  }
}
