import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
    token = await loginAs(app);

    // Seed dashboard test data
    const patient = await prisma.patient.create({
      data: {
        name: 'Dashboard Patient',
        practiceId: BASELINE.practiceId,
        doctorId: BASELINE.regularDoctorId,
        status: 'ACTIVE',
        scanFrequency: 14,
      },
    });

    // Create scan sessions
    const pendingSession = await prisma.scanSession.create({
      data: { patientId: patient.id, status: 'PENDING' },
    });
    const reviewedSession = await prisma.scanSession.create({
      data: {
        patientId: patient.id,
        status: 'REVIEWED',
        reviewedById: BASELINE.regularDoctorId,
        reviewedAt: new Date(),
      },
    });

    // Create a tag set for the reviewed session
    await prisma.tagSet.create({
      data: {
        sessionId: reviewedSession.id,
        taggedById: BASELINE.regularDoctorId,
        overallTracking: 1,
        oralHygiene: 2,
      },
    });

    // Create a message thread + message
    const thread = await prisma.messageThread.create({
      data: { patientId: patient.id, subject: 'Dashboard Thread' },
    });
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderType: 'DOCTOR',
        senderId: BASELINE.regularDoctorId,
        content: 'Dashboard test message',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/dashboard/summary', () => {
    it('should return pendingScans, totalPatients, compliancePercentage, taggingRate', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('pendingScans');
      expect(res.body.data).toHaveProperty('totalPatients');
      expect(res.body.data).toHaveProperty('compliancePercentage');
      expect(res.body.data).toHaveProperty('taggingRate');
    });

    it('should reflect actual database state', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // We created 1 pending scan and 1 patient
      expect(res.body.data.pendingScans).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalPatients).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.data.compliancePercentage).toBe('number');
      expect(typeof res.body.data.taggingRate).toBe('number');
    });
  });

  describe('GET /api/v1/dashboard/feed', () => {
    it('should return merged feed sorted by date desc', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/feed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const feed = res.body.data;
      expect(Array.isArray(feed)).toBe(true);
      expect(feed.length).toBeGreaterThan(0);

      // Verify sorted by date descending
      for (let i = 1; i < feed.length; i++) {
        expect(new Date(feed[i - 1].date).getTime()).toBeGreaterThanOrEqual(
          new Date(feed[i].date).getTime(),
        );
      }
    });

    it('should include scan_session, message, and tag_submission types', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/feed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const types = res.body.data.map((item: any) => item.type);
      expect(types).toContain('scan_session');
      expect(types).toContain('message');
      expect(types).toContain('tag_submission');
    });
  });

  describe('GET /api/v1/dashboard/compliance', () => {
    it('should return totalActive, onTimeCount, overdueCount', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/compliance')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('totalActive');
      expect(res.body.data).toHaveProperty('onTimeCount');
      expect(res.body.data).toHaveProperty('overdueCount');
      expect(res.body.data).toHaveProperty('compliancePercentage');
    });

    it('should list overdue patients with daysSinceLastScan', async () => {
      // Create an overdue patient (no scans, will be overdue)
      await prisma.patient.create({
        data: {
          name: 'Overdue Dashboard Patient',
          practiceId: BASELINE.practiceId,
          doctorId: BASELINE.regularDoctorId,
          status: 'ACTIVE',
          scanFrequency: 1, // 1-day frequency means definitely overdue
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/compliance')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.overduePatients).toBeDefined();
      const overdue = res.body.data.overduePatients.find(
        (p: any) => p.name === 'Overdue Dashboard Patient',
      );
      expect(overdue).toBeDefined();
      // daysSinceLastScan is null when patient has never been scanned
      expect(overdue.daysSinceLastScan).toBeNull();
    });
  });
});
