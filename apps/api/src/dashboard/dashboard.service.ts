import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get recent activity feed: scan sessions, messages, and tag submissions
   * combined into a single list sorted by date descending.
   */
  async getFeed(practiceId: string) {
    const [scanSessions, messages, tagSubmissions] = await Promise.all([
      // Last 20 scan sessions with patient name and status
      this.prisma.scanSession.findMany({
        where: { patient: { practiceId } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          createdAt: true,
          patient: { select: { id: true, name: true } },
        },
      }),

      // Last 10 messages with thread subject
      this.prisma.message.findMany({
        where: { thread: { patient: { practiceId } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          senderType: true,
          content: true,
          createdAt: true,
          thread: { select: { id: true, subject: true } },
        },
      }),

      // Last 10 tag submissions
      this.prisma.tagSet.findMany({
        where: { session: { patient: { practiceId } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          overallTracking: true,
          createdAt: true,
          session: {
            select: {
              id: true,
              patient: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    // Normalise into a unified feed shape
    const feed = [
      ...scanSessions.map((s) => ({
        type: 'scan_session' as const,
        id: s.id,
        date: s.createdAt,
        data: {
          status: s.status,
          patientId: s.patient.id,
          patientName: s.patient.name,
        },
      })),
      ...messages.map((m) => ({
        type: 'message' as const,
        id: m.id,
        date: m.createdAt,
        data: {
          senderType: m.senderType,
          content: m.content,
          threadId: m.thread.id,
          threadSubject: m.thread.subject,
        },
      })),
      ...tagSubmissions.map((t) => ({
        type: 'tag_submission' as const,
        id: t.id,
        date: t.createdAt,
        data: {
          overallTracking: t.overallTracking,
          sessionId: t.session.id,
          patientId: t.session.patient.id,
          patientName: t.session.patient.name,
        },
      })),
    ];

    // Sort combined list newest-first
    feed.sort((a, b) => b.date.getTime() - a.date.getTime());

    return feed;
  }

  /**
   * Compliance stats: total active patients, on-time vs overdue based on
   * each patient's scanFrequency (default 14 days).
   */
  async getComplianceStats(practiceId: string) {
    const activePatients = await this.prisma.patient.findMany({
      where: { practiceId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        scanFrequency: true,
        scanSessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const now = new Date();
    const totalActive = activePatients.length;
    const overduePatients: { id: string; name: string; daysSinceLastScan: number | null }[] = [];
    let onTimeCount = 0;

    for (const patient of activePatients) {
      const frequency = patient.scanFrequency ?? 14;
      const cutoff = new Date(now.getTime() - frequency * 24 * 60 * 60 * 1000);
      const lastScan = patient.scanSessions[0]?.createdAt;

      if (lastScan && lastScan >= cutoff) {
        onTimeCount++;
      } else {
        const daysSinceLastScan = lastScan
          ? Math.floor((now.getTime() - lastScan.getTime()) / (24 * 60 * 60 * 1000))
          : null;

        overduePatients.push({
          id: patient.id,
          name: patient.name,
          daysSinceLastScan,
        });
      }
    }

    const compliancePercentage = totalActive > 0
      ? Math.round((onTimeCount / totalActive) * 10000) / 100
      : 0;

    return {
      totalActive,
      onTimeCount,
      overdueCount: overduePatients.length,
      compliancePercentage,
      overduePatients,
    };
  }

  /**
   * 30-day tagging rate: tagged sessions / total sessions.
   */
  async getTaggingRate(practiceId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalSessions, taggedSessions] = await Promise.all([
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

    const taggingRate = totalSessions > 0
      ? Math.round((taggedSessions / totalSessions) * 10000) / 100
      : 0;

    return {
      totalSessions,
      taggedSessions,
      taggingRate,
      periodDays: 30,
    };
  }

  /**
   * Combined summary: pending scans, total patients, compliance %, tagging rate.
   */
  async getSummary(practiceId: string) {
    const [pendingScans, totalPatients, compliance, tagging] = await Promise.all([
      this.prisma.scanSession.count({
        where: {
          patient: { practiceId },
          status: 'PENDING',
        },
      }),
      this.prisma.patient.count({
        where: { practiceId },
      }),
      this.getComplianceStats(practiceId),
      this.getTaggingRate(practiceId),
    ]);

    return {
      pendingScans,
      totalPatients,
      compliancePercentage: compliance.compliancePercentage,
      taggingRate: tagging.taggingRate,
    };
  }
}
