import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtPayload, isDoctorPayload } from '../common/interfaces/jwt-payload.interface';
import { CreatePracticeDto } from './dto/create-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';

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
}
