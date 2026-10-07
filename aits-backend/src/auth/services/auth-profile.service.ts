import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto, UpdateProfileDto } from '../dto';
import {
  ProfilePictureUpdateResult,
  RequestClientMeta,
  SanitizedUser,
  UploadedMulterFile,
} from '../types/auth.types';
import { AuthCommonService } from './auth-common.service';

@Injectable()
export class AuthProfileService {
  private readonly logger = new Logger(AuthProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly common: AuthCommonService,
  ) {}

  async getMe(userId: string): Promise<SanitizedUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
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

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return this.common.formatUser(user);
  }

  /**
   * Secure password change in database
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    meta?: RequestClientMeta,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(
        'The requested user account could not be found.',
      );
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new BadRequestException('Current password does not match.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await this.common.logAuditEvent({
      userId,
      action: 'AUTH_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  /**
   * Update personal profile in database
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        phone: dto.phone?.trim(),
        profileImageUrl: dto.profileImageUrl,
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

    return {
      success: true,
      message: 'Profile updated successfully.',
      user: this.common.formatUser(user),
    };
  }

  /**
   * Upload user profile picture directly to Cloudinary and sync database
   */
  async uploadProfilePicture(
    userId: string,
    fileInput: UploadedMulterFile | string,
  ): Promise<ProfilePictureUpdateResult> {
    if (!fileInput) {
      throw new BadRequestException('No image file or data provided');
    }

    let uploadTarget: Buffer | string;

    if (typeof fileInput === 'string') {
      const trimmed = fileInput.trim();
      if (
        !trimmed.startsWith('data:image/') &&
        !trimmed.startsWith('http://') &&
        !trimmed.startsWith('https://')
      ) {
        throw new BadRequestException('Invalid image payload or source');
      }
      uploadTarget = trimmed;
    } else if (fileInput.buffer) {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      if (
        fileInput.mimetype &&
        !allowedMimes.includes(fileInput.mimetype.toLowerCase())
      ) {
        throw new BadRequestException(
          `Unsupported image format (${fileInput.mimetype}). Please upload a JPEG, PNG, WEBP, or GIF image.`,
        );
      }

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (fileInput.size > MAX_SIZE) {
        throw new BadRequestException('Image size exceeds 5MB limit');
      }

      uploadTarget = fileInput.buffer;
    } else {
      throw new BadRequestException('Invalid file upload format');
    }

    // Upload to Cloudinary under folder 'aits/profiles'
    const uploadResult = await this.cloudinaryService.uploadImage(
      uploadTarget,
      'aits/profiles',
    );

    const secureUrl = uploadResult.secureUrl || uploadResult.url;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: secureUrl },
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

    return {
      success: true,
      message: 'Profile picture updated successfully.',
      profileImageUrl: secureUrl,
      user: this.common.formatUser(user),
    };
  }

  /**
   * Remove user profile picture from database
   */
  async removeProfilePicture(
    userId: string,
  ): Promise<ProfilePictureUpdateResult> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: null },
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

    return {
      success: true,
      message: 'Profile picture removed successfully.',
      profileImageUrl: null,
      user: this.common.formatUser(user),
    };
  }

  /**
   * Verify email address with 6-digit OTP code with attempt limiting and SHA-256 hash comparison.
   */
}
