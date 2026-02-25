import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Multi-tenancy (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let practice1Token: string;
  let practice2Token: string;
  let practice1PatientId: string;
  let practice2PatientId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);

    // Login as practice 1 doctor
    practice1Token = await loginAs(app);

    // Create practice 2 with its own doctor
    const practice2 = await prisma.practice.create({
      data: { id: 'e2e-practice-002', name: 'Practice Two' },
    });
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.doctor.create({
      data: {
        id: 'e2e-doctor-p2',
        practiceId: practice2.id,
        name: 'Practice 2 Doctor',
        email: 'doctor-p2@test.com',
        passwordHash,
      },
    });
    practice2Token = await loginAs(app, 'doctor-p2@test.com');

    // Create patients in each practice
    const p1Patient = await prisma.patient.create({
      data: {
        name: 'Practice 1 Patient',
        practiceId: BASELINE.practiceId,
        doctorId: BASELINE.regularDoctorId,
      },
    });
    practice1PatientId = p1Patient.id;

    const p2Patient = await prisma.patient.create({
      data: {
        name: 'Practice 2 Patient',
        practiceId: practice2.id,
        doctorId: 'e2e-doctor-p2',
      },
    });
    practice2PatientId = p2Patient.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('practice 2 should see empty patient list initially (no other practice data)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${practice2Token}`)
      .expect(200);

    // Practice 2 should only see its own patient
    const names = res.body.data.items.map((p: any) => p.name);
    expect(names).toContain('Practice 2 Patient');
    expect(names).not.toContain('Practice 1 Patient');
  });

  it('practice 2 patient should only be visible to practice 2', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/patients/${practice2PatientId}`)
      .set('Authorization', `Bearer ${practice2Token}`)
      .expect(200);

    expect(res.body.data.name).toBe('Practice 2 Patient');
  });

  it('practice 1 cannot see practice 2 patient by ID', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/patients/${practice2PatientId}`)
      .set('Authorization', `Bearer ${practice1Token}`)
      .expect(404);
  });

  it('practice 1 cannot update practice 2 patient', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/patients/${practice2PatientId}`)
      .set('Authorization', `Bearer ${practice1Token}`)
      .send({ name: 'Hacked Name' })
      .expect(404);
  });

  it('cross-practice scan session access should be denied', async () => {
    // Create a session for practice 2's patient
    const session = await prisma.scanSession.create({
      data: { patientId: practice2PatientId, status: 'PENDING' },
    });

    // Practice 1 should not see it
    await request(app.getHttpServer())
      .get(`/api/v1/scans/sessions/${session.id}`)
      .set('Authorization', `Bearer ${practice1Token}`)
      .expect(404);
  });

  it('cross-practice thread creation should be denied', async () => {
    // Practice 1 tries to create a thread for practice 2's patient
    await request(app.getHttpServer())
      .post('/api/v1/messaging/threads')
      .set('Authorization', `Bearer ${practice1Token}`)
      .send({
        patientId: practice2PatientId,
        subject: 'Cross-practice thread',
      })
      .expect(404);
  });

  it('cross-practice scan session creation should be denied', async () => {
    // Practice 1 tries to create a scan for practice 2's patient
    await request(app.getHttpServer())
      .post('/api/v1/scans/sessions')
      .set('Authorization', `Bearer ${practice1Token}`)
      .send({ patientId: practice2PatientId })
      .expect(404);
  });
});
