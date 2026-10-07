import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from './jwt.strategy';

interface RequestWithRefreshBody extends Request {
  body: {
    refreshToken?: string;
  };
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req?.cookies as Record<string, string | undefined> | undefined)
            ?.refreshToken || null,
        (req: RequestWithRefreshBody): string | null => {
          if (req?.body?.refreshToken) {
            return req.body.refreshToken;
          }
          const authHeader = req?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_REFRESH_SECRET ||
        'aits-dev-jwt-refresh-secret-key-2026-production-ready',
      passReqToCallback: true,
    });
  }

  async validate(req: RequestWithRefreshBody, payload: JwtPayload) {
    const refreshToken =
      (req?.cookies as Record<string, string | undefined> | undefined)
        ?.refreshToken ||
      req?.body?.refreshToken ||
      req?.headers?.authorization?.replace('Bearer ', '').trim();

    if (!payload?.sub || !refreshToken) {
      throw new UnauthorizedException('Invalid or missing refresh token');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return {
      id: user.id,
      email: user.email,
      refreshToken,
    };
  }
}
