import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { PrismaService } from './infra/prisma/prisma.service';

// Público: lo consultan el monitoreo y el healthcheck de Docker sin sesión.
@AllowAnonymous()
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
