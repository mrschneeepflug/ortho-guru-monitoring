import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';

export const TEST_DATABASE_URL =
  'postgresql://ortho:ortho_secret@localhost:5432/orthomonitor_test';

export const BASELINE = {
  practiceId: 'e2e-practice-001',
  adminDoctorId: 'e2e-doctor-admin',
  regularDoctorId: 'e2e-doctor-regular',
  adminEmail: 'admin-e2e@test.com',
  doctorEmail: 'doctor-e2e@test.com',
  password: 'password123',
} as const;

/**
 * Login as a baseline user and return the JWT access token.
 */
export async function loginAs(
  app: INestApplication,
  email: string = BASELINE.doctorEmail,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: BASELINE.password })
    .expect(200);

  return res.body.data.accessToken;
}

/**
 * Truncate all tables except the baseline practice and doctors.
 * Call this in beforeAll/beforeEach to start each suite with a clean state.
 */
export async function resetDb(prisma: PrismaService): Promise<void> {
  // Delete in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.tagSet.deleteMany();
  await prisma.scanImage.deleteMany();
  await prisma.scanSession.deleteMany();
  await prisma.patient.deleteMany();
  // Remove non-baseline doctors
  await prisma.doctor.deleteMany({
    where: {
      id: { notIn: [BASELINE.adminDoctorId, BASELINE.regularDoctorId] },
    },
  });
  // Remove non-baseline practices
  await prisma.practice.deleteMany({
    where: { id: { notIn: [BASELINE.practiceId] } },
  });
}
