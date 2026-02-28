import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DoctorRole } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RefreshTokenService } from '../common/refresh-token/refresh-token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

interface TokenMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(dto: RegisterDto, meta?: TokenMeta): Promise<AuthResponseDto & { refreshToken: string; refreshExpiresAt: Date }> {
    const existing = await this.prisma.doctor.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('A doctor with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

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
    const { rawToken, expiresAt } = await this.refreshTokenService.createRefreshToken(
      doctor.id, 'doctor', doctor.practiceId, undefined, meta,
    );

    return {
      accessToken,
      refreshToken: rawToken,
      refreshExpiresAt: expiresAt,
      user: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: doctor.role,
        practiceId: doctor.practiceId,
      },
    };
  }

  async login(dto: LoginDto, meta?: TokenMeta): Promise<AuthResponseDto & { refreshToken: string; refreshExpiresAt: Date }> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { email: dto.email },
    });

    if (!doctor) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!doctor.passwordHash) {
      throw new UnauthorizedException('This account uses Auth0. Please sign in with Auth0.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, doctor.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(doctor);
    const { rawToken, expiresAt } = await this.refreshTokenService.createRefreshToken(
      doctor.id, 'doctor', doctor.practiceId, undefined, meta,
    );

    return {
      accessToken,
      refreshToken: rawToken,
      refreshExpiresAt: expiresAt,
      user: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: doctor.role,
        practiceId: doctor.practiceId,
      },
    };
  }

  async refreshAccessToken(rawToken: string, meta?: TokenMeta) {
    const rotated = await this.refreshTokenService.rotateRefreshToken(rawToken, meta);

    // Load full user to generate fresh access token
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: rotated.userId },
    });

    if (!doctor) {
      throw new UnauthorizedException('User no longer exists');
    }

    const accessToken = this.generateToken(doctor);

    return {
      accessToken,
      refreshToken: rotated.rawToken,
      refreshExpiresAt: rotated.expiresAt,
    };
  }

  async logout(rawToken: string): Promise<void> {
    const familyId = await this.refreshTokenService.getFamilyIdByToken(rawToken);
    if (familyId) {
      await this.refreshTokenService.revokeFamily(familyId);
    }
  }

  async getMe(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        practiceId: true,
        auth0Id: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async findOrCreateAuth0User(
    auth0Sub: string,
    email: string,
    name: string,
  ) {
    // 1. Try find by auth0Id
    let doctor = await this.prisma.doctor.findUnique({
      where: { auth0Id: auth0Sub },
    });

    if (doctor) {
      return doctor;
    }

    // 2. Try find by email and link auth0Id
    if (email) {
      doctor = await this.prisma.doctor.findUnique({
        where: { email },
      });

      if (doctor) {
        return this.prisma.doctor.update({
          where: { id: doctor.id },
          data: { auth0Id: auth0Sub },
        });
      }
    }

    // 3. Create new doctor — needs a practice
    const defaultPracticeId = process.env.AUTH0_DEFAULT_PRACTICE_ID;

    let practiceId: string;
    if (defaultPracticeId) {
      practiceId = defaultPracticeId;
    } else {
      // Find or create a default practice for Auth0 users
      let defaultPractice = await this.prisma.practice.findFirst({
        where: { name: 'Default Practice' },
      });

      if (!defaultPractice) {
        defaultPractice = await this.prisma.practice.create({
          data: { name: 'Default Practice' },
        });
      }

      practiceId = defaultPractice.id;
    }

    return this.prisma.doctor.create({
      data: {
        auth0Id: auth0Sub,
        email: email || `${auth0Sub}@auth0.local`,
        name: name || 'Auth0 User',
        role: DoctorRole.DOCTOR,
        practiceId,
      },
    });
  }

  generateToken(doctor: { id: string; email: string; role: string; practiceId: string }): string {
    const payload: JwtPayload = {
      sub: doctor.id,
      email: doctor.email,
      role: doctor.role,
      practiceId: doctor.practiceId,
      type: 'doctor',
    };

    return this.jwtService.sign(payload);
  }
}
