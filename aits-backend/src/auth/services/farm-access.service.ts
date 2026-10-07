import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmUserStatus } from '@prisma/client';

@Injectable()
export class FarmAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves farm IDs accessible to the current user based on required permissions.
   */
  async resolveUserAccessibleFarms(
    userId?: string,
    requiredPermissions: string[] = [],
    requireAll: boolean = true,
  ): Promise<{ farmIds: string[] }> {
    if (!userId) {
      return { farmIds: [] };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        userRoles: { include: { role: true } },
        ownedFarms: { where: { deletedAt: null }, select: { id: true } },
        farmMemberships: {
          where: { farm: { deletedAt: null }, status: FarmUserStatus.ACTIVE },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User context invalid or suspended');
    }

    const ownedIds = user.ownedFarms.map((f) => f.id);

    const memberIds = user.farmMemberships
      .filter((fm) => {
        if (requiredPermissions.length === 0) return true;
        const perms = fm.permissions || [];
        return requireAll
          ? requiredPermissions.every((p) => perms.includes(p))
          : requiredPermissions.some((p) => perms.includes(p));
      })
      .map((fm) => fm.farmId);

    const farmIds = Array.from(new Set([...ownedIds, ...memberIds]));

    return { farmIds };
  }
}
