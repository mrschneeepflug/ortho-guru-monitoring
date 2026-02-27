import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PracticesService } from './practices.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

describe('PracticesService', () => {
  let service: PracticesService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PracticesService,
        { provide: PrismaService, useFactory: createMockPrismaService },
      ],
    }).compile();

    service = module.get(PracticesService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('findAll', () => {
    it('should return all practices for ADMIN', async () => {
      const practices = [{ id: 'p1' }, { id: 'p2' }];
      prisma.practice.findMany.mockResolvedValueOnce(practices);

      const result = await service.findAll({ sub: 'u1', email: 'a@b.com', role: 'ADMIN', practiceId: 'p1', type: 'doctor' as const });

      expect(result).toEqual(practices);
      expect(prisma.practice.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });

    it('should return only own practice for non-ADMIN', async () => {
      prisma.practice.findMany.mockResolvedValueOnce([{ id: 'p1' }]);

      await service.findAll({ sub: 'u1', email: 'a@b.com', role: 'DOCTOR', practiceId: 'p1', type: 'doctor' as const });

      expect(prisma.practice.findMany).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });

  describe('findOne', () => {
    it('should return practice when IDs match', async () => {
      prisma.practice.findUnique.mockResolvedValueOnce({ id: 'p1' });

      const result = await service.findOne('p1', 'p1');
      expect(result.id).toBe('p1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.practice.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('missing', 'p1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for cross-practice access', async () => {
      prisma.practice.findUnique.mockResolvedValueOnce({ id: 'p2' });

      await expect(service.findOne('p2', 'p1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create practice with default subscription tier', async () => {
      prisma.practice.create.mockResolvedValueOnce({ id: 'new', subscriptionTier: 'basic' });

      await service.create({ name: 'New Practice', address: '123 St', phone: '555-0100' });

      expect(prisma.practice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ subscriptionTier: 'basic' }),
      });
    });
  });

  describe('update', () => {
    it('should update practice when authorized', async () => {
      prisma.practice.findUnique.mockResolvedValueOnce({ id: 'p1' });
      prisma.practice.update.mockResolvedValueOnce({ id: 'p1', name: 'Updated' });

      const result = await service.update('p1', { name: 'Updated' }, 'p1');
      expect(result.name).toBe('Updated');
    });

    it('should throw ForbiddenException for cross-practice update', async () => {
      prisma.practice.findUnique.mockResolvedValueOnce({ id: 'p2' });

      await expect(service.update('p2', { name: 'Hack' }, 'p1'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
