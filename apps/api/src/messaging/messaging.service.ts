import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { SenderType } from '@prisma/client';
import { MessageSentEvent } from '../notifications/events';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new message thread for a patient.
   * Verifies the patient belongs to the given practice before creating.
   */
  async createThread(dto: CreateThreadDto, practiceId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, practiceId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID "${dto.patientId}" not found in this practice`,
      );
    }

    return this.prisma.messageThread.create({
      data: {
        patientId: dto.patientId,
        subject: dto.subject,
      },
      include: {
        messages: true,
      },
    });
  }

  /**
   * List all message threads for a practice.
   * Threads are found through the patient→practice relation.
   * Includes the last message and a count of unread messages.
   */
  async findAllThreads(practiceId: string) {
    const threads = await this.prisma.messageThread.findMany({
      where: {
        patient: { practiceId },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: { where: { readAt: null } },
          },
        },
      },
    });

    return threads.map((thread) => ({
      id: thread.id,
      patientId: thread.patientId,
      subject: thread.subject,
      isActive: thread.isActive,
      lastMessage: thread.messages[0] ?? null,
      unreadCount: thread._count.messages,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    }));
  }

  /**
   * Get a single thread with all its messages.
   * Verifies the thread's patient belongs to the given practice.
   */
  async findThread(threadId: string, practiceId: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: {
        id: threadId,
        patient: { practiceId },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            messages: { where: { readAt: null } },
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException(
        `Thread with ID "${threadId}" not found`,
      );
    }

    return {
      id: thread.id,
      patientId: thread.patientId,
      subject: thread.subject,
      isActive: thread.isActive,
      lastMessage: thread.messages[thread.messages.length - 1] ?? null,
      unreadCount: thread._count.messages,
      messages: thread.messages,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  }

  /**
   * Send a message within an existing thread.
   * Validates that the thread exists and belongs to the user's practice.
   */
  async sendMessage(
    dto: CreateMessageDto,
    userId: string,
    userRole: string,
    practiceId: string,
  ) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: dto.threadId, patient: { practiceId } },
      include: { patient: true },
    });

    if (!thread) {
      throw new NotFoundException(
        `Thread with ID "${dto.threadId}" not found`,
      );
    }

    const senderType = dto.senderType ?? SenderType.DOCTOR;

    const message = await this.prisma.message.create({
      data: {
        threadId: dto.threadId,
        senderType,
        senderId: userId,
        content: dto.content,
      },
    });

    if (senderType === SenderType.DOCTOR || senderType === SenderType.SYSTEM) {
      const preview =
        dto.content.length > 100
          ? dto.content.slice(0, 100) + '...'
          : dto.content;
      this.eventEmitter.emit(
        'message.sent',
        new MessageSentEvent(dto.threadId, thread.patientId, preview),
      );
    }

    return message;
  }

  /**
   * Mark a single message as read by setting the readAt timestamp.
   * Verifies the message's thread belongs to the user's practice.
   */
  async markAsRead(messageId: string, userId: string, practiceId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { thread: { include: { patient: true } } },
    });

    if (!message || message.thread.patient.practiceId !== practiceId) {
      throw new NotFoundException(
        `Message with ID "${messageId}" not found`,
      );
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }
}
