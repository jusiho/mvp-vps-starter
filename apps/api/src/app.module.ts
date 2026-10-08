import { Module } from '@nestjs/common';
import { PrismaModule } from './infra/prisma/prisma.module';
import { HealthController } from './health.controller';

// Estructura sugerida:
//   src/infra/    -> piezas técnicas (base de datos, colas, storage...)
//   src/modules/  -> tu negocio (usuarios, productos, pedidos...)
// Cada módulo nuevo se registra aquí en `imports`.
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class AppModule {}
