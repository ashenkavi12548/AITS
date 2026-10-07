import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { SanitizedUser, UserWithRolesAndFarms } from '../types/auth.types';

@Injectable()
export class AuthCommonService {
  private readonly logger = new Logger(AuthCommonService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAuditEvent(params: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    oldValues?: Prisma.InputJsonValue;
    newValues?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entityType: params.entityType || 'Auth',
          entityId: params.entityId || null,
          oldValues: params.oldValues || Prisma.JsonNull,
          newValues: params.newValues || Prisma.JsonNull,
          ipAddress: params.ipAddress?.slice(0, 100) || null,
          userAgent: params.userAgent?.slice(0, 255) || null,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[AuditLog] Failed to record audit event: ${msg}`);
    }
  }

  /**
   * Helper to format a Prisma user record into a secure, sanitized DTO
   */
  formatUser(user: UserWithRolesAndFarms): SanitizedUser {
    const roles: string[] = (user.userRoles || [])
      .map((ur) => ur?.role?.name)
      .filter((name): name is string => typeof name === 'string');

    let primaryRole = 'FARMER';
    if (roles.length > 0) {
      const rolePriority: string[] = [
        'FARMER',
        'MANAGER',
        'VETERINARIAN',
        'WORKER',
      ];
      const foundRole = rolePriority.find((r) => roles.includes(r));
      const firstRole: string | undefined = roles[0];
      primaryRole = foundRole ?? firstRole ?? 'FARMER';
    }

    const primaryOwnedFarm = user.ownedFarms?.[0];
    const primaryMembership = user.farmMemberships?.find(
      (fm) => fm.status === 'ACTIVE',
    );

    const farmPermissionsList =
      (primaryMembership?.permissions as string[]) || [];

    const permissions = Array.from(
      new Set([
        ...(user.userRoles?.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ) || []),
        ...farmPermissionsList,
      ]),
    );

    const farmPermissionsMap: Record<string, string[]> = {};
    const farmRolesMap: Record<string, string> = {};
    if (user.farmMemberships) {
      for (const membership of user.farmMemberships) {
        if (membership.status === 'ACTIVE' && membership.farmId) {
          farmPermissionsMap[membership.farmId] = membership.permissions || [];
          farmRolesMap[membership.farmId] = membership.role;
        }
      }
    }

    const ownedFarmsList = user.ownedFarms?.map((farm) => farm.id) || [];
    for (const farmId of ownedFarmsList) {
      farmRolesMap[farmId] = 'OWNER';
    }

    // Farmers/Admins get their owned farm; Workers get their assigned farm
    const primaryFarmId =
      primaryOwnedFarm?.id ?? primaryMembership?.farm?.id ?? null;
    const primaryFarmName =
      primaryOwnedFarm?.name ?? primaryMembership?.farm?.name ?? null;
    const farmRole = primaryOwnedFarm
      ? 'OWNER'
      : (primaryMembership?.role ?? null);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
      role: primaryRole,
      roles,
      permissions,
      status: user.status,

      primaryFarmId,
      primaryFarmName,
      farmRole,
      farmPermissions: farmPermissionsMap,
      farmRoles: farmRolesMap,
      ownedFarms: ownedFarmsList,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
