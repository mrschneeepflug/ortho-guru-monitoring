import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Validation (e2e)', () => {
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

  describe('Request validation', () => {
    it('should reject unknown fields (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Valid Name',
          doctorId: BASELINE.regularDoctorId,
          unknownField: 'should be rejected',
        })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should reject wrong types', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tagging/sessions/some-session/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({
          overallTracking: 'not-a-number',
          oralHygiene: 'not-a-number',
        })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });

    it('should reject empty body for endpoints requiring data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });

    it('should reject values out of range', async () => {
      // Tag scores must be 1-3
      const patient = await prisma.patient.create({
        data: {
          name: 'Validation Patient',
          practiceId: BASELINE.practiceId,
          doctorId: BASELINE.regularDoctorId,
        },
      });
      const session = await prisma.scanSession.create({
        data: { patientId: patient.id, status: 'PENDING' },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/tagging/sessions/${session.id}/tags`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          overallTracking: 5, // max is 3
          oralHygiene: 0, // min is 1
        })
        .expect(400);
    });
  });

  describe('Error response shape', () => {
    it('should include statusCode, message, and timestamp in error responses', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'bad', password: '123' })
        .expect(400);

      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('Prisma constraint handling', () => {
    it('should return 409 for unique constraint violation (duplicate email)', async () => {
      // Register once
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate Test',
          email: 'dup-test@test.com',
          password: 'password123',
          practiceId: BASELINE.practiceId,
        })
        .expect(201);

      // Register again with same email
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate Test 2',
          email: 'dup-test@test.com',
          password: 'password123',
          practiceId: BASELINE.practiceId,
        })
        .expect(409);

      expect(res.body.statusCode).toBe(409);
    });
  });
});
