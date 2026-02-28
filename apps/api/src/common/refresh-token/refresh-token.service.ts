import { Injectable, Logger, OnModuleInit, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis.service';
import { REFRESH_TOKEN_CONFIG, UserType } from './refresh-token.constants';

interface TokenMeta {
  userAgent?: string;
  ipAddress?: string;
}

interface CreateResult {
  rawToken: string;
  expiresAt: Date;
}

interface RotateResult {
  rawToken: string;
  userId: string;
  userType: UserType;
  practiceId: string;
  expiresAt: Date;
}

@Injectable()
export class RefreshTokenService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RefreshTokenService.name);
  private purgeInterval: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    // Run purge daily
    this.purgeInterval = setInterval(
      () => this.purgeExpired().catch((e) => this.logger.error('Purge failed', e)),
      24 * 60 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    clearInterval(this.purgeInterval);
  }

  async createRefreshToken(
    userId: string,
    userType: UserType,
    practiceId: string,
    familyId?: string,
    meta?: TokenMeta,
  ): Promise<CreateResult> {
    const config = REFRESH_TOKEN_CONFIG[userType];
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const resolvedFamilyId = familyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + config.refreshTokenTtlSeconds * 1000);

    // Store in Redis for fast lookups
    const redisKey = `rt:${tokenHash}`;
    const redisValue = JSON.stringify({
      userId,
      userType,
      practiceId,
      familyId: resolvedFamilyId,
      expiresAt: expiresAt.toISOString(),
    });
    await this.redis.set(redisKey, redisValue, config.refreshTokenTtlSeconds);

    // Track token in family set (for family revocation)
    const familyKey = `rtf:${resolvedFamilyId}`;
    await this.redis.sadd(familyKey, tokenHash);
    await this.redis.expire(familyKey, config.familyMaxSeconds);

    // Store in PostgreSQL for durability
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        familyId: resolvedFamilyId,
        userId,
        userType,
        practiceId,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    });

    return { rawToken, expiresAt };
  }

  async rotateRefreshToken(rawToken: string, meta?: TokenMeta): Promise<RotateResult> {
    const tokenHash = this.hashToken(rawToken);
    const redisKey = `rt:${tokenHash}`;

    // Try fast path: Redis lookup
    const cached = await this.redis.get(redisKey);

    if (cached) {
      const data = JSON.parse(cached);
      const { userId, userType, practiceId, familyId } = data;

      // Delete old token from Redis
      await this.redis.del(redisKey);
      await this.redis.srem(`rtf:${familyId}`, tokenHash);

      // Create new token in same family
      const result = await this.createRefreshToken(userId, userType, practiceId, familyId, meta);

      // Mark old DB row as replaced
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { replacedBy: this.hashToken(result.rawToken), revokedAt: new Date() },
      });

      return { ...result, userId, userType, practiceId };
    }

    // Slow path: check DB for reuse detection
    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (dbToken) {
      // Token exists in DB but not Redis — it was already rotated (reuse!)
      this.logger.warn(
        `Refresh token reuse detected for family ${dbToken.familyId}, user ${dbToken.userId}`,
      );
      await this.revokeFamily(dbToken.familyId);
      throw new UnauthorizedException('Token reuse detected — session revoked');
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async revokeFamily(familyId: string): Promise<void> {
    // Remove all family tokens from Redis
    const familyKey = `rtf:${familyId}`;
    const members = await this.redis.smembers(familyKey);
    if (members.length > 0) {
      const redisKeys = members.map((hash) => `rt:${hash}`);
      await this.redis.del(...redisKeys, familyKey);
    }

    // Revoke all DB rows in the family
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string, userType: UserType): Promise<void> {
    // Find all active families for this user
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, userType, revokedAt: null },
      select: { familyId: true },
      distinct: ['familyId'],
    });

    for (const { familyId } of tokens) {
      await this.revokeFamily(familyId);
    }
  }

  async getFamilyIdByToken(rawToken: string): Promise<string | null> {
    const tokenHash = this.hashToken(rawToken);
    const redisKey = `rt:${tokenHash}`;

    const cached = await this.redis.get(redisKey);
    if (cached) {
      return JSON.parse(cached).familyId;
    }

    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { familyId: true },
    });

    return dbToken?.familyId ?? null;
  }

  async purgeExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.log(`Purged ${result.count} expired refresh tokens`);
    }
    return result.count;
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
