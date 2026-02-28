import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScansService } from './scans.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

describe('ScansService', () => {
  let service: ScansService;
  let prisma: MockPrismaService;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    eventEmitter = { emit: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ScansService,
        { provide: PrismaService, useFactory: createMockPrismaService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(ScansService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('createSession', () => {
    it('should create a session with PENDING status', async () => {
      prisma.patient.findFirst.mockResolvedValueOnce({ id: 'p1', practiceId: 'pr1' });
      prisma.scanSession.create.mockResolvedValueOnce({ id: 's1', status: 'PENDING' });

      const result = await service.createSession('p1', 'pr1');

      expect(prisma.scanSession.create).toHaveBeenCalledWith({
        data: { patientId: 'p1', status: 'PENDING' },
        include: { patient: { select: { id: true, name: true } } },
      });
      expect(result.status).toBe('PENDING');
    });

    it('should throw NotFoundException when patient not in practice', async () => {
      prisma.patient.findFirst.mockResolvedValueOnce(null);

      await expect(service.createSession('p1', 'pr1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results scoped to practice', async () => {
      prisma.$transaction.mockResolvedValueOnce([[{ id: 's1' }], 1]);

      const result = await service.findAll('pr1', { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      prisma.$transaction.mockResolvedValueOnce([[], 0]);

      await service.findAll('pr1', { status: 'PENDING' as any });

      const call = prisma.scanSession.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('PENDING');
    });

    it('should filter by patientId when provided', async () => {
      prisma.$transaction.mockResolvedValueOnce([[], 0]);

      await service.findAll('pr1', { patientId: 'p1' });

      const call = prisma.scanSession.findMany.mock.calls[0][0];
      expect(call.where.patientId).toBe('p1');
    });
  });

  describe('findOne', () => {
    it('should return session with images and tagSet', async () => {
      const session = { id: 's1', images: [], tagSet: null };
      prisma.scanSession.findFirst.mockResolvedValueOnce(session);

      const result = await service.findOne('s1', 'pr1');
      expect(result).toEqual(session);
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('missing', 'pr1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should set reviewedAt and reviewedBy when status is REVIEWED', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({ id: 's1' });
      prisma.scanSession.update.mockResolvedValueOnce({ id: 's1', status: 'REVIEWED', patientId: 'p1' });

      await service.updateStatus('s1', 'REVIEWED' as any, 'd1', 'pr1');

      const updateCall = prisma.scanSession.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('REVIEWED');
      expect(updateCall.data.reviewedAt).toBeInstanceOf(Date);
      expect(updateCall.data.reviewedBy).toEqual({ connect: { id: 'd1' } });
      expect(eventEmitter.emit).toHaveBeenCalledWith('scan.reviewed', expect.objectContaining({ sessionId: 's1', patientId: 'p1' }));
    });

    it('should not set reviewedAt for non-REVIEWED status', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({ id: 's1' });
      prisma.scanSession.update.mockResolvedValueOnce({ id: 's1', status: 'FLAGGED', patientId: 'p1' });

      await service.updateStatus('s1', 'FLAGGED' as any, 'd1', 'pr1');

      const updateCall = prisma.scanSession.update.mock.calls[0][0];
      expect(updateCall.data.reviewedAt).toBeUndefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith('scan.flagged', expect.objectContaining({ sessionId: 's1', patientId: 'p1' }));
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce(null);

      await expect(service.updateStatus('missing', 'REVIEWED' as any, 'd1', 'pr1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
