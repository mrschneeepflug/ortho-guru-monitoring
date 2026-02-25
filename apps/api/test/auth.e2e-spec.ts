import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new doctor and return token + user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Dr. New',
          email: 'newdoc@test.com',
          password: 'password123',
          practiceId: BASELINE.practiceId,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toMatchObject({
        email: 'newdoc@test.com',
        name: 'Dr. New',
        role: 'DOCTOR',
        practiceId: BASELINE.practiceId,
      });
      expect(res.body.data.user).toHaveProperty('id');
    });

    it('should return 409 for duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Another Doc',
          email: BASELINE.doctorEmail,
          password: 'password123',
          practiceId: BASELINE.practiceId,
        })
        .expect(409);

      expect(res.body.statusCode).toBe(409);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'incomplete@test.com' })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Bad Email',
          email: 'not-an-email',
          password: 'password123',
          practiceId: BASELINE.practiceId,
        })
        .expect(400);
    });

    it('should return 400 for password shorter than 6 chars', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@test.com',
          password: '12345',
          practiceId: BASELINE.practiceId,
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials and return token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: BASELINE.doctorEmail,
          password: BASELINE.password,
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toMatchObject({
        email: BASELINE.doctorEmail,
        role: 'DOCTOR',
        practiceId: BASELINE.practiceId,
      });
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: BASELINE.doctorEmail,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
    });

    it('should return 401 for unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nobody@test.com',
          password: 'password123',
        })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
    });
  });

  describe('Auth guard', () => {
    it('should return 401 for requests without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patients')
        .expect(401);
    });

    it('should return 200 for requests with valid token', async () => {
      const token = await loginAs(app);

      await request(app.getHttpServer())
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
