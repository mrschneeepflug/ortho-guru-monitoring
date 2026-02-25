import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Practices (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let doctorToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
    adminToken = await loginAs(app, BASELINE.adminEmail);
    doctorToken = await loginAs(app, BASELINE.doctorEmail);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/practices', () => {
    beforeAll(async () => {
      // Create a second practice so ADMIN can see multiple
      await prisma.practice.create({
        data: {
          id: 'e2e-practice-second',
          name: 'Second Practice',
        },
      });
    });

    it('as ADMIN should return all practices', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/practices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('as DOCTOR should return only own practice', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/practices')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(BASELINE.practiceId);
    });
  });

  describe('GET /api/v1/practices/:id', () => {
    it('should return own practice details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/practices/${BASELINE.practiceId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: BASELINE.practiceId,
        name: 'E2E Test Practice',
      });
    });

    it('should return 403 for cross-practice access', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/practices/e2e-practice-second')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });
  });

  describe('PATCH /api/v1/practices/:id', () => {
    it('should update own practice', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/practices/${BASELINE.practiceId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ phone: '555-9999' })
        .expect(200);

      expect(res.body.data.phone).toBe('555-9999');
    });

    it('should return 403 for cross-practice update', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/practices/e2e-practice-second')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ name: 'Hacked Name' })
        .expect(403);
    });
  });
});
