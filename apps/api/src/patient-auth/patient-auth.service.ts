import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PatientAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async createInvite(patientId: string, email: string | undefined, practiceId: string) {
    // Verify patient belongs to this practice
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, practiceId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await this.prisma.patientInvite.create({
      data: {
        patientId,
        token,
        email: email || null,
        expiresAt,
      },
    });

    return { token: invite.token, expiresAt: invite.expiresAt };
  }

  async validateInvite(token: string) {
    const invite = await this.prisma.patientInvite.findUnique({
      where: { token },
      include: { patient: { select: { id: true, name: true, practiceId: true, email: true } } },
    });

    if (!invite) {
      throw new NotFoundException('Invalid invite token');
    }
    if (invite.usedAt) {
      throw new BadRequestException('This invite has already been used');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite has expired');
    }

    return {
      valid: true,
      patientName: invite.patient.name,
      email: invite.email || invite.patient.email || null,
    };
  }

  async register(token: string, email: string, password: string) {
    const invite = await this.prisma.patientInvite.findUnique({
      where: { token },
      include: { patient: true },
    });

    if (!invite) {
      throw new NotFoundException('Invalid invite token');
    }
    if (invite.usedAt) {
      throw new BadRequestException('This invite has already been used');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite has expired');
    }

    // Check if email is already in use by another patient
    const existingPatient = await this.prisma.patient.findUnique({
      where: { email },
    });
    if (existingPatient && existingPatient.id !== invite.patientId) {
      throw new BadRequestException('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Update patient with credentials and mark invite used in a transaction
    const patient = await this.prisma.$transaction(async (tx) => {
      await tx.patientInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return tx.patient.update({
        where: { id: invite.patientId },
        data: { email, passwordHash },
      });
    });

    const accessToken = this.signToken(patient);

    return {
      accessToken,
      patient: this.toProfile(patient),
    };
  }

  async login(email: string, password: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { email },
    });

    if (!patient || !patient.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, patient.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.signToken(patient);

    return {
      accessToken,
      patient: this.toProfile(patient),
    };
  }

  async getProfile(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { doctor: { select: { name: true } } },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return {
      ...this.toProfile(patient),
      doctorName: patient.doctor.name,
    };
  }

  private signToken(patient: { id: string; email: string | null; practiceId: string }) {
    return this.jwtService.sign({
      sub: patient.id,
      patientId: patient.id,
      email: patient.email || '',
      practiceId: patient.practiceId,
      type: 'patient',
    });
  }

  private toProfile(patient: {
    id: string;
    name: string;
    email: string | null;
    practiceId: string;
    treatmentType: string | null;
    alignerBrand: string | null;
    currentStage: number;
    totalStages: number | null;
    scanFrequency: number;
    status: string;
  }) {
    return {
      id: patient.id,
      name: patient.name,
      email: patient.email || '',
      practiceId: patient.practiceId,
      treatmentType: patient.treatmentType,
      alignerBrand: patient.alignerBrand,
      currentStage: patient.currentStage,
      totalStages: patient.totalStages,
      scanFrequency: patient.scanFrequency,
      status: patient.status,
    };
  }
}
