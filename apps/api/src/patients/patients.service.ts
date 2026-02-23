import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(practiceId: string, query: PatientQueryDto) {
    const { page = 1, limit = 20, status, doctorId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = { practiceId };

    if (status) {
      where.status = status;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string, practiceId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, practiceId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID "${id}" not found`);
    }

    return patient;
  }

  async create(dto: CreatePatientDto, practiceId: string) {
    return this.prisma.patient.create({
      data: {
        practiceId,
        name: dto.name,
        doctorId: dto.doctorId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        treatmentType: dto.treatmentType,
        alignerBrand: dto.alignerBrand,
        currentStage: dto.currentStage,
        totalStages: dto.totalStages,
        scanFrequency: dto.scanFrequency,
      },
    });
  }

  async update(id: string, dto: UpdatePatientDto, practiceId: string) {
    // Ensure the patient belongs to the practice before updating
    await this.findOne(id, practiceId);

    return this.prisma.patient.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.doctorId !== undefined && { doctorId: dto.doctorId }),
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: new Date(dto.dateOfBirth),
        }),
        ...(dto.treatmentType !== undefined && {
          treatmentType: dto.treatmentType,
        }),
        ...(dto.alignerBrand !== undefined && {
          alignerBrand: dto.alignerBrand,
        }),
        ...(dto.currentStage !== undefined && {
          currentStage: dto.currentStage,
        }),
        ...(dto.totalStages !== undefined && {
          totalStages: dto.totalStages,
        }),
        ...(dto.scanFrequency !== undefined && {
          scanFrequency: dto.scanFrequency,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }
}
