import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto';
import {
  UploadedMulterFile,
  ProfilePictureUpdateResult,
  UserWithRolesAndFarms,
  AuthTokens,
  SanitizedUser,
  AuthResponse,
  RefreshTokenPayload,
  RequestClientMeta,
} from './types/auth.types';
import { AuthCommonService } from './services/auth-common.service';
import { AuthTokensService } from './services/auth-tokens.service';
import { AuthLifecycleService } from './services/auth-lifecycle.service';
import { AuthProfileService } from './services/auth-profile.service';
import { AuthVerificationService } from './services/auth-verification.service';

// Re-export all types for backward compatibility
export type {
  UploadedMulterFile,
  ProfilePictureUpdateResult,
  UserWithRolesAndFarms,
  AuthTokens,
  SanitizedUser,
  AuthResponse,
  RefreshTokenPayload,
  RequestClientMeta,
};

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    public readonly common: AuthCommonService,
    public readonly tokens: AuthTokensService,
    public readonly lifecycle: AuthLifecycleService,
    public readonly profile: AuthProfileService,
    public readonly verification: AuthVerificationService,
  ) {}

  async onModuleInit() {
    await Promise.resolve();
    this.tokens.validateSecrets();
  }

  // ===========================================================================
  // 1. TOKEN MANAGEMENT
  // ===========================================================================

  generateTokens(
    userOrId: UserWithRolesAndFarms | SanitizedUser | string,
    emailOrMeta?: string | RequestClientMeta,
    meta?: RequestClientMeta,
  ): Promise<AuthTokens> {
    if (typeof userOrId === 'string') {
      const email = typeof emailOrMeta === 'string' ? emailOrMeta : '';
      return this.tokens.generateTokens(userOrId, email, meta);
    }
    const clientMeta = typeof emailOrMeta === 'object' ? emailOrMeta : meta;
    return this.tokens.generateTokens(userOrId.id, userOrId.email, clientMeta);
  }

  refreshTokens(
    refreshToken: string,
    meta?: RequestClientMeta,
  ): Promise<AuthResponse> {
    return this.tokens.refreshTokens(refreshToken, meta);
  }

  logout(
    refreshToken?: string,
    userId?: string,
    meta?: RequestClientMeta,
  ): Promise<{ success: boolean; message: string }> {
    return this.tokens.logout(refreshToken, userId, meta);
  }

  logoutAll(
    userId: string,
    meta?: RequestClientMeta,
  ): Promise<{ success: boolean; message: string }> {
    return this.tokens.logoutAll(userId, meta);
  }

  // ===========================================================================
  // 2. AUTHENTICATION & ONBOARDING
  // ===========================================================================

  register(dto: RegisterDto, meta?: RequestClientMeta): Promise<AuthResponse> {
    return this.lifecycle.register(dto, meta);
  }

  login(dto: LoginDto, meta?: RequestClientMeta): Promise<AuthResponse> {
    return this.lifecycle.login(dto, meta);
  }

  // ===========================================================================
  // 3. PROFILE & ACCOUNT MANAGEMENT
  // ===========================================================================

  getMe(userId: string): Promise<SanitizedUser> {
    return this.profile.getMe(userId);
  }

  changePassword(
    userId: string,
    dto: ChangePasswordDto,
    meta?: RequestClientMeta,
  ): Promise<{ message: string }> {
    return this.profile.changePassword(userId, dto, meta);
  }

  updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ success: boolean; message: string; user: SanitizedUser }> {
    return this.profile.updateProfile(userId, dto);
  }

  uploadProfilePicture(
    userId: string,
    file: UploadedMulterFile | string,
  ): Promise<ProfilePictureUpdateResult> {
    return this.profile.uploadProfilePicture(userId, file);
  }

  removeProfilePicture(userId: string) {
    return this.profile.removeProfilePicture(userId);
  }

  // ===========================================================================
  // 4. VERIFICATION & OTP
  // ===========================================================================

  verifyOtp(
    dto: VerifyOtpDto,
    meta?: RequestClientMeta,
  ): Promise<AuthResponse> {
    return this.verification.verifyOtp(dto, meta);
  }

  verifyEmail(
    token: string,
    meta?: RequestClientMeta,
  ): Promise<{ success: boolean; message: string }> {
    return this.verification.verifyEmail(token, meta);
  }

  resendVerification(
    email: string,
    meta?: RequestClientMeta,
  ): Promise<{ success: boolean; message: string }> {
    return this.verification.resendVerification(email, meta);
  }
}
