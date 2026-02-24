import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useFactory: createMockPrismaService },
      ],
    }).compile();

    service = module.get(DashboardService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('getFeed', () => {
    it('should merge and sort feed items by date descending', async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000);
      const earliest = new Date(now.getTime() - 120000);

      prisma.scanSession.findMany.mockResolvedValueOnce([
        { id: 's1', status: 'PENDING', createdAt: earliest, patient: { id: 'p1', name: 'Alice' } },
      ]);
      prisma.message.findMany.mockResolvedValueOnce([
        { id: 'm1', senderType: 'DOCTOR', content: 'Hi', createdAt: now, thread: { id: 'th1', subject: 'Check-in' } },
      ]);
      prisma.tagSet.findMany.mockResolvedValueOnce([
        { id: 't1', overallTracking: 1, createdAt: earlier, session: { id: 's1', patient: { id: 'p1', name: 'Alice' } } },
      ]);

      const feed = await service.getFeed('p1');

      expect(feed).toHaveLength(3);
      expect(feed[0].type).toBe('message');
      expect(feed[1].type).toBe('tag_submission');
      expect(feed[2].type).toBe('scan_session');
    });

    it('should return empty array when no activity', async () => {
      prisma.scanSession.findMany.mockResolvedValueOnce([]);
      prisma.message.findMany.mockResolvedValueOnce([]);
      prisma.tagSet.findMany.mockResolvedValueOnce([]);

      const feed = await service.getFeed('p1');
      expect(feed).toEqual([]);
    });
  });

  describe('getComplianceStats', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate 100% compliance when all patients are on time', () => {
      const recentDate = new Date('2025-01-10T12:00:00Z'); // 5 days ago, within 14-day window
      prisma.patient.findMany.mockResolvedValueOnce([
        { id: 'p1', name: 'Alice', scanFrequency: 14, scanSessions: [{ createdAt: recentDate }] },
        { id: 'p2', name: 'Bob', scanFrequency: 14, scanSessions: [{ createdAt: recentDate }] },
      ]);

      return service.getComplianceStats('practice1').then((result) => {
        expect(result.compliancePercentage).toBe(100);
        expect(result.onTimeCount).toBe(2);
        expect(result.overdueCount).toBe(0);
      });
    });

    it('should identify overdue patients', () => {
      const oldDate = new Date('2024-12-01T12:00:00Z'); // > 14 days ago
      const recentDate = new Date('2025-01-10T12:00:00Z');
      prisma.patient.findMany.mockResolvedValueOnce([
        { id: 'p1', name: 'Alice', scanFrequency: 14, scanSessions: [{ createdAt: recentDate }] },
        { id: 'p2', name: 'Bob', scanFrequency: 14, scanSessions: [{ createdAt: oldDate }] },
      ]);

      return service.getComplianceStats('practice1').then((result) => {
        expect(result.compliancePercentage).toBe(50);
        expect(result.onTimeCount).toBe(1);
        expect(result.overdueCount).toBe(1);
        expect(result.overduePatients[0].name).toBe('Bob');
        expect(result.overduePatients[0].daysSinceLastScan).toBeGreaterThan(0);
      });
    });

    it('should treat patients with no scans as overdue with null daysSinceLastScan', () => {
      prisma.patient.findMany.mockResolvedValueOnce([
        { id: 'p1', name: 'NewPatient', scanFrequency: 14, scanSessions: [] },
      ]);

      return service.getComplianceStats('practice1').then((result) => {
        expect(result.overdueCount).toBe(1);
        expect(result.overduePatients[0].daysSinceLastScan).toBeNull();
      });
    });

    it('should return 0% when there are no active patients', () => {
      prisma.patient.findMany.mockResolvedValueOnce([]);

      return service.getComplianceStats('practice1').then((result) => {
        expect(result.compliancePercentage).toBe(0);
        expect(result.totalActive).toBe(0);
      });
    });

    it('should default scanFrequency to 14 days when null', () => {
      const recentDate = new Date('2025-01-10T12:00:00Z');
      prisma.patient.findMany.mockResolvedValueOnce([
        { id: 'p1', name: 'Alice', scanFrequency: null, scanSessions: [{ createdAt: recentDate }] },
      ]);

      return service.getComplianceStats('practice1').then((result) => {
        expect(result.onTimeCount).toBe(1);
      });
    });
  });

  describe('getTaggingRate', () => {
    it('should calculate tagging rate from session counts', async () => {
      prisma.scanSession.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);

      const result = await service.getTaggingRate('p1');

      expect(result.taggingRate).toBe(80);
      expect(result.totalSessions).toBe(10);
      expect(result.taggedSessions).toBe(8);
      expect(result.periodDays).toBe(30);
    });

    it('should return 0 when no sessions', async () => {
      prisma.scanSession.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getTaggingRate('p1');
      expect(result.taggingRate).toBe(0);
    });
  });

  describe('getSummary', () => {
    it('should combine pending scans, patients, compliance, and tagging rate', async () => {
      prisma.scanSession.count
        .mockResolvedValueOnce(5)  // pendingScans
        .mockResolvedValueOnce(20) // tagging total
        .mockResolvedValueOnce(15); // tagging tagged
      prisma.patient.count.mockResolvedValueOnce(30);
      prisma.patient.findMany.mockResolvedValueOnce([]); // compliance (no active patients)

      const result = await service.getSummary('p1');

      expect(result.pendingScans).toBe(5);
      expect(result.totalPatients).toBe(30);
      expect(result).toHaveProperty('compliancePercentage');
      expect(result).toHaveProperty('taggingRate');
    });
  });
});
