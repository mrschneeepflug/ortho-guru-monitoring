import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrismaService;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    jwtService = { sign: jest.fn().mockReturnValue('mock-jwt-token') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useFactory: createMockPrismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('register', () => {
    const registerDto = {
      name: 'Dr Test',
      email: 'test@example.com',
      password: 'password123',
      practiceId: 'p1',
    };

    it('should hash password and create doctor with DOCTOR role', async () => {
      prisma.doctor.findUnique.mockResolvedValueOnce(null);
      prisma.doctor.create.mockResolvedValueOnce({
        id: 'd1',
        email: registerDto.email,
        name: registerDto.name,
        role: 'DOCTOR',
        practiceId: registerDto.practiceId,
        passwordHash: 'hashed_password',
      });

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.doctor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'DOCTOR',
          passwordHash: 'hashed_password',
        }),
      });
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.doctor.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should return JWT token on successful registration', async () => {
      prisma.doctor.findUnique.mockResolvedValueOnce(null);
      prisma.doctor.create.mockResolvedValueOnce({
        id: 'd1',
        email: 'test@example.com',
        name: 'Dr Test',
        role: 'DOCTOR',
        practiceId: 'p1',
      });

      const result = await service.register(registerDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'd1',
        email: 'test@example.com',
        role: 'DOCTOR',
        practiceId: 'p1',
      });
      expect(result.accessToken).toBe('mock-jwt-token');
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };
    const mockDoctor = {
      id: 'd1',
      email: 'test@example.com',
      name: 'Dr Test',
      role: 'DOCTOR',
      practiceId: 'p1',
      passwordHash: 'hashed_password',
    };

    it('should return token and user on valid credentials', async () => {
      prisma.doctor.findUnique.mockResolvedValueOnce(mockDoctor);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe('d1');
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      prisma.doctor.findUnique.mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.doctor.findUnique.mockResolvedValueOnce(mockDoctor);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateToken', () => {
    it('should create JWT with correct payload', () => {
      const doctor = { id: 'd1', email: 'test@example.com', role: 'DOCTOR', practiceId: 'p1' };

      service.generateToken(doctor);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'd1',
        email: 'test@example.com',
        role: 'DOCTOR',
        practiceId: 'p1',
      });
    });
  });
});
