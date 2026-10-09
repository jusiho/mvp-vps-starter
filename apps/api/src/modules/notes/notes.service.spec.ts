import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { NotesService } from './notes.service';

// Test unitario de un service: Prisma se simula con useValue, sin base de datos.
describe('NotesService', () => {
  let service: NotesService;
  const prisma = {
    note: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(NotesService);
    jest.clearAllMocks();
  });

  it('lista solo las notas del usuario', async () => {
    prisma.note.findMany.mockResolvedValue([]);
    await service.list('user-1');
    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  it('crea la nota asociada al usuario', async () => {
    prisma.note.create.mockResolvedValue({ id: 'n1' });
    await service.create('user-1', { title: 'Hola' });
    expect(prisma.note.create).toHaveBeenCalledWith({
      data: { title: 'Hola', userId: 'user-1' },
    });
  });

  it('responde 404 si la nota no es del usuario', async () => {
    prisma.note.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('user-1', 'ajena')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
