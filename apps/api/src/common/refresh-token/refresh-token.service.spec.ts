import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';

// Helpers
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function createMockRedis() {
  const store = new Map<string, string>();
  const sets = new Map<string, Set<string>>();

  return {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => { store.set(key, value); }),
    del: jest.fn(async (...keys: string[]) => {
      let count = 0;
      for (const k of keys) {
        if (store.has(k) || sets.has(k)) count++;
        store.delete(k);
        sets.delete(k);
      }
      return count;
    }),
    sadd: jest.fn(async (key: string, ...members: string[]) => {
      if (!sets.has(key)) sets.set(key, new Set());
      let added = 0;
      for (const m of members) {
        if (!sets.get(key)!.has(m)) { sets.get(key)!.add(m); added++; }
      }
      return added;
    }),
    smembers: jest.fn(async (key: string) => [...(sets.get(key) ?? [])]),
    srem: jest.fn(async (key: string, ...members: string[]) => {
      const s = sets.get(key);
      if (!s) return 0;
      let removed = 0;
      for (const m of members) { if (s.delete(m)) removed++; }
      return removed;
    }),
    expire: jest.fn(async () => 1),
    _store: store,
    _sets: sets,
  };
}

function createMockPrisma() {
  const rows: any[] = [];
  return {
    refreshToken: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: crypto.randomUUID(), ...data };
        rows.push(row);
        return row;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return rows.find((r) => r.tokenHash === where.tokenHash) ?? null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return rows.filter(
          (r) =>
            r.userId === where.userId &&
            r.userType === where.userType &&
            !r.revokedAt,
        );
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const r of rows) {
          const matchFamily = where.familyId ? r.familyId === where.familyId : true;
          const matchHash = where.tokenHash ? r.tokenHash === where.tokenHash : true;
          const matchRevoked = where.revokedAt === null ? !r.revokedAt : true;
          if (matchFamily && matchHash && matchRevoked) {
            Object.assign(r, data);
            count++;
          }
        }
        return { count };
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    _rows: rows,
  };
}

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let redis: ReturnType<typeof createMockRedis>;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    redis = createMockRedis();
    prisma = createMockPrisma();
    service = new RefreshTokenService(prisma as any, redis as any);
  });

  afterEach(() => {
    // Clean up the purge interval if onModuleInit was called
    (service as any).purgeInterval && clearInterval((service as any).purgeInterval);
  });

  describe('createRefreshToken', () => {
    it('should return a raw token and expiry date', async () => {
      const result = await service.createRefreshToken('user1', 'doctor', 'practice1');

      expect(result.rawToken).toBeDefined();
      expect(result.rawToken.length).toBe(128); // 64 bytes hex
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should store hash in Redis and Prisma', async () => {
      const result = await service.createRefreshToken('user1', 'doctor', 'practice1');
      const hash = hashToken(result.rawToken);

      expect(redis.set).toHaveBeenCalledWith(
        `rt:${hash}`,
        expect.any(String),
        expect.any(Number),
      );
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tokenHash: hash,
          userId: 'user1',
          userType: 'doctor',
          practiceId: 'practice1',
        }),
      });
    });

    it('should use the provided familyId', async () => {
      await service.createRefreshToken('user1', 'doctor', 'practice1', 'my-family');

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ familyId: 'my-family' }),
      });
    });

    it('should store metadata when provided', async () => {
      await service.createRefreshToken('user1', 'doctor', 'practice1', undefined, {
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
      });

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userAgent: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
        }),
      });
    });

    it('should use patient config TTL for patient tokens', async () => {
      await service.createRefreshToken('patient1', 'patient', 'practice1');

      // Patient refresh TTL is 30 days = 2592000 seconds
      expect(redis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        30 * 24 * 60 * 60,
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate and return new token with same family', async () => {
      const created = await service.createRefreshToken('user1', 'doctor', 'practice1', 'fam1');
      const rotated = await service.rotateRefreshToken(created.rawToken);

      expect(rotated.rawToken).toBeDefined();
      expect(rotated.rawToken).not.toBe(created.rawToken);
      expect(rotated.userId).toBe('user1');
      expect(rotated.userType).toBe('doctor');
      expect(rotated.practiceId).toBe('practice1');
    });

    it('should invalidate the old token after rotation', async () => {
      const created = await service.createRefreshToken('user1', 'doctor', 'practice1');
      await service.rotateRefreshToken(created.rawToken);

      // Old token hash should be deleted from Redis
      const oldHash = hashToken(created.rawToken);
      expect(redis.del).toHaveBeenCalledWith(`rt:${oldHash}`);
    });

    it('should mark old DB row as replaced', async () => {
      const created = await service.createRefreshToken('user1', 'doctor', 'practice1');
      const rotated = await service.rotateRefreshToken(created.rawToken);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: hashToken(created.rawToken) },
        data: expect.objectContaining({
          replacedBy: hashToken(rotated.rawToken),
          revokedAt: expect.any(Date),
        }),
      });
    });

    it('should throw for completely unknown token', async () => {
      await expect(
        service.rotateRefreshToken('nonexistent'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('reuse detection', () => {
    it('should revoke entire family when a rotated token is reused', async () => {
      const created = await service.createRefreshToken('user1', 'doctor', 'practice1', 'fam1');
      const oldRaw = created.rawToken;

      // Rotate once — old token is now consumed
      await service.rotateRefreshToken(oldRaw);

      // Clear the old token from Redis (simulate it being deleted already)
      const oldHash = hashToken(oldRaw);
      redis._store.delete(`rt:${oldHash}`);

      // Reuse the old token — should trigger family revocation
      await expect(service.rotateRefreshToken(oldRaw)).rejects.toThrow(
        'Token reuse detected',
      );

      // Verify revokeFamily was called (updateMany on the family)
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ familyId: 'fam1', revokedAt: null }),
        }),
      );
    });
  });

  describe('revokeFamily', () => {
    it('should delete all family tokens from Redis and revoke in DB', async () => {
      await service.createRefreshToken('user1', 'doctor', 'practice1', 'fam1');
      await service.createRefreshToken('user1', 'doctor', 'practice1', 'fam1');

      await service.revokeFamily('fam1');

      // Should have called del with the redis keys
      expect(redis.del).toHaveBeenCalled();

      // Should have revoked in DB
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'fam1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all families for a user', async () => {
      await service.createRefreshToken('user1', 'doctor', 'practice1', 'fam1');
      await service.createRefreshToken('user1', 'doctor', 'practice1', 'fam2');

      await service.revokeAllUserTokens('user1', 'doctor');

      expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', userType: 'doctor', revokedAt: null },
        select: { familyId: true },
        distinct: ['familyId'],
      });
    });
  });

  describe('purgeExpired', () => {
    it('should delete expired tokens from DB', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValueOnce({ count: 5 });

      const count = await service.purgeExpired();

      expect(count).toBe(5);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
      });
    });
  });

  describe('getFamilyIdByToken', () => {
    it('should return familyId from Redis cache', async () => {
      const created = await service.createRefreshToken('user1', 'doctor', 'practice1', 'fam1');
      const familyId = await service.getFamilyIdByToken(created.rawToken);

      expect(familyId).toBe('fam1');
    });

    it('should fall back to DB when not in Redis', async () => {
      const created = await service.createRefreshToken('user1', 'doctor', 'practice1', 'fam1');
      // Clear Redis
      redis._store.clear();

      const familyId = await service.getFamilyIdByToken(created.rawToken);
      expect(familyId).toBe('fam1');
    });

    it('should return null for unknown token', async () => {
      // Clear any existing state
      redis._store.clear();
      prisma.refreshToken.findUnique.mockResolvedValueOnce(null);

      const familyId = await service.getFamilyIdByToken('unknown');
      expect(familyId).toBeNull();
    });
  });
});
