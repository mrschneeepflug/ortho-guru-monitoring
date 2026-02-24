import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useFactory: createMockPrismaService },
      ],
    }).compile();

    service = module.get(PatientsService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const items = [{ id: 'p1', name: 'Alice' }];
      prisma.$transaction.mockResolvedValueOnce([items, 1]);

      const result = await service.findAll('practice1', { page: 1, limit: 20 });

      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should calculate skip from page and limit', async () => {
      prisma.$transaction.mockResolvedValueOnce([[], 0]);

      await service.findAll('practice1', { page: 3, limit: 10 });

      const findManyCall = prisma.patient.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(20);
      expect(findManyCall.take).toBe(10);
    });

    it('should filter by status when provided', async () => {
      prisma.$transaction.mockResolvedValueOnce([[], 0]);

      await service.findAll('practice1', { status: 'ACTIVE' });

      const findManyCall = prisma.patient.findMany.mock.calls[0][0];
      expect(findManyCall.where.status).toBe('ACTIVE');
    });

    it('should filter by doctorId when provided', async () => {
      prisma.$transaction.mockResolvedValueOnce([[], 0]);

      await service.findAll('practice1', { doctorId: 'd1' });

      const findManyCall = prisma.patient.findMany.mock.calls[0][0];
      expect(findManyCall.where.doctorId).toBe('d1');
    });

    it('should filter by search with case-insensitive name', async () => {
      prisma.$transaction.mockResolvedValueOnce([[], 0]);

      await service.findAll('practice1', { search: 'alice' });

      const findManyCall = prisma.patient.findMany.mock.calls[0][0];
      expect(findManyCall.where.name).toEqual({ contains: 'alice', mode: 'insensitive' });
    });

    it('should always scope by practiceId', async () => {
      prisma.$transaction.mockResolvedValueOnce([[], 0]);

      await service.findAll('practice1', {});

      const findManyCall = prisma.patient.findMany.mock.calls[0][0];
      expect(findManyCall.where.practiceId).toBe('practice1');
    });
  });

  describe('findOne', () => {
    it('should return patient when found', async () => {
      const patient = { id: 'p1', name: 'Alice', practiceId: 'practice1' };
      prisma.patient.findFirst.mockResolvedValueOnce(patient);

      const result = await service.findOne('p1', 'practice1');
      expect(result).toEqual(patient);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.patient.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('missing', 'practice1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create patient with practice isolation', async () => {
      prisma.patient.create.mockResolvedValueOnce({ id: 'new' });

      await service.create(
        { name: 'Bob', doctorId: 'd1', scanFrequency: 14 },
        'practice1',
      );

      expect(prisma.patient.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          practiceId: 'practice1',
          name: 'Bob',
        }),
      });
    });

    it('should parse dateOfBirth as Date when provided', async () => {
      prisma.patient.create.mockResolvedValueOnce({ id: 'new' });

      await service.create(
        { name: 'Bob', doctorId: 'd1', dateOfBirth: '1990-01-15' },
        'practice1',
      );

      const createCall = prisma.patient.create.mock.calls[0][0];
      expect(createCall.data.dateOfBirth).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('should verify patient exists before updating', async () => {
      prisma.patient.findFirst.mockResolvedValueOnce({ id: 'p1' });
      prisma.patient.update.mockResolvedValueOnce({ id: 'p1', name: 'Updated' });

      await service.update('p1', { name: 'Updated' }, 'practice1');

      expect(prisma.patient.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', practiceId: 'practice1' },
      });
    });

    it('should throw NotFoundException when patient not found', async () => {
      prisma.patient.findFirst.mockResolvedValueOnce(null);

      await expect(service.update('missing', { name: 'Updated' }, 'practice1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
