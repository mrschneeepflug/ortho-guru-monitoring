import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Scans (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let patientId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
    token = await loginAs(app);

    // Create a patient for scan tests
    const patient = await prisma.patient.create({
      data: {
        name: 'Scan Test Patient',
        practiceId: BASELINE.practiceId,
        doctorId: BASELINE.regularDoctorId,
      },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/scans/sessions', () => {
    it('should create a session with PENDING status', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/scans/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({ patientId })
        .expect(201);

      expect(res.body.data).toMatchObject({
        patientId,
        status: 'PENDING',
      });
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.patient).toMatchObject({
        id: patientId,
        name: 'Scan Test Patient',
      });
    });

    it('should return 404 when patient is not in practice', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/scans/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({ patientId: 'nonexistent-patient-id' })
        .expect(404);
    });

    it('should return 400 when patientId is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/scans/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/scans/sessions', () => {
    let sessionId: string;

    beforeAll(async () => {
      const session = await prisma.scanSession.create({
        data: { patientId, status: 'PENDING' },
      });
      sessionId = session.id;
    });

    it('should return paginated list of sessions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/scans/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/scans/sessions?status=PENDING')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      res.body.data.items.forEach((s: any) =>
        expect(s.status).toBe('PENDING'),
      );
    });

    it('should get a session by ID with images and tagSet', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/scans/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toMatchObject({ id: sessionId });
      expect(res.body.data).toHaveProperty('images');
      expect(res.body.data).toHaveProperty('tagSet');
      expect(res.body.data).toHaveProperty('patient');
    });

    it('should return 404 for nonexistent session', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/scans/sessions/nonexistent-session-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/scans/sessions/:id/status', () => {
    it('should set reviewedAt and reviewedById when status is REVIEWED', async () => {
      const session = await prisma.scanSession.create({
        data: { patientId, status: 'PENDING' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/scans/sessions/${session.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'REVIEWED' })
        .expect(200);

      expect(res.body.data.status).toBe('REVIEWED');
      expect(res.body.data.reviewedAt).toBeDefined();
      expect(res.body.data.reviewedById).toBeDefined();
    });

    it('should NOT set reviewedAt when status is FLAGGED', async () => {
      const session = await prisma.scanSession.create({
        data: { patientId, status: 'PENDING' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/scans/sessions/${session.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'FLAGGED' })
        .expect(200);

      expect(res.body.data.status).toBe('FLAGGED');
      expect(res.body.data.reviewedAt).toBeNull();
    });
  });
});
