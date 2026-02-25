import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Tagging (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let patientId: string;
  let sessionId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
    token = await loginAs(app);

    const patient = await prisma.patient.create({
      data: {
        name: 'Tag Test Patient',
        practiceId: BASELINE.practiceId,
        doctorId: BASELINE.regularDoctorId,
      },
    });
    patientId = patient.id;

    const session = await prisma.scanSession.create({
      data: { patientId, status: 'PENDING' },
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/tagging/sessions/:sessionId/tags', () => {
    it('should create a tag set and mark session REVIEWED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tagging/sessions/${sessionId}/tags`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          overallTracking: 2,
          oralHygiene: 1,
          alignerFit: 3,
          notes: 'Looks good overall',
        })
        .expect(201);

      expect(res.body.data).toMatchObject({
        sessionId,
        overallTracking: 2,
        oralHygiene: 1,
        alignerFit: 3,
      });
      expect(res.body.data.taggedBy).toBeDefined();

      // Verify session status was updated
      const updated = await prisma.scanSession.findUnique({
        where: { id: sessionId },
      });
      expect(updated!.status).toBe('REVIEWED');
      expect(updated!.reviewedAt).toBeTruthy();
    });

    it('should return 403 for cross-practice session', async () => {
      // Create a second practice with its own patient + session
      const otherPractice = await prisma.practice.create({
        data: { name: 'Other Tag Practice' },
      });
      const otherPasswordHash = await import('bcryptjs').then((b) =>
        b.hash('password123', 10),
      );
      const otherDoctor = await prisma.doctor.create({
        data: {
          practiceId: otherPractice.id,
          name: 'Other Tag Doctor',
          email: 'other-tag-doc@test.com',
          passwordHash: otherPasswordHash,
        },
      });
      const otherPatient = await prisma.patient.create({
        data: {
          name: 'Other Tag Patient',
          practiceId: otherPractice.id,
          doctorId: otherDoctor.id,
        },
      });
      const otherSession = await prisma.scanSession.create({
        data: { patientId: otherPatient.id, status: 'PENDING' },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/tagging/sessions/${otherSession.id}/tags`)
        .set('Authorization', `Bearer ${token}`)
        .send({ overallTracking: 1, oralHygiene: 1 })
        .expect(403);
    });

    it('should return 404 for nonexistent session', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tagging/sessions/nonexistent-session/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ overallTracking: 1, oralHygiene: 1 })
        .expect(404);
    });
  });

  describe('GET /api/v1/tagging/sessions/:sessionId/tags', () => {
    it('should return the tag set for a session', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tagging/sessions/${sessionId}/tags`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        sessionId,
        overallTracking: 2,
      });
    });

    it('should return 404 for cross-practice session tags', async () => {
      // Use a session from another practice (created above)
      const otherSession = await prisma.scanSession.findFirst({
        where: { patient: { practiceId: { not: BASELINE.practiceId } } },
      });

      if (otherSession) {
        await request(app.getHttpServer())
          .get(`/api/v1/tagging/sessions/${otherSession.id}/tags`)
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      }
    });
  });

  describe('GET /api/v1/tagging/analytics', () => {
    it('should return tagging rate, discount, and session counts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tagging/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('taggingRate');
      expect(res.body.data).toHaveProperty('discountPercent');
      expect(res.body.data).toHaveProperty('totalSessions');
      expect(res.body.data).toHaveProperty('taggedSessions');
      expect(res.body.data).toHaveProperty('period');
    });

    it('should return rate 0 when no sessions exist for a new practice', async () => {
      // Create a fresh practice + doctor to test zero-state
      const freshPractice = await prisma.practice.create({
        data: { name: 'Fresh Analytics Practice' },
      });
      const freshHash = await import('bcryptjs').then((b) =>
        b.hash('password123', 10),
      );
      await prisma.doctor.create({
        data: {
          practiceId: freshPractice.id,
          name: 'Fresh Doctor',
          email: 'fresh-analytics@test.com',
          passwordHash: freshHash,
        },
      });

      const freshToken = await loginAs(app, 'fresh-analytics@test.com');

      const res = await request(app.getHttpServer())
        .get('/api/v1/tagging/analytics')
        .set('Authorization', `Bearer ${freshToken}`)
        .expect(200);

      expect(res.body.data.taggingRate).toBe(0);
      expect(res.body.data.totalSessions).toBe(0);
    });
  });
});
