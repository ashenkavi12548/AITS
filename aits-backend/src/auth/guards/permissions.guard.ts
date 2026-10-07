import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import {
  PERMISSIONS_KEY,
  ANY_PERMISSIONS_KEY,
} from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    let requireAll = true;

    if (!requiredPermissions || requiredPermissions.length === 0) {
      const anyPermissions = this.reflector.getAllAndOverride<string[]>(
        ANY_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (anyPermissions && anyPermissions.length > 0) {
        requiredPermissions = anyPermissions;
        requireAll = false;
      } else {
        return true;
      }
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: user context not found');
    }

    const globalPerms = new Set(user.globalPermissions || []);

    const checkFn = requireAll
      ? (arr: string[], fn: (p: string) => boolean) => arr.every(fn)
      : (arr: string[], fn: (p: string) => boolean) => arr.some(fn);

    // Check if user has the permission globally
    const hasGlobal = checkFn(requiredPermissions, (p) => globalPerms.has(p));
    if (hasGlobal) {
      return true;
    }

    const req = request as unknown as Request;
    const reqBody = req.body as Record<string, unknown> | undefined;
    let targetFarmId =
      (req.params?.farmId as string | undefined) ||
      (req.query?.farmId as string | undefined) ||
      (reqBody?.farmId as string | undefined);

    if (!targetFarmId) {
      const isGetRequest = req.method === 'GET';

      if (!isGetRequest) {
        const animalId =
          (req.params?.animalId as string | undefined) ||
          (req.query?.animalId as string | undefined) ||
          (reqBody?.animalId as string | undefined);

        if (animalId) {
          const animal = await this.prisma.animal.findUnique({
            where: { id: animalId },
            select: { farmId: true },
          });
          if (animal) {
            targetFarmId = animal.farmId;
          }
        }
      }
    }

    if (targetFarmId && targetFarmId !== 'ALL') {
      // If a specific farm is targeted, check if user has permissions specifically on that farm
      const hasOnTargetFarm = checkFn(requiredPermissions, (reqPerm) => {
        if (user.ownedFarms && user.ownedFarms.includes(targetFarmId))
          return true;
        const permsOnFarm = user.farmPermissions?.[targetFarmId] || [];
        return permsOnFarm.includes(reqPerm);
      });

      if (!hasOnTargetFarm) {
        throw new ForbiddenException(
          `Access denied: missing required permissions [${requiredPermissions.join(', ')}] on farm facility ${targetFarmId}`,
        );
      }
      return true;
    }

    // Fallback gateway check: check if user has the permission on ANY farm they belong to.
    // The service layer must handle specific farm authorization boundaries.
    const hasOnAnyFarm = checkFn(requiredPermissions, (reqPerm) => {
      if (user.ownedFarms && user.ownedFarms.length > 0) return true;
      return Object.values(user.farmPermissions || {}).some((perms) =>
        perms.includes(reqPerm),
      );
    });

    if (!hasOnAnyFarm) {
      throw new ForbiddenException(
        `Access denied: missing required permissions [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
