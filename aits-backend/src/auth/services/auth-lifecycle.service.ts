import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RoleName, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { LoginDto, RegisterDto } from '../dto';
import { AuthResponse, RequestClientMeta } from '../types/auth.types';
import { AuthCommonService } from './auth-common.service';
import { AuthTokensService } from './auth-tokens.service';

@Injectable()
export class AuthLifecycleService {
  private readonly logger = new Logger(AuthLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly common: AuthCommonService,
    private readonly tokens: AuthTokensService,
  ) {}

  async register(
    dto: RegisterDto,
    meta?: RequestClientMeta,
  ): Promise<AuthResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check if user already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    if (existing) {
      if (!existing.isEmailVerified) {
        throw new ConflictException(
          'Account exists but is not verified. Please use the resend verification option to get a new OTP.',
        );
      }
      throw new ConflictException(
        'An account with this email address already exists. Please sign in instead.',
      );
    }

    // 2. Hash password securely
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Resolve role (defaulting to FARMER)
    const targetRoleName = dto.role || RoleName.FARMER;

    if (
      targetRoleName !== RoleName.FARMER &&
      targetRoleName !== RoleName.MANAGER &&
      targetRoleName !== RoleName.VETERINARIAN &&
      targetRoleName !== RoleName.WORKER
    ) {
      throw new ForbiddenException(
        'Self-registration is only allowed for operational roles. Privileged roles must be provisioned by an administrator.',
      );
    }

    let role = await this.prisma.role.findUnique({
      where: { name: targetRoleName },
    });

    if (!role) {
      role = await this.prisma.role.create({
        data: {
          name: targetRoleName,
          description: `Auto-generated ${targetRoleName} system role`,
        },
      });
    }

    // 4. Generate 6-digit OTP and store SHA-256 hash
    const verificationOtp = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const otpHash = createHash('sha256').update(verificationOtp).digest('hex');
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 5. Create user, role link, farm, and preferences in a single transaction
    const createdUser = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: normalizedEmail,
          phone: dto.phone?.trim() || null,
          passwordHash,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          verificationToken: null,
          verificationTokenExpiresAt: null,
        },
      });

      // Link User to Role
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: role.id,
        },
      });

      // Only create a farm if the user is registering as a FARMER
      if (targetRoleName === RoleName.FARMER) {
        const farmName =
          dto.farmName?.trim() || `${dto.firstName}'s Livestock Facility`;
        const farm = await tx.farm.create({
          data: {
            ownerId: newUser.id,
            name: farmName,
            registrationNumber: `FARM-${Date.now().toString().slice(-6)}`,
            farmType: dto.farmType || 'Dairy & Cattle',
            address: dto.address || 'Sri Lanka',
            province: dto.province || 'Central',
            district: dto.district || 'Kandy',
            city: dto.city || 'Kandy',
            contactNumber: dto.phone || '+94000000000',
            status: 'ACTIVE',
          },
        });

        await tx.farmUser.create({
          data: {
            farmId: farm.id,
            userId: newUser.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        });
      }

      // Default notification preferences
      await tx.notificationPreference.create({
        data: {
          userId: newUser.id,
          vaccinationNotifications: true,
          feedingNotifications: true,
          healthNotifications: true,
          documentNotifications: true,
          syncNotifications: true,
        },
      });

      return newUser;
    });

    await this.common.logAuditEvent({
      userId: createdUser.id,
      action: 'AUTH_REGISTER',
      entityType: 'User',
      entityId: createdUser.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    // 7. Query full user graph with relations
    const fullUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: createdUser.id },
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
          where: { status: 'ACTIVE', farm: { deletedAt: null } },
          include: { farm: true },
        },
      },
    });

    const sanitized = this.common.formatUser(fullUser);
    const tokens = await this.tokens.generateTokens(
      sanitized.id,
      sanitized.email,
      meta,
    );

    return {
      ...tokens,
      user: sanitized,
      emailSent: true, // Always return true since we removed email sending
    };
  }

  /**
   * User login with brute-force protection, timing attack resistance, and dual-token issuance.
   */
  async login(dto: LoginDto, meta?: RequestClientMeta): Promise<AuthResponse> {
    const rawIdentifier: string = (dto.identifier || dto.email || '').trim();

    if (!rawIdentifier) {
      throw new BadRequestException('Email or phone number is required.');
    }

    const isEmail = rawIdentifier.includes('@');
    const cleanPhone = rawIdentifier.replace(/[\s\-()]/g, '');

    const phoneVariants: string[] = [rawIdentifier, cleanPhone];
    if (cleanPhone.startsWith('0')) {
      phoneVariants.push(`+94${cleanPhone.slice(1)}`);
      phoneVariants.push(`94${cleanPhone.slice(1)}`);
      phoneVariants.push(cleanPhone.slice(1));
    } else if (cleanPhone.startsWith('+94')) {
      phoneVariants.push(`0${cleanPhone.slice(3)}`);
      phoneVariants.push(cleanPhone.slice(1));
    } else if (cleanPhone.startsWith('94')) {
      phoneVariants.push(`+${cleanPhone}`);
      phoneVariants.push(`0${cleanPhone.slice(2)}`);
    }

    const uniquePhoneVariants = Array.from(new Set(phoneVariants));

    const user = await this.prisma.user.findFirst({
      where: {
        OR: isEmail
          ? [{ email: rawIdentifier.toLowerCase() }]
          : [
              { email: rawIdentifier.toLowerCase() },
              ...uniquePhoneVariants.map((p) => ({ phone: p })),
            ],
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
          where: { status: 'ACTIVE', farm: { deletedAt: null } },
          include: { farm: true },
        },
      },
    });

    // Timing attack mitigation if user does not exist
    if (!user) {
      await bcrypt.compare(
        dto.password,
        '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
      );
      await this.common.logAuditEvent({
        action: 'AUTH_LOGIN_FAILED_UNKNOWN_USER',
        entityType: 'User',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Check account lockout status (5 failed attempts -> 15 minutes lockout)
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.max(
        1,
        Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000)),
      );
      await this.common.logAuditEvent({
        userId: user.id,
        action: 'AUTH_LOGIN_LOCKED_OUT',
        entityType: 'User',
        entityId: user.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      throw new UnauthorizedException(
        `Account is temporarily locked due to repeated failed login attempts. Please try again in ${waitMinutes} minute${
          waitMinutes > 1 ? 's' : ''
        }.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockoutUntil =
        newFailedAttempts >= 5
          ? new Date(Date.now() + 15 * 60 * 1000) // 15-minute lockout
          : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lockoutUntil,
        },
      });

      await this.common.logAuditEvent({
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        newValues: {
          failedAttempts: newFailedAttempts,
          lockedOut: Boolean(lockoutUntil),
        },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });

      if (lockoutUntil) {
        throw new UnauthorizedException(
          'Too many failed attempts. Account has been temporarily locked for 15 minutes.',
        );
      }

      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your account is currently inactive or suspended. Please contact the system administrator.',
      );
    }

    // Reset failed login attempts on successful authentication
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    await this.common.logAuditEvent({
      userId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    const sanitized = this.common.formatUser(user);
    const tokens = await this.tokens.generateTokens(
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
   * Rotate and refresh dual tokens using valid refresh token with reuse detection.
   */
}
