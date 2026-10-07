import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../database/prisma.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthCommonService } from './services/auth-common.service';
import { AuthTokensService } from './services/auth-tokens.service';
import { AuthLifecycleService } from './services/auth-lifecycle.service';
import { AuthProfileService } from './services/auth-profile.service';

import { FarmAccessService } from './services/farm-access.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthCommonService,
    AuthTokensService,
    AuthLifecycleService,
    AuthProfileService,

    FarmAccessService,
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthCommonService,
    AuthTokensService,
    AuthLifecycleService,
    AuthProfileService,

    FarmAccessService,
    AuthService,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    PermissionsGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
