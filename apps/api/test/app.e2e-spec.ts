// Prueba end-to-end: levanta la app completa y pega a los endpoints reales.
// Necesita una base de datos (DATABASE_URL en apps/api/.env):
//   npm run dev        (desde la raíz; levanta Postgres)
//   npm run test:e2e   (en apps/api)
//
// Better Auth se sustituye por test/mocks: no hay guard y @Session() entrega
// TEST_USER. Para probar el login real usa la app en el navegador.
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TEST_USER } from './mocks/nestjs-better-auth';

describe('API (e2e)', () => {
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

  it('/users/me (GET) devuelve el usuario de la sesión', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({ email: TEST_USER.email });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
