import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/prisma/prisma.service';
import { createTestApp } from './app.factory';
import { resetDb, BASELINE, loginAs } from './helpers';

describe('Messaging (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let patientId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDb(prisma);
    token = await loginAs(app);

    const patient = await prisma.patient.create({
      data: {
        name: 'Messaging Patient',
        practiceId: BASELINE.practiceId,
        doctorId: BASELINE.regularDoctorId,
      },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/messaging/threads', () => {
    it('should create a thread for a patient', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/messaging/threads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          patientId,
          subject: 'Test Thread',
        })
        .expect(201);

      expect(res.body.data).toMatchObject({
        patientId,
        subject: 'Test Thread',
        isActive: true,
      });
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 404 when patient is not in practice', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/messaging/threads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          patientId: 'nonexistent-patient-id',
          subject: 'Should Fail',
        })
        .expect(404);
    });

    it('should return 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/messaging/threads')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/messaging/threads', () => {
    it('should list threads with lastMessage and unreadCount', async () => {
      // Create a thread with a message
      const thread = await prisma.messageThread.create({
        data: { patientId, subject: 'Listed Thread' },
      });
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderType: 'DOCTOR',
          senderId: BASELINE.regularDoctorId,
          content: 'Hello from thread list test',
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/messaging/threads')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      const listed = res.body.data.find((t: any) => t.id === thread.id);
      expect(listed).toBeDefined();
      expect(listed.lastMessage).toBeDefined();
      expect(listed).toHaveProperty('unreadCount');
    });
  });

  describe('GET /api/v1/messaging/threads/:id', () => {
    it('should return thread with messages', async () => {
      const thread = await prisma.messageThread.create({
        data: { patientId, subject: 'Detail Thread' },
      });
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderType: 'DOCTOR',
          senderId: BASELINE.regularDoctorId,
          content: 'Detail message',
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/messaging/threads/${thread.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: thread.id,
        subject: 'Detail Thread',
      });
      expect(res.body.data.messages).toBeDefined();
      expect(res.body.data.messages.length).toBeGreaterThan(0);
    });

    it('should return 404 for nonexistent thread', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/messaging/threads/nonexistent-thread-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/messaging/messages', () => {
    let threadId: string;

    beforeAll(async () => {
      const thread = await prisma.messageThread.create({
        data: { patientId, subject: 'Message Thread' },
      });
      threadId = thread.id;
    });

    it('should send a message in a thread', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/messaging/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          threadId,
          content: 'Hello from E2E test',
        })
        .expect(201);

      expect(res.body.data).toMatchObject({
        threadId,
        content: 'Hello from E2E test',
        senderType: 'DOCTOR',
      });
      expect(res.body.data.readAt).toBeNull();
    });

    it('should return 404 when thread is not in practice', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/messaging/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          threadId: 'nonexistent-thread-id',
          content: 'Should fail',
        })
        .expect(404);
    });
  });

  describe('PATCH /api/v1/messaging/messages/:id/read', () => {
    it('should set readAt on a message', async () => {
      const thread = await prisma.messageThread.create({
        data: { patientId, subject: 'Read Test Thread' },
      });
      const msg = await prisma.message.create({
        data: {
          threadId: thread.id,
          senderType: 'PATIENT',
          senderId: patientId,
          content: 'Unread message',
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/messaging/messages/${msg.id}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.readAt).toBeDefined();
      expect(res.body.data.readAt).not.toBeNull();
    });

    it('should return 404 for cross-practice message', async () => {
      // Create message in another practice
      const otherPractice = await prisma.practice.create({
        data: { name: 'Other Msg Practice' },
      });
      const otherHash = await import('bcryptjs').then((b) =>
        b.hash('password123', 10),
      );
      const otherDoctor = await prisma.doctor.create({
        data: {
          practiceId: otherPractice.id,
          name: 'Other Msg Doctor',
          email: 'other-msg-doc@test.com',
          passwordHash: otherHash,
        },
      });
      const otherPatient = await prisma.patient.create({
        data: {
          name: 'Other Msg Patient',
          practiceId: otherPractice.id,
          doctorId: otherDoctor.id,
        },
      });
      const otherThread = await prisma.messageThread.create({
        data: { patientId: otherPatient.id, subject: 'Other Thread' },
      });
      const otherMsg = await prisma.message.create({
        data: {
          threadId: otherThread.id,
          senderType: 'DOCTOR',
          senderId: otherDoctor.id,
          content: 'Cross-practice msg',
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/messaging/messages/${otherMsg.id}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
