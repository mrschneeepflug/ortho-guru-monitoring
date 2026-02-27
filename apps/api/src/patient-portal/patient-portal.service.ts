import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ScanStatus, ImageType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PatientPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ─── Profile ────────────────────────────────────────

  async getProfile(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        doctor: { select: { name: true } },
        scanSessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    if (!patient) throw new NotFoundException('Patient not found');

    const lastScanDate = patient.scanSessions[0]?.createdAt || null;
    const nextScanDue = lastScanDate
      ? new Date(lastScanDate.getTime() + patient.scanFrequency * 24 * 60 * 60 * 1000)
      : null;

    return {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      treatmentType: patient.treatmentType,
      alignerBrand: patient.alignerBrand,
      currentStage: patient.currentStage,
      totalStages: patient.totalStages,
      scanFrequency: patient.scanFrequency,
      status: patient.status,
      doctorName: patient.doctor.name,
      lastScanDate,
      nextScanDue,
    };
  }

  // ─── Scans ──────────────────────────────────────────

  async listScans(patientId: string) {
    return this.prisma.scanSession.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async createScanSession(patientId: string) {
    return this.prisma.scanSession.create({
      data: {
        patientId,
        status: ScanStatus.PENDING,
      },
    });
  }

  async generateUploadUrl(patientId: string, sessionId: string, imageType: ImageType) {
    const session = await this.verifySessionOwnership(sessionId, patientId);
    if (!session) throw new NotFoundException('Scan session not found');

    const ext = 'jpg';
    const key = this.storage.buildKey(sessionId, imageType, ext);

    if (this.storage.isCloudEnabled()) {
      const url = await this.storage.generateUploadUrl(key, `image/${ext}`);
      return { url, key };
    }

    return { url: `/uploads/${key}`, key };
  }

  async confirmUpload(
    patientId: string,
    sessionId: string,
    imageType: ImageType,
    key: string,
  ) {
    const session = await this.verifySessionOwnership(sessionId, patientId);
    if (!session) throw new NotFoundException('Scan session not found');

    const [scanImage] = await this.prisma.$transaction([
      this.prisma.scanImage.create({
        data: { sessionId, imageType, s3Key: key },
      }),
      this.prisma.scanSession.update({
        where: { id: sessionId },
        data: { imageCount: { increment: 1 } },
      }),
    ]);

    return scanImage;
  }

  async handleLocalUpload(
    patientId: string,
    sessionId: string,
    imageType: ImageType,
    file: Express.Multer.File,
  ) {
    const session = await this.verifySessionOwnership(sessionId, patientId);
    if (!session) throw new NotFoundException('Scan session not found');

    const ext = (path.extname(file.originalname) || '.jpg').replace('.', '');
    const key = this.storage.buildKey(sessionId, imageType, ext);

    if (this.storage.isCloudEnabled()) {
      await this.storage.putObject(key, file.buffer, file.mimetype || `image/${ext}`);

      const [scanImage] = await this.prisma.$transaction([
        this.prisma.scanImage.create({
          data: { sessionId, imageType, s3Key: key },
        }),
        this.prisma.scanSession.update({
          where: { id: sessionId },
          data: { imageCount: { increment: 1 } },
        }),
      ]);

      return scanImage;
    }

    // Local filesystem fallback
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${sessionId}-${imageType}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const [scanImage] = await this.prisma.$transaction([
      this.prisma.scanImage.create({
        data: { sessionId, imageType, localPath: filePath },
      }),
      this.prisma.scanSession.update({
        where: { id: sessionId },
        data: { imageCount: { increment: 1 } },
      }),
    ]);

    return scanImage;
  }

  async getImageUrl(patientId: string, imageId: string) {
    const image = await this.prisma.scanImage.findFirst({
      where: {
        id: imageId,
        session: { patientId },
      },
    });

    if (!image) throw new NotFoundException('Scan image not found');

    if (image.s3Key && this.storage.isCloudEnabled()) {
      const url = await this.storage.generateDownloadUrl(image.s3Key);
      return { url };
    }

    return { url: image.localPath || null };
  }

  // ─── Messages ───────────────────────────────────────

  async listThreads(patientId: string) {
    const threads = await this.prisma.messageThread.findMany({
      where: { patientId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: { readAt: null, senderType: { not: 'PATIENT' } },
            },
          },
        },
      },
    });

    return threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      isActive: t.isActive,
      lastMessage: t.messages[0] || null,
      unreadCount: t._count.messages,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  async getThread(patientId: string, threadId: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId, patientId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!thread) throw new NotFoundException('Message thread not found');
    return thread;
  }

  async sendMessage(patientId: string, threadId: string, content: string) {
    // Verify thread ownership
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId, patientId },
    });

    if (!thread) throw new NotFoundException('Message thread not found');

    const message = await this.prisma.message.create({
      data: {
        threadId,
        senderType: 'PATIENT',
        senderId: patientId,
        content,
      },
    });

    // Update thread's updatedAt
    await this.prisma.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async markMessageRead(patientId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        thread: { patientId },
      },
    });

    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }

  // ─── Helpers ────────────────────────────────────────

  private async verifySessionOwnership(sessionId: string, patientId: string) {
    return this.prisma.scanSession.findFirst({
      where: { id: sessionId, patientId },
    });
  }
}
