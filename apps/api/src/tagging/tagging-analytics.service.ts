import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TagAnalyticsResponseDto } from './dto/tag-analytics-response.dto';

@Injectable()
export class TaggingAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaggingRate(practiceId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalSessions = await this.prisma.scanSession.count({
      where: {
        patient: { practiceId },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    if (totalSessions === 0) {
      return 0;
    }

    const taggedSessions = await this.prisma.scanSession.count({
      where: {
        patient: { practiceId },
        createdAt: { gte: thirtyDaysAgo },
        tagSet: { isNot: null },
      },
    });

    return (taggedSessions / totalSessions) * 100;
  }

  calculateDiscountTier(taggingRate: number): number {
    if (taggingRate >= 85) return 30;
    if (taggingRate >= 70) return 20;
    if (taggingRate >= 50) return 10;
    return 0;
  }

  async getAnalytics(practiceId: string): Promise<TagAnalyticsResponseDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalSessions, taggedSessions] = await this.prisma.$transaction([
      this.prisma.scanSession.count({
        where: {
          patient: { practiceId },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.scanSession.count({
        where: {
          patient: { practiceId },
          createdAt: { gte: thirtyDaysAgo },
          tagSet: { isNot: null },
        },
      }),
    ]);

    const taggingRate =
      totalSessions === 0 ? 0 : (taggedSessions / totalSessions) * 100;
    const discountPercent = this.calculateDiscountTier(taggingRate);

    // Persist the computed analytics on the practice record
    await this.prisma.practice.update({
      where: { id: practiceId },
      data: {
        taggingRate,
        discountPercent,
      },
    });

    return {
      taggingRate,
      discountPercent,
      totalSessions,
      taggedSessions,
      period: '30d',
    };
  }
}
