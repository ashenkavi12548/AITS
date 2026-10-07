import { Prisma, UserStatus } from '@prisma/client';

export interface UploadedMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface ProfilePictureUpdateResult {
  success: boolean;
  message: string;
  profileImageUrl: string | null;
  user: SanitizedUser;
}

export type UserWithRolesAndFarms = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
    ownedFarms: true;
    farmMemberships: {
      include: {
        farm: true;
      };
    };
  };
}>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface SanitizedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  role: string;
  roles: string[];
  permissions: string[];
  farmPermissions?: Record<string, string[]>;
  farmRoles?: Record<string, string>;
  ownedFarms?: string[];
  status: UserStatus;
  isEmailVerified: boolean;
  primaryFarmId?: string | null;
  primaryFarmName?: string | null;
  farmRole?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
}

export interface AuthResponse extends AuthTokens {
  user: SanitizedUser;
  /** Indicates whether the verification email was successfully dispatched during registration. */
  emailSent?: boolean;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export interface RequestClientMeta {
  ipAddress?: string;
  userAgent?: string;
}
