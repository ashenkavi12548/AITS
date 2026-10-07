import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { UserStatus } from '@prisma/client';
import { randomUUID, createHash } from 'crypto';
import {
  AuthResponse,
  AuthTokens,
  RefreshTokenPayload,
  RequestClientMeta,
} from '../types/auth.types';
import { AuthCommonService } from './auth-common.service';

@Injectable()
export class AuthTokensService {
  private readonly logger = new Logger(AuthTokensService.name);

  private readonly accessSecret =
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    'aits-dev-jwt-secret-key-2026-production-ready';

  private readonly refreshSecret =
    process.env.JWT_REFRESH_SECRET ||
    'aits-dev-jwt-refresh-secret-key-2026-production-ready';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly common: AuthCommonService,
  ) {}

  validateSecrets(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error(
          '[AuthService] FATAL: JWT_SECRET must be defined with at least 32 characters in production.',
        );
      }
      if (
        !process.env.JWT_REFRESH_SECRET ||
        process.env.JWT_REFRESH_SECRET.length < 32
      ) {
        throw new Error(
          '[AuthService] FATAL: JWT_REFRESH_SECRET must be defined with at least 32 characters in production.',
        );
      }
      if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
        throw new Error(
          '[AuthService] FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be distinct secrets.',
        );
      }
    }
  }

  /**
   * Non-throwing helper to record security audit logs without exposing sensitive payloads.
   */

  async generateTokens(
    userId: string,
    email: string,
    meta?: RequestClientMeta,
  ): Promise<AuthTokens> {
    const tokenId = randomUUID();

    // Minimal payload to reduce exposure
    const payload = {
      sub: userId,
      email,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      email,
      tokenId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    // Store SHA-256 hash of refresh token
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.userSession.create({
      data: {
        userId,
        tokenHash,
        userAgent: meta?.userAgent || null,
        ipAddress: meta?.ipAddress || null,
        expiresAt,
        isRevoked: false,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 900 seconds
    };
  }

  /**
   * Register new user directly into PostgreSQL database via Prisma
   */

  async refreshTokens(
    refreshToken: string,
    meta?: RequestClientMeta,
  ): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token. Please sign in again.',
      );
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Malformed token payload');
    }

    // Find session by SHA-256 tokenHash
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
    });

    if (!session) {
      throw new UnauthorizedException(
        'Invalid session or token. Please log in again.',
      );
    }

    // REUSE DETECTION: If this token was already revoked, someone may have compromised it.
    // Revoke all sessions for this user to protect the account.
    if (session.isRevoked) {
      await this.prisma.userSession.updateMany({
        where: { userId: payload.sub, isRevoked: false },
        data: { isRevoked: true },
      });

      await this.common.logAuditEvent({
        userId: payload.sub,
        action: 'AUTH_REFRESH_TOKEN_REUSE_DETECTED',
        entityType: 'UserSession',
        entityId: session.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });

      throw new UnauthorizedException(
        'Token reuse detected. All active sessions have been revoked for your security. Please log in again.',
      );
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException(
        'Refresh token has expired. Please sign in again.',
      );
    }

    // Invalidate old session
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        ownedFarms: { where: { deletedAt: null } },
        farmMemberships: {
          where: { farm: { deletedAt: null }, status: 'ACTIVE' },
          include: { farm: true },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'User account associated with this session is no longer active.',
      );
    }

    await this.common.logAuditEvent({
      userId: user.id,
      action: 'AUTH_TOKEN_ROTATED',
      entityType: 'UserSession',
      entityId: session.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    const sanitized = this.common.formatUser(user);
    const tokens = await this.generateTokens(
      sanitized.id,
      sanitized.email,
      meta,
    );

    return {
      ...tokens,
      user: sanitized,
    };
  }

  /**
   * Terminate current user session by revoking the refresh token.
   */

  async logout(
    refreshToken?: string,
    userId?: string,
    meta?: RequestClientMeta,
  ): Promise<{ success: boolean; message: string }> {
    if (refreshToken) {
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      await this.prisma.userSession.updateMany({
        where: { tokenHash, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    await this.common.logAuditEvent({
      userId,
      action: 'AUTH_LOGOUT',
      entityType: 'UserSession',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Terminate all active sessions for the specified user (e.g. across all browsers and devices).
   */

  async logoutAll(
    userId: string,
    meta?: RequestClientMeta,
  ): Promise<{ success: boolean; message: string }> {
    await this.prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.common.logAuditEvent({
      userId,
      action: 'AUTH_LOGOUT_ALL',
      entityType: 'UserSession',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      message: 'All active sessions have been terminated successfully.',
    };
  }

  /**
   * Get current authenticated user profile directly from database
   */
}
