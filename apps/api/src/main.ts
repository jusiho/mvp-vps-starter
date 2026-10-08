// Carga apps/api/.env en desarrollo (en producción las variables vienen del compose).
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // bodyParser: false -> Better Auth necesita el cuerpo crudo en /api/auth.
  // El AuthModule vuelve a activar JSON y urlencoded para el resto de rutas.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    // La cookie de sesión viaja entre la web y el API.
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
