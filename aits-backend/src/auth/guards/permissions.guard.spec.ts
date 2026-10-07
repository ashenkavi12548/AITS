import { PermissionsGuard } from './permissions.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let prisma: { animal: { findUnique: jest.Mock } };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    prisma = {
      animal: {
        findUnique: jest.fn(),
      },
    };
    guard = new PermissionsGuard(reflector, prisma as unknown as PrismaService);
  });

  const mockExecutionContext = (
    user?: AuthenticatedUser,
    requestData: Record<string, unknown> = {},
  ): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
          ...requestData,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no permissions are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = mockExecutionContext();

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not present', async () => {
    reflector.getAllAndOverride.mockReturnValue(['farm:read']);
    const context = mockExecutionContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Access denied: user context not found',
    );
  });

  it('should allow access if user has required global permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['farm:read']);
    const user: AuthenticatedUser = {
      id: '1',
      email: 'user@test.com',
      role: 'USER',
      roles: ['USER'],
      permissions: [],
      globalPermissions: ['farm:read'],
      farmPermissions: {},
      ownedFarms: [],
    };
    const context = mockExecutionContext(user);

    expect(await guard.canActivate(context)).toBe(true);
  });

  describe('when targetFarmId is provided in request', () => {
    it('should deny access if user lacks permission on the target farm', async () => {
      reflector.getAllAndOverride.mockReturnValue(['animal:read']);
      const user: AuthenticatedUser = {
        id: '1',
        email: 'worker@test.com',
        role: 'USER',
        roles: ['USER'],
        permissions: [],
        globalPermissions: [],
        farmPermissions: {
          farmA: ['animal:read'],
        },
        ownedFarms: [],
      };

      const context = mockExecutionContext(user, {
        params: { farmId: 'farmB' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'on farm facility farmB',
      );
    });

    it('should allow access if user has permission on the target farm', async () => {
      reflector.getAllAndOverride.mockReturnValue(['animal:read']);
      const user: AuthenticatedUser = {
        id: '1',
        email: 'worker@test.com',
        role: 'USER',
        roles: ['USER'],
        permissions: [],
        globalPermissions: [],
        farmPermissions: {
          farmA: ['animal:read'],
        },
        ownedFarms: [],
      };

      const context = mockExecutionContext(user, {
        params: { farmId: 'farmA' },
      });

      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow access if user owns the target farm', async () => {
      reflector.getAllAndOverride.mockReturnValue(['animal:read']);
      const user: AuthenticatedUser = {
        id: '1',
        email: 'owner@test.com',
        role: 'USER',
        roles: ['USER'],
        permissions: [],
        globalPermissions: [],
        farmPermissions: {},
        ownedFarms: ['farmC'],
      };

      const context = mockExecutionContext(user, { body: { farmId: 'farmC' } });

      expect(await guard.canActivate(context)).toBe(true);
    });
  });

  describe('when targetFarmId is NOT provided (Gateway Check)', () => {
    it('should allow access if user has permission on ANY farm', async () => {
      reflector.getAllAndOverride.mockReturnValue(['dashboard:view']);
      const user: AuthenticatedUser = {
        id: '1',
        email: 'worker@test.com',
        role: 'USER',
        roles: ['USER'],
        permissions: [],
        globalPermissions: [],
        farmPermissions: {
          farmA: ['dashboard:view'],
        },
        ownedFarms: [],
      };

      const context = mockExecutionContext(user);

      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow access if user owns ANY farm', async () => {
      reflector.getAllAndOverride.mockReturnValue(['dashboard:view']);
      const user: AuthenticatedUser = {
        id: '1',
        email: 'owner@test.com',
        role: 'USER',
        roles: ['USER'],
        permissions: [],
        globalPermissions: [],
        farmPermissions: {},
        ownedFarms: ['farmA'],
      };

      const context = mockExecutionContext(user);

      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should deny access if user has permission on NO farms', async () => {
      reflector.getAllAndOverride.mockReturnValue(['dashboard:view']);
      const user: AuthenticatedUser = {
        id: '1',
        email: 'worker@test.com',
        role: 'USER',
        roles: ['USER'],
        permissions: [],
        globalPermissions: [],
        farmPermissions: {
          farmA: ['animal:read'],
        },
        ownedFarms: [],
      };

      const context = mockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle missing optional array/object properties safely', async () => {
      reflector.getAllAndOverride.mockReturnValue(['dashboard:view']);
      const user = {
        id: '1',
        email: 'worker@test.com',
        role: 'USER',
        // Omit roles, permissions, globalPermissions, farmPermissions, ownedFarms
      } as AuthenticatedUser;

      const context = mockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      // Also test with targetFarmId
      const contextWithFarm = mockExecutionContext(user, {
        params: { farmId: 'farmX' },
      });
      await expect(guard.canActivate(contextWithFarm)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Security Regression Tests', () => {
    it('should deny access if user has farm membership but lacks operation-specific permission (e.g. AUDITOR attempting mutation)', async () => {
      // e.g. AUDITOR has 'traceability:read' but tries an endpoint requiring 'traceability:record'
      reflector.getAllAndOverride.mockReturnValue(['traceability:record']);

      const auditorUser: AuthenticatedUser = {
        id: '2',
        email: 'auditor@test.com',
        role: 'USER',
        roles: ['USER'],
        permissions: [],
        globalPermissions: [],
        farmPermissions: {
          farmA: ['traceability:read', 'health:read', 'farm:read'],
        },
        ownedFarms: [],
      };

      const context = mockExecutionContext(auditorUser, {
        params: { farmId: 'farmA' }, // User is explicitly accessing farmA where they are a member
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access denied: missing required permissions [traceability:record] on farm facility farmA',
      );
    });
  });
});
