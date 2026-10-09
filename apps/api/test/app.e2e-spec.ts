// Pruebas end-to-end: levantan la app completa y pegan a los endpoints reales.
// Necesitan una base de datos (DATABASE_URL en apps/api/.env):
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
import { PrismaService } from './../src/infra/prisma/prisma.service';
import { TEST_USER } from './mocks/nestjs-better-auth';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Las notas pertenecen a un usuario real de la tabla: se asegura TEST_USER.
    const prisma = app.get(PrismaService);
    await prisma.user.upsert({
      where: { id: TEST_USER.id },
      update: {},
      create: { ...TEST_USER, emailVerified: false },
    });
  });

  afterAll(async () => {
    await app.close();
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

  it('/notes: valida, crea, lista y borra', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/notes')
      .send({ title: '   ' })
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({ message: 'Datos inválidos' });
      });

    const created = await request(server)
      .post('/notes')
      .send({ title: 'Primera nota', content: 'Hola' })
      .expect(201);
    const id = (created.body as { id: string }).id;

    await request(server)
      .get('/notes')
      .expect(200)
      .expect((res) => {
        const ids = (res.body as { id: string }[]).map((n) => n.id);
        expect(ids).toContain(id);
      });

    await request(server).delete(`/notes/${id}`).expect(204);
    await request(server).delete(`/notes/${id}`).expect(404);
  });
});
