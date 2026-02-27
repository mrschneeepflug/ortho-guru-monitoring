import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  NotImplementedException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService, AiTagSuggestion } from '../common/ai/ai.service';
import { StorageService } from '../common/storage/storage.service';
import { CreateTagSetDto } from './dto/create-tag-set.dto';

@Injectable()
export class TaggingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly storageService: StorageService,
  ) {}

  async createTagSet(
    sessionId: string,
    dto: CreateTagSetDto,
    taggedById: string,
    practiceId: string,
  ) {
    // Verify the session exists and its patient belongs to the practice
    const session = await this.prisma.scanSession.findUnique({
      where: { id: sessionId },
      include: { patient: true },
    });

    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${sessionId}" not found`,
      );
    }

    if (session.patient.practiceId !== practiceId) {
      throw new ForbiddenException(
        'You do not have access to this scan session',
      );
    }

    // Create the TagSet and update session status in a transaction
    const [tagSet] = await this.prisma.$transaction([
      this.prisma.tagSet.create({
        data: {
          sessionId,
          taggedById,
          overallTracking: dto.overallTracking,
          alignerFit: dto.alignerFit ?? null,
          oralHygiene: dto.oralHygiene,
          detailTags: dto.detailTags ?? [],
          actionTaken: dto.actionTaken ?? null,
          notes: dto.notes ?? null,
          aiSuggested: dto.aiSuggested ?? false,
          aiOverridden: dto.aiOverridden ?? false,
        },
        include: { taggedBy: { select: { id: true, name: true } } },
      }),
      this.prisma.scanSession.update({
        where: { id: sessionId },
        data: {
          status: 'REVIEWED',
          reviewedById: taggedById,
          reviewedAt: new Date(),
        },
      }),
    ]);

    return tagSet;
  }

  async findBySession(sessionId: string, practiceId: string) {
    const tagSet = await this.prisma.tagSet.findUnique({
      where: { sessionId },
      include: {
        taggedBy: { select: { id: true, name: true } },
        session: { include: { patient: true } },
      },
    });

    if (!tagSet || tagSet.session.patient.practiceId !== practiceId) {
      throw new NotFoundException(
        `Tags for session "${sessionId}" not found`,
      );
    }

    return tagSet;
  }

  async findByDoctor(doctorId: string, practiceId: string) {
    return this.prisma.tagSet.findMany({
      where: {
        taggedById: doctorId,
        session: {
          patient: { practiceId },
        },
      },
      include: {
        session: {
          select: { id: true, patientId: true, createdAt: true },
        },
        taggedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async suggestTags(
    sessionId: string,
    practiceId: string,
  ): Promise<AiTagSuggestion> {
    if (!this.aiService.isEnabled()) {
      throw new NotImplementedException('AI suggestions are not configured');
    }

    const session = await this.prisma.scanSession.findUnique({
      where: { id: sessionId },
      include: { patient: true, images: true },
    });

    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${sessionId}" not found`,
      );
    }

    if (session.patient.practiceId !== practiceId) {
      throw new ForbiddenException(
        'You do not have access to this scan session',
      );
    }

    const imagesWithKeys = session.images.filter((img) => img.s3Key);
    if (imagesWithKeys.length === 0) {
      throw new NotFoundException(
        'No images available for AI analysis in this session',
      );
    }

    const imageBuffers = await Promise.all(
      imagesWithKeys.map(async (img) => ({
        mediaType: 'image/jpeg',
        buffer: await this.storageService.getObject(img.s3Key!),
      })),
    );

    return this.aiService.analyzeScanImages(imageBuffers);
  }
}
