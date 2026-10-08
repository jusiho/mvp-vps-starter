// Prueba end-to-end: levanta la app completa y pega al endpoint real.
// Necesita una base de datos (DATABASE_URL en apps/api/.env):
//   docker compose up -d db   (desde la raíz del repo)
//   npm run test:e2e
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({ status: 'ok', db: 'ok' });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
