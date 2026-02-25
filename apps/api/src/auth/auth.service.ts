import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DoctorRole } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

// TODO: Replace with Auth0 integration
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.doctor.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('A doctor with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // TODO: Admin creation should be done through a protected admin endpoint
    const doctor = await this.prisma.doctor.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        practiceId: dto.practiceId,
        role: DoctorRole.DOCTOR,
      },
    });

    const accessToken = this.generateToken(doctor);

    return {
      accessToken,
      user: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: doctor.role,
        practiceId: doctor.practiceId,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { email: dto.email },
    });

    if (!doctor) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, doctor.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(doctor);

    return {
      accessToken,
      user: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: doctor.role,
        practiceId: doctor.practiceId,
      },
    };
  }

  generateToken(doctor: { id: string; email: string; role: string; practiceId: string }): string {
    const payload: JwtPayload = {
      sub: doctor.id,
      email: doctor.email,
      role: doctor.role,
      practiceId: doctor.practiceId,
    };

    return this.jwtService.sign(payload);
  }
}
