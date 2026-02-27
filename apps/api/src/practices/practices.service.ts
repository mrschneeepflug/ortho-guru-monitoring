import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtPayload, isDoctorPayload } from '../common/interfaces/jwt-payload.interface';
import { CreatePracticeDto } from './dto/create-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { UpdatePracticeSettingsDto } from './dto/update-practice-settings.dto';

@Injectable()
export class PracticesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: JwtPayload) {
    if (isDoctorPayload(user) && user.role === 'ADMIN') {
      return this.prisma.practice.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.practice.findMany({
      where: { id: user.practiceId },
    });
  }

  async findOne(id: string, practiceId: string) {
    const practice = await this.prisma.practice.findUnique({
      where: { id },
    });

    if (!practice) {
      throw new NotFoundException(`Practice with ID "${id}" not found`);
    }

    if (practice.id !== practiceId) {
      throw new ForbiddenException(
        'You do not have access to this practice',
      );
    }

    return practice;
  }

  async create(dto: CreatePracticeDto) {
    return this.prisma.practice.create({
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        subscriptionTier: dto.subscriptionTier ?? 'basic',
      },
    });
  }

  async update(id: string, dto: UpdatePracticeDto, practiceId: string) {
    const practice = await this.prisma.practice.findUnique({
      where: { id },
    });

    if (!practice) {
      throw new NotFoundException(`Practice with ID "${id}" not found`);
    }

    if (practice.id !== practiceId) {
      throw new ForbiddenException(
        'You do not have access to this practice',
      );
    }

    return this.prisma.practice.update({
      where: { id },
      data: dto,
    });
  }

  async updateSettings(id: string, practiceId: string, dto: UpdatePracticeSettingsDto) {
    const practice = await this.prisma.practice.findUnique({ where: { id } });

    if (!practice) {
      throw new NotFoundException(`Practice with ID "${id}" not found`);
    }

    if (practice.id !== practiceId) {
      throw new ForbiddenException('You do not have access to this practice');
    }

    const currentSettings = (practice.settings as Record<string, unknown>) ?? {};
    const newSettings = {
      ...currentSettings,
      messagingMode: dto.messagingMode,
      ...(dto.messagingMode === 'whatsapp'
        ? { whatsappNumber: dto.whatsappNumber }
        : { whatsappNumber: undefined }),
    };

    return this.prisma.practice.update({
      where: { id },
      data: { settings: newSettings },
    });
  }

  async getSettings(id: string): Promise<{ messagingMode: string; whatsappNumber?: string }> {
    const practice = await this.prisma.practice.findUnique({ where: { id } });
    if (!practice) {
      throw new NotFoundException(`Practice with ID "${id}" not found`);
    }

    const settings = (practice.settings as Record<string, unknown>) ?? {};
    return {
      messagingMode: (settings.messagingMode as string) ?? 'portal',
      whatsappNumber: settings.whatsappNumber as string | undefined,
    };
  }
}
