import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Patients (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
    token = await loginAs(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/patients', () => {
    it('should create a patient and return it with an ID', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Alice Test',
          doctorId: BASELINE.regularDoctorId,
        })
        .expect(201);

      expect(res.body.data).toMatchObject({
        name: 'Alice Test',
        doctorId: BASELINE.regularDoctorId,
        practiceId: BASELINE.practiceId,
        status: 'ACTIVE',
      });
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${token}`)
        .send({ doctorId: BASELINE.regularDoctorId })
        .expect(400);
    });

    it('should return 400 when doctorId is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'No Doctor' })
        .expect(400);
    });
  });

  describe('GET /api/v1/patients', () => {
    let patientId: string;

    beforeAll(async () => {
      // Ensure we have a patient to query
      const p = await prisma.patient.create({
        data: {
          name: 'Query Patient',
          practiceId: BASELINE.practiceId,
          doctorId: BASELINE.regularDoctorId,
          status: 'ACTIVE',
        },
      });
      patientId = p.id;

      // Create a PAUSED patient for filter tests
      await prisma.patient.create({
        data: {
          name: 'Paused Patient',
          practiceId: BASELINE.practiceId,
          doctorId: BASELINE.regularDoctorId,
          status: 'PAUSED',
        },
      });
    });

    it('should return paginated list of patients', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('limit');
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patients?status=PAUSED')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const items = res.body.data.items;
      expect(items.length).toBeGreaterThan(0);
      items.forEach((p: any) => expect(p.status).toBe('PAUSED'));
    });

    it('should search by name (case-insensitive)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patients?search=query')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const items = res.body.data.items;
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].name.toLowerCase()).toContain('query');
    });

    it('should respect pagination parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patients?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.items.length).toBeLessThanOrEqual(1);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(1);
    });

    it('should get a single patient by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: patientId,
        name: 'Query Patient',
      });
    });

    it('should return 404 for nonexistent patient', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patients/nonexistent-id-000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/patients/:id', () => {
    let patientId: string;

    beforeAll(async () => {
      const p = await prisma.patient.create({
        data: {
          name: 'Updatable Patient',
          practiceId: BASELINE.practiceId,
          doctorId: BASELINE.regularDoctorId,
        },
      });
      patientId = p.id;
    });

    it('should update patient fields', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name', status: 'PAUSED' })
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: patientId,
        name: 'Updated Name',
        status: 'PAUSED',
      });
    });
  });

  describe('Practice isolation', () => {
    it('should only return patients belonging to the logged-in practice', async () => {
      // Create a second practice + doctor directly
      const otherPractice = await prisma.practice.create({
        data: { id: 'e2e-other-practice', name: 'Other Practice' },
      });
      const otherPasswordHash = await import('bcryptjs').then((b) =>
        b.hash('password123', 10),
      );
      await prisma.doctor.create({
        data: {
          id: 'e2e-other-doctor',
          practiceId: otherPractice.id,
          name: 'Other Doctor',
          email: 'other-doc@test.com',
          passwordHash: otherPasswordHash,
        },
      });
      await prisma.patient.create({
        data: {
          name: 'Other Practice Patient',
          practiceId: otherPractice.id,
          doctorId: 'e2e-other-doctor',
        },
      });

      // Login as practice-1 doctor — should NOT see the other practice's patient
      const res = await request(app.getHttpServer())
        .get('/api/v1/patients?search=Other Practice Patient')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.items.length).toBe(0);
    });
  });
});
