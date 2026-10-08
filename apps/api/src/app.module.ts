import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './infra/auth/auth';
import { PrismaModule } from './infra/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { HealthController } from './health.controller';

// Estructura sugerida:
//   src/infra/    -> piezas técnicas (base de datos, auth, colas, storage...)
//   src/modules/  -> tu negocio (usuarios, productos, pedidos...)
// Cada módulo nuevo se registra aquí en `imports`.
@Module({
  imports: [
    PrismaModule,
    // Monta Better Auth en /api/auth y protege TODO el API con un guard
    // global: lo público se marca con @AllowAnonymous(). El CORS lo maneja
    // main.ts para todas las rutas, por eso se desactiva el de Better Auth.
    AuthModule.forRoot({ auth, disableTrustedOriginsCors: true }),
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
