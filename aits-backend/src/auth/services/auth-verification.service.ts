import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../mail/mail.service';
import { createHash } from 'crypto';
import { VerifyOtpDto } from '../dto';
import { AuthResponse, RequestClientMeta } from '../types/auth.types';
import { AuthCommonService } from './auth-common.service';
import { AuthTokensService } from './auth-tokens.service';

@Injectable()
export class AuthVerificationService {
  private readonly logger = new Logger(AuthVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly common: AuthCommonService,
    private readonly tokens: AuthTokensService,
  ) {}

  async verifyOtp(
    dto: VerifyOtpDto,
    meta?: RequestClientMeta,
  ): Promise<AuthResponse & { message: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const cleanOtp = dto.otp.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
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

    if (!user) {
      throw new BadRequestException(
        'No account found matching this email address.',
      );
    }

    if (user.isEmailVerified) {
      const sanitized = this.common.formatUser(user);
      const tokens = await this.tokens.generateTokens(
        sanitized.id,
        sanitized.email,
        meta,
      );
      return {
        ...tokens,
        user: sanitized,
        message: 'Account is already verified. Signing you in...',
      };
    }

    // Check OTP attempt limit (max 5 attempts before invalidation)
    if (user.otpAttempts >= 5) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otpHash: null,
          otpExpiresAt: null,
          otpAttempts: 0,
        },
      });

      await this.common.logAuditEvent({
        userId: user.id,
        action: 'AUTH_OTP_MAX_ATTEMPTS_EXCEEDED',
        entityType: 'User',
        entityId: user.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });

      throw new BadRequestException(
        'Too many failed verification attempts. Please click "Resend Code" to get a new code.',
      );
    }

    // Expiry check
    const isExpired =
      (user.otpExpiresAt && user.otpExpiresAt < new Date()) ||
      (user.verificationTokenExpiresAt &&
        user.verificationTokenExpiresAt < new Date());

    if (isExpired) {
      throw new BadRequestException(
        'Verification code has expired. Please click "Resend Code" to get a new code.',
      );
    }

    // Compute SHA-256 hash of provided OTP
    const computedHash = createHash('sha256').update(cleanOtp).digest('hex');
    const isMatch =
      (user.otpHash && user.otpHash === computedHash) ||
      (user.verificationToken && user.verificationToken === cleanOtp);

    if (!isMatch) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otpAttempts: { increment: 1 },
        },
      });

      await this.common.logAuditEvent({
        userId: user.id,
        action: 'AUTH_OTP_ATTEMPT_FAILED',
        entityType: 'User',
        entityId: user.id,
        newValues: { attempts: user.otpAttempts + 1 },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });

      throw new BadRequestException(
        'Invalid 6-digit verification code. Please double-check your email and try again.',
      );
    }

    // Invalidate OTP upon successful verification
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        verificationToken: null,
        verificationTokenExpiresAt: null,
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

    await this.common.logAuditEvent({
      userId: updatedUser.id,
      action: 'AUTH_OTP_VERIFIED',
      entityType: 'User',
      entityId: updatedUser.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    const sanitized = this.common.formatUser(updatedUser);
    const tokens = await this.tokens.generateTokens(
      sanitized.id,
      sanitized.email,
      meta,
    );

    return {
      ...tokens,
      user: sanitized,
      message: 'Email successfully verified! Workspace unlocked.',
    };
  }

  /**
   * Verify email address with legacy verification token link
   */
  async verifyEmail(
    token: string,
    meta?: RequestClientMeta,
  ): Promise<{ success: boolean; message: string }> {
    if (!token || token.trim() === '') {
      throw new BadRequestException('Verification token is required.');
    }

    const cleanToken = token.trim();
    const computedHash = createHash('sha256').update(cleanToken).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ verificationToken: cleanToken }, { otpHash: computedHash }],
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired verification token. Please request a new verification code.',
      );
    }

    const isExpired =
      (user.otpExpiresAt && user.otpExpiresAt < new Date()) ||
      (user.verificationTokenExpiresAt &&
        user.verificationTokenExpiresAt < new Date());

    if (isExpired) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new verification link.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    await this.common.logAuditEvent({
      userId: user.id,
      action: 'AUTH_EMAIL_TOKEN_VERIFIED',
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      message:
        'Email successfully verified! You may now sign in to your farm workspace.',
    };
  }

  /**
   * Resend email verification 6-digit OTP code with a 60-second rate-limiting cooldown.
   */
  async resendVerification(
    email: string,
    meta?: RequestClientMeta,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    if (!user) {
      return {
        success: true,
        message:
          'If an account exists with this email address, a verification code has been sent.',
      };
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'This email is already verified. Please sign in.',
      };
    }

    // Rate-limiting: Enforce 60-second cooldown between resend requests
    if (user.otpLastSentAt) {
      const elapsedMs = Date.now() - user.otpLastSentAt.getTime();
      const cooldownMs = 60 * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        throw new BadRequestException(
          `Please wait ${remainingSeconds} second${
            remainingSeconds > 1 ? 's' : ''
          } before requesting a new verification code.`,
        );
      }
    }

    const verificationOtp = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const otpHash = createHash('sha256').update(verificationOtp).digest('hex');
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        otpLastSentAt: new Date(),
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    await this.mailService.sendVerificationEmail({
      to: normalizedEmail,
      firstName: user.firstName,
      token: verificationOtp,
      otp: verificationOtp,
    });

    await this.common.logAuditEvent({
      userId: user.id,
      action: 'AUTH_OTP_RESENT',
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      message:
        'A new 6-digit verification code has been sent to your email address.',
    };
  }
}
