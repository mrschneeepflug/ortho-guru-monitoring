import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

describe('MessagingService', () => {
  let service: MessagingService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useFactory: createMockPrismaService },
      ],
    }).compile();

    service = module.get(MessagingService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('createThread', () => {
    it('should create thread when patient belongs to practice', async () => {
      prisma.patient.findFirst.mockResolvedValueOnce({ id: 'p1' });
      prisma.messageThread.create.mockResolvedValueOnce({
        id: 'th1',
        subject: 'Check-in',
        messages: [],
      });

      const result = await service.createThread(
        { patientId: 'p1', subject: 'Check-in' },
        'practice1',
      );

      expect(result.subject).toBe('Check-in');
    });

    it('should throw NotFoundException when patient not in practice', async () => {
      prisma.patient.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createThread({ patientId: 'p1', subject: 'Hi' }, 'practice1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllThreads', () => {
    it('should return threads with last message and unread count', async () => {
      prisma.messageThread.findMany.mockResolvedValueOnce([
        {
          id: 'th1',
          patientId: 'p1',
          subject: 'Thread 1',
          isActive: true,
          messages: [{ id: 'm1', content: 'Latest' }],
          _count: { messages: 3 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAllThreads('practice1');

      expect(result).toHaveLength(1);
      expect(result[0].lastMessage).toEqual({ id: 'm1', content: 'Latest' });
      expect(result[0].unreadCount).toBe(3);
    });

    it('should set lastMessage to null when thread has no messages', async () => {
      prisma.messageThread.findMany.mockResolvedValueOnce([
        {
          id: 'th1',
          patientId: 'p1',
          subject: 'Empty',
          isActive: true,
          messages: [],
          _count: { messages: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAllThreads('practice1');
      expect(result[0].lastMessage).toBeNull();
    });
  });

  describe('findThread', () => {
    it('should return thread with all messages', async () => {
      prisma.messageThread.findFirst.mockResolvedValueOnce({
        id: 'th1',
        patientId: 'p1',
        subject: 'Thread',
        isActive: true,
        messages: [{ id: 'm1' }, { id: 'm2' }],
        _count: { messages: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findThread('th1', 'practice1');

      expect(result.messages).toHaveLength(2);
      expect(result.lastMessage).toEqual({ id: 'm2' });
    });

    it('should throw NotFoundException when thread not found', async () => {
      prisma.messageThread.findFirst.mockResolvedValueOnce(null);

      await expect(service.findThread('missing', 'practice1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('sendMessage', () => {
    it('should create message in thread', async () => {
      prisma.messageThread.findFirst.mockResolvedValueOnce({
        id: 'th1',
        patient: { practiceId: 'practice1' },
      });
      prisma.message.create.mockResolvedValueOnce({
        id: 'm1',
        content: 'Hello',
        senderType: 'DOCTOR',
      });

      const result = await service.sendMessage(
        { threadId: 'th1', content: 'Hello' },
        'u1',
        'DOCTOR',
        'practice1',
      );

      expect(result.content).toBe('Hello');
    });

    it('should default senderType to DOCTOR', async () => {
      prisma.messageThread.findFirst.mockResolvedValueOnce({
        id: 'th1',
        patient: { practiceId: 'practice1' },
      });
      prisma.message.create.mockResolvedValueOnce({ id: 'm1' });

      await service.sendMessage(
        { threadId: 'th1', content: 'Hi' },
        'u1',
        'DOCTOR',
        'practice1',
      );

      const createCall = prisma.message.create.mock.calls[0][0];
      expect(createCall.data.senderType).toBe('DOCTOR');
    });

    it('should throw NotFoundException when thread not found', async () => {
      prisma.messageThread.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.sendMessage({ threadId: 'missing', content: 'Hi' }, 'u1', 'DOCTOR', 'practice1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should set readAt timestamp on message', async () => {
      prisma.message.findUnique.mockResolvedValueOnce({
        id: 'm1',
        thread: { patient: { practiceId: 'practice1' } },
      });
      prisma.message.update.mockResolvedValueOnce({ id: 'm1', readAt: new Date() });

      const result = await service.markAsRead('m1', 'u1', 'practice1');
      expect(result.readAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException for cross-practice message', async () => {
      prisma.message.findUnique.mockResolvedValueOnce({
        id: 'm1',
        thread: { patient: { practiceId: 'other' } },
      });

      await expect(service.markAsRead('m1', 'u1', 'practice1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when message not found', async () => {
      prisma.message.findUnique.mockResolvedValueOnce(null);

      await expect(service.markAsRead('missing', 'u1', 'practice1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
