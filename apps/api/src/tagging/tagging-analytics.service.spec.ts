import { Test } from '@nestjs/testing';
import { TaggingAnalyticsService } from './tagging-analytics.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

describe('TaggingAnalyticsService', () => {
  let service: TaggingAnalyticsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TaggingAnalyticsService,
        { provide: PrismaService, useFactory: createMockPrismaService },
      ],
    }).compile();

    service = module.get(TaggingAnalyticsService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('calculateDiscountTier', () => {
    it('should return 0% for 0% tagging rate', () => {
      expect(service.calculateDiscountTier(0)).toBe(0);
    });

    it('should return 0% for 49.99% tagging rate', () => {
      expect(service.calculateDiscountTier(49.99)).toBe(0);
    });

    it('should return 10% for exactly 50% tagging rate', () => {
      expect(service.calculateDiscountTier(50)).toBe(10);
    });

    it('should return 10% for 69% tagging rate', () => {
      expect(service.calculateDiscountTier(69)).toBe(10);
    });

    it('should return 20% for exactly 70% tagging rate', () => {
      expect(service.calculateDiscountTier(70)).toBe(20);
    });

    it('should return 20% for 84% tagging rate', () => {
      expect(service.calculateDiscountTier(84)).toBe(20);
    });

    it('should return 30% for exactly 85% tagging rate', () => {
      expect(service.calculateDiscountTier(85)).toBe(30);
    });

    it('should return 30% for 100% tagging rate', () => {
      expect(service.calculateDiscountTier(100)).toBe(30);
    });
  });

  describe('getTaggingRate', () => {
    it('should return 0 when there are no sessions', async () => {
      prisma.scanSession.count.mockResolvedValueOnce(0);

      const rate = await service.getTaggingRate('p1');
      expect(rate).toBe(0);
    });

    it('should calculate rate as (tagged / total) * 100', async () => {
      prisma.scanSession.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(7);  // tagged

      const rate = await service.getTaggingRate('p1');
      expect(rate).toBe(70);
    });

    it('should return 100 when all sessions are tagged', async () => {
      prisma.scanSession.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);

      const rate = await service.getTaggingRate('p1');
      expect(rate).toBe(100);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics with discount and persist to practice', async () => {
      prisma.$transaction.mockResolvedValueOnce([20, 17]);
      prisma.practice.update.mockResolvedValueOnce({});

      const result = await service.getAnalytics('p1');

      expect(result.totalSessions).toBe(20);
      expect(result.taggedSessions).toBe(17);
      expect(result.taggingRate).toBe(85);
      expect(result.discountPercent).toBe(30);
      expect(result.period).toBe('30d');

      expect(prisma.practice.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { taggingRate: 85, discountPercent: 30 },
      });
    });

    it('should return 0 rate when no sessions exist', async () => {
      prisma.$transaction.mockResolvedValueOnce([0, 0]);
      prisma.practice.update.mockResolvedValueOnce({});

      const result = await service.getAnalytics('p1');

      expect(result.taggingRate).toBe(0);
      expect(result.discountPercent).toBe(0);
    });
  });
});
