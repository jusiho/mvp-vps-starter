import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './infra/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  const prisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get(HealthController);
    prisma.$queryRaw.mockReset();
  });

  it('responde ok cuando la base de datos contesta', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      db: 'ok',
    });
  });

  it('responde 503 cuando la base de datos no contesta', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
