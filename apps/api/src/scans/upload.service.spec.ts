import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

describe('UploadService', () => {
  let service: UploadService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: PrismaService, useFactory: createMockPrismaService },
      ],
    }).compile();

    service = module.get(UploadService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('generateUploadUrl', () => {
    it('should return upload URL and key when session exists', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });

      const result = await service.generateUploadUrl('s1', 'FRONT' as any, 'p1');

      expect(result.url).toContain('/uploads/');
      expect(result.key).toContain('s1');
      expect(result.key).toContain('FRONT');
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce(null);

      await expect(service.generateUploadUrl('missing', 'FRONT' as any, 'p1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should scope session lookup to practice', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });

      await service.generateUploadUrl('s1', 'LEFT' as any, 'p1');

      expect(prisma.scanSession.findFirst).toHaveBeenCalledWith({
        where: { id: 's1', patient: { practiceId: 'p1' } },
        include: { patient: true },
      });
    });
  });
});
