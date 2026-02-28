import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

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
        type: 'doctor',
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

    it('should throw UnauthorizedException for Auth0-only user (no passwordHash)', async () => {
      const auth0Doctor = { ...mockDoctor, passwordHash: null, auth0Id: 'auth0|abc123' };
      prisma.doctor.findUnique.mockResolvedValueOnce(auth0Doctor);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow();
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
        type: 'doctor',
      });
    });
  });

  describe('getMe', () => {
    it('should return doctor profile by id', async () => {
      const mockDoctor = {
        id: 'd1',
        email: 'test@example.com',
        name: 'Dr Test',
        role: 'DOCTOR',
        practiceId: 'p1',
        auth0Id: null,
      };
      prisma.doctor.findUnique.mockResolvedValueOnce(mockDoctor);

      const result = await service.getMe('d1');

      expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
        where: { id: 'd1' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          practiceId: true,
          auth0Id: true,
        },
      });
      expect(result).toEqual(mockDoctor);
    });

    it('should throw NotFoundException if doctor not found', async () => {
      prisma.doctor.findUnique.mockResolvedValueOnce(null);

      await expect(service.getMe('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOrCreateAuth0User', () => {
    const auth0Sub = 'auth0|abc123';
    const email = 'auth0user@example.com';
    const name = 'Auth0 User';

    it('should return existing doctor found by auth0Id', async () => {
      const existingDoctor = {
        id: 'd1',
        auth0Id: auth0Sub,
        email,
        name,
        role: 'DOCTOR',
        practiceId: 'p1',
      };
      prisma.doctor.findUnique.mockResolvedValueOnce(existingDoctor);

      const result = await service.findOrCreateAuth0User(auth0Sub, email, name);

      expect(result).toEqual(existingDoctor);
      expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
        where: { auth0Id: auth0Sub },
      });
    });

    it('should link auth0Id to existing doctor found by email', async () => {
      const existingDoctor = {
        id: 'd2',
        auth0Id: null,
        email,
        name: 'Existing Doctor',
        role: 'DOCTOR',
        practiceId: 'p1',
        passwordHash: 'some_hash',
      };
      const updatedDoctor = { ...existingDoctor, auth0Id: auth0Sub };

      // First findUnique (by auth0Id) returns null
      prisma.doctor.findUnique.mockResolvedValueOnce(null);
      // Second findUnique (by email) returns existing doctor
      prisma.doctor.findUnique.mockResolvedValueOnce(existingDoctor);
      // Update links the auth0Id
      prisma.doctor.update.mockResolvedValueOnce(updatedDoctor);

      const result = await service.findOrCreateAuth0User(auth0Sub, email, name);

      expect(result.auth0Id).toBe(auth0Sub);
      expect(prisma.doctor.update).toHaveBeenCalledWith({
        where: { id: 'd2' },
        data: { auth0Id: auth0Sub },
      });
    });

    it('should create new doctor when no existing match found', async () => {
      const newDoctor = {
        id: 'd3',
        auth0Id: auth0Sub,
        email,
        name,
        role: 'DOCTOR',
        practiceId: 'default-practice-id',
      };

      // No match by auth0Id
      prisma.doctor.findUnique.mockResolvedValueOnce(null);
      // No match by email
      prisma.doctor.findUnique.mockResolvedValueOnce(null);
      // Find default practice
      prisma.practice.findFirst.mockResolvedValueOnce({
        id: 'default-practice-id',
        name: 'Default Practice',
      });
      // Create new doctor
      prisma.doctor.create.mockResolvedValueOnce(newDoctor);

      const result = await service.findOrCreateAuth0User(auth0Sub, email, name);

      expect(result.auth0Id).toBe(auth0Sub);
      expect(prisma.doctor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          auth0Id: auth0Sub,
          email,
          name,
          role: 'DOCTOR',
          practiceId: 'default-practice-id',
        }),
      });
    });

    it('should create default practice if none exists', async () => {
      // No match by auth0Id
      prisma.doctor.findUnique.mockResolvedValueOnce(null);
      // No match by email
      prisma.doctor.findUnique.mockResolvedValueOnce(null);
      // No default practice found
      prisma.practice.findFirst.mockResolvedValueOnce(null);
      // Create default practice
      prisma.practice.create.mockResolvedValueOnce({
        id: 'new-default-practice',
        name: 'Default Practice',
      });
      // Create new doctor
      prisma.doctor.create.mockResolvedValueOnce({
        id: 'd4',
        auth0Id: auth0Sub,
        email,
        name,
        role: 'DOCTOR',
        practiceId: 'new-default-practice',
      });

      const result = await service.findOrCreateAuth0User(auth0Sub, email, name);

      expect(prisma.practice.create).toHaveBeenCalledWith({
        data: { name: 'Default Practice' },
      });
      expect(result.practiceId).toBe('new-default-practice');
    });

    it('should use AUTH0_DEFAULT_PRACTICE_ID env var when set', async () => {
      const originalEnv = process.env.AUTH0_DEFAULT_PRACTICE_ID;
      process.env.AUTH0_DEFAULT_PRACTICE_ID = 'env-practice-id';

      try {
        // No match by auth0Id
        prisma.doctor.findUnique.mockResolvedValueOnce(null);
        // No match by email
        prisma.doctor.findUnique.mockResolvedValueOnce(null);
        // Create new doctor
        prisma.doctor.create.mockResolvedValueOnce({
          id: 'd5',
          auth0Id: auth0Sub,
          email,
          name,
          role: 'DOCTOR',
          practiceId: 'env-practice-id',
        });

        const result = await service.findOrCreateAuth0User(auth0Sub, email, name);

        expect(result.practiceId).toBe('env-practice-id');
        // Should NOT query for default practice
        expect(prisma.practice.findFirst).not.toHaveBeenCalled();
      } finally {
        if (originalEnv === undefined) {
          delete process.env.AUTH0_DEFAULT_PRACTICE_ID;
        } else {
          process.env.AUTH0_DEFAULT_PRACTICE_ID = originalEnv;
        }
      }
    });
  });
});
