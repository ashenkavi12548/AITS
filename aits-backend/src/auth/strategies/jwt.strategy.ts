import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) =>
          (req?.cookies as Record<string, string | undefined> | undefined)
            ?.accessToken || null,
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        process.env.JWT_ACCESS_SECRET ||
        'aits-dev-jwt-secret-key-2026-production-ready',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

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
        farmMemberships: {
          where: { status: 'ACTIVE' },
        },
        ownedFarms: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    let primaryRole = payload.role || 'FARMER';
    if (roles.length > 0) {
      const rolePriority = [
        'ADMIN',
        'FARMER',
        'MANAGER',
        'VETERINARIAN',
        'WORKER',
      ];
      const foundRole = rolePriority.find((r) => roles.includes(r));
      primaryRole = foundRole || roles[0];
    }

    const globalPermissions = Array.from(
      new Set(
        user.userRoles?.flatMap(
          (ur) =>
            ur.role?.rolePermissions
              ?.map((rp) => rp.permission?.name)
              .filter(Boolean) || [],
        ) || [],
      ),
    );

    const farmPermissionsMap: Record<string, string[]> = {};
    const farmPermissionsArray: string[] = [];

    user.farmMemberships.forEach((fm) => {
      const perms = fm.permissions || [];
      farmPermissionsMap[fm.farmId] = perms;
      farmPermissionsArray.push(...perms);
    });

    const ownedFarms = user.ownedFarms.map((f) => f.id);

    // Merge them all for backward compatibility in legacy generic guards
    const permissions = Array.from(
      new Set([...globalPermissions, ...farmPermissionsArray]),
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
      role: primaryRole,
      roles: roles.length > 0 ? roles : [primaryRole],
      permissions,
      globalPermissions,
      farmPermissions: farmPermissionsMap,
      ownedFarms,
      status: user.status,
    };
  }
}
