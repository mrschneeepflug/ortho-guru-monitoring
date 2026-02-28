import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ScanStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { SessionQueryDto } from './dto/session-query.dto';
import { ScanReviewedEvent, ScanFlaggedEvent } from '../notifications/events';

@Injectable()
export class ScansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new scan session for a patient.
   * Verifies the patient belongs to the given practice before creating.
   */
  async createSession(patientId: string, practiceId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, practiceId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID "${patientId}" not found in this practice`,
      );
    }

    return this.prisma.scanSession.create({
      data: {
        patientId,
        status: ScanStatus.PENDING,
      },
      include: {
        patient: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Paginated list of scan sessions scoped to a practice.
   * Joins with patient to display patient name and verify practice scope.
   * Optionally filters by ScanStatus.
   */
  async findAll(practiceId: string, query: SessionQueryDto) {
    const { page = 1, limit = 20, status, patientId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ScanSessionWhereInput = {
      patient: { practiceId },
    };

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.scanSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, name: true } },
        },
      }),
      this.prisma.scanSession.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Find a single scan session by ID with images and tagSet included.
   * Verifies the session's patient belongs to the given practice.
   */
  async findOne(id: string, practiceId: string) {
    const session = await this.prisma.scanSession.findFirst({
      where: {
        id,
        patient: { practiceId },
      },
      include: {
        patient: { select: { id: true, name: true } },
        images: { orderBy: { createdAt: 'asc' } },
        tagSet: true,
      },
    });

    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${id}" not found`,
      );
    }

    return session;
  }

  /**
   * Update the status of a scan session.
   * If the new status is REVIEWED, sets reviewedAt and reviewedById.
   * Verifies the session's patient belongs to the given practice.
   */
  async updateStatus(
    id: string,
    status: ScanStatus,
    reviewedById: string,
    practiceId: string,
  ) {
    // Verify the session exists and belongs to the practice
    const session = await this.prisma.scanSession.findFirst({
      where: {
        id,
        patient: { practiceId },
      },
    });

    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${id}" not found`,
      );
    }

    const data: Prisma.ScanSessionUpdateInput = { status };

    if (status === ScanStatus.REVIEWED) {
      data.reviewedAt = new Date();
      data.reviewedBy = { connect: { id: reviewedById } };
    }

    const updated = await this.prisma.scanSession.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, name: true } },
        images: { orderBy: { createdAt: 'asc' } },
        tagSet: true,
      },
    });

    if (status === ScanStatus.REVIEWED) {
      this.eventEmitter.emit(
        'scan.reviewed',
        new ScanReviewedEvent(id, updated.patientId),
      );
    } else if (status === ScanStatus.FLAGGED) {
      this.eventEmitter.emit(
        'scan.flagged',
        new ScanFlaggedEvent(id, updated.patientId),
      );
    }

    return updated;
  }
}
