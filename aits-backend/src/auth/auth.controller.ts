import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { UploadedMulterFile, RequestClientMeta } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';

function getClientMeta(req: Request): RequestClientMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = (
    Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded as string)?.split(',')[0] ||
        req.ip ||
        req.socket.remoteAddress ||
        ''
  ).trim();

  const userAgent = (req.headers['user-agent'] || '').trim();

  return { ipAddress, userAgent };
}

function setAuthCookies(
  res: Response,
  accessToken?: string,
  refreshToken?: string,
) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

@Controller(['api/v1/auth', 'api/auth'])
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const meta = getClientMeta(req);
    const result = await this.authService.register(dto, meta);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }



  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const meta = getClientMeta(req);
    const result = await this.authService.login(dto, meta);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const cookieRefreshToken = (
      req.cookies as Record<string, string | undefined> | undefined
    )?.refreshToken;
    const authHeader = req.headers.authorization;
    const bearerRefreshToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : '';
    const refreshToken =
      dto.refreshToken || cookieRefreshToken || bearerRefreshToken || '';

    const meta = getClientMeta(req);
    const result = await this.authService.refreshTokens(refreshToken, meta);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const meta = getClientMeta(req);
    return this.authService.changePassword(userId, dto, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadProfilePicture(
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: UploadedMulterFile,
    @Body('imageData') imageData?: string,
  ) {
    const target = file || imageData;
    if (!target) {
      throw new BadRequestException('No image file or data provided');
    }
    return this.authService.uploadProfilePicture(userId, target);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile-picture')
  @HttpCode(HttpStatus.OK)
  async removeProfilePicture(@CurrentUser('id') userId: string) {
    return this.authService.removeProfilePicture(userId);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const cookieRefreshToken = (
      req.cookies as Record<string, string | undefined> | undefined
    )?.refreshToken;
    const bodyRefreshToken = (req.body as { refreshToken?: string })
      ?.refreshToken;
    const refreshToken = cookieRefreshToken || bodyRefreshToken;
    const meta = getClientMeta(req);

    await this.authService.logout(refreshToken, user?.id, meta);
    clearAuthCookies(res);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const meta = getClientMeta(req);
    await this.authService.logoutAll(userId, meta);
    clearAuthCookies(res);
    return {
      success: true,
      message: 'All active sessions have been terminated successfully.',
    };
  }
}
