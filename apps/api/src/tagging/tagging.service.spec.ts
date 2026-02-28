import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaggingService } from './tagging.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../common/ai/ai.service';
import { StorageService } from '../common/storage/storage.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

describe('TaggingService', () => {
  let service: TaggingService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TaggingService,
        { provide: PrismaService, useFactory: createMockPrismaService },
        { provide: AiService, useValue: { suggestTags: jest.fn() } },
        { provide: StorageService, useValue: { getSignedUrl: jest.fn(), getObject: jest.fn() } },
      ],
    }).compile();

    service = module.get(TaggingService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('createTagSet', () => {
    const dto = {
      overallTracking: 1,
      oralHygiene: 2,
      alignerFit: 1,
      detailTags: ['Spacing issue'],
      actionTaken: 'Monitor',
      notes: 'Looks good',
    };

    it('should create tag set and update session in transaction', async () => {
      prisma.scanSession.findUnique.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      const mockTagSet = { id: 't1', ...dto };
      prisma.$transaction.mockResolvedValueOnce([mockTagSet, {}]);

      const result = await service.createTagSet('s1', dto, 'd1', 'p1');

      expect(result).toEqual(mockTagSet);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.scanSession.findUnique.mockResolvedValueOnce(null);

      await expect(service.createTagSet('missing', dto, 'd1', 'p1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for cross-practice access', async () => {
      prisma.scanSession.findUnique.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'other-practice' },
      });

      await expect(service.createTagSet('s1', dto, 'd1', 'p1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should default optional fields to null/false/empty', async () => {
      prisma.scanSession.findUnique.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      prisma.$transaction.mockResolvedValueOnce([{}, {}]);

      const minimalDto = { overallTracking: 1, oralHygiene: 1 };
      await service.createTagSet('s1', minimalDto, 'd1', 'p1');

      const tagSetCreateCall = prisma.tagSet.create.mock.calls[0][0];
      expect(tagSetCreateCall.data.alignerFit).toBeNull();
      expect(tagSetCreateCall.data.detailTags).toEqual([]);
      expect(tagSetCreateCall.data.aiSuggested).toBe(false);
    });
  });

  describe('findBySession', () => {
    it('should return tag set when found in same practice', async () => {
      const tagSet = {
        id: 't1',
        session: { patient: { practiceId: 'p1' } },
      };
      prisma.tagSet.findUnique.mockResolvedValueOnce(tagSet);

      const result = await service.findBySession('s1', 'p1');
      expect(result).toEqual(tagSet);
    });

    it('should throw NotFoundException when tag set not found', async () => {
      prisma.tagSet.findUnique.mockResolvedValueOnce(null);

      await expect(service.findBySession('s1', 'p1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for cross-practice access', async () => {
      prisma.tagSet.findUnique.mockResolvedValueOnce({
        id: 't1',
        session: { patient: { practiceId: 'other' } },
      });

      await expect(service.findBySession('s1', 'p1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDoctor', () => {
    it('should return tag sets scoped to doctor and practice', async () => {
      const tagSets = [{ id: 't1' }, { id: 't2' }];
      prisma.tagSet.findMany.mockResolvedValueOnce(tagSets);

      const result = await service.findByDoctor('d1', 'p1');

      expect(result).toEqual(tagSets);
      expect(prisma.tagSet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            taggedById: 'd1',
            session: { patient: { practiceId: 'p1' } },
          },
        }),
      );
    });
  });
});
