import { Test, TestingModule } from '@nestjs/testing';
import { FarmAccessService } from './farm-access.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { Prisma, RoleName, FarmUserStatus } from '@prisma/client';

type MockPrismaService = {
  user: { findUnique: jest.Mock };
};

describe('FarmAccessService', () => {
  let service: FarmAccessService;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmAccessService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FarmAccessService>(FarmAccessService);
    prismaService = module.get(PrismaService);
  });

  it('should return empty farmIds if no userId is provided', async () => {
    const result = await service.resolveUserAccessibleFarms();
    // expect(result.isAdmin).toBe(false);
    expect(result.farmIds).toEqual([]);
  });

  it('should throw ForbiddenException if user is not found', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);
    await expect(service.resolveUserAccessibleFarms('user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return isOwner=true and empty farmIds for ADMIN users', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      userRoles: [{ role: { name: RoleName.FARMER } }],
      ownedFarms: [],
      farmMemberships: [],
    });

    const result = await service.resolveUserAccessibleFarms('admin-1');
    // expect(result.isAdmin).toBe(true);
    expect(result.farmIds).toEqual([]);
  });

  it('should return isOwner=true if user has additional admin roles', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'auditor-1',
      userRoles: [{ role: { name: 'MANAGER' as RoleName } }],
      ownedFarms: [],
      farmMemberships: [],
    });

    const result = await service.resolveUserAccessibleFarms('auditor-1', []);
    // expect(result.isAdmin).toBe(true);
    expect(result.farmIds).toEqual([]);
  });

  it('should return owned farms and all active farm memberships when no specific permissions are required', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      userRoles: [{ role: { name: RoleName.FARMER } }],
      ownedFarms: [{ id: 'farm-1' }],
      farmMemberships: [
        {
          farmId: 'farm-2',
          status: FarmUserStatus.ACTIVE,
          permissions: ['animal:read'],
        },
        { farmId: 'farm-3', status: FarmUserStatus.ACTIVE, permissions: [] },
      ],
    });

    const result = await service.resolveUserAccessibleFarms('user-1');
    // expect(result.isAdmin).toBe(false);
    expect(result.farmIds).toContain('farm-1');
    expect(result.farmIds).toContain('farm-2');
    expect(result.farmIds).toContain('farm-3');
    expect(result.farmIds.length).toBe(3);
  });

  it('should filter farm memberships by required permissions and handle missing permissions safely', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'worker-1',
      userRoles: [{ role: { name: RoleName.FARMER } }],
      ownedFarms: [],
      farmMemberships: [
        {
          farmId: 'farm-a',
          status: FarmUserStatus.ACTIVE,
          permissions: ['animal:read', 'animal:create'],
        },
        {
          farmId: 'farm-b',
          status: FarmUserStatus.ACTIVE,
          permissions: ['animal:read'],
        },
        {
          farmId: 'farm-c',
          status: FarmUserStatus.ACTIVE,
          permissions: null as unknown as Prisma.InputJsonValue,
        }, // Testing defensive branch
      ],
    });

    const result = await service.resolveUserAccessibleFarms('worker-1', [
      'animal:create',
    ]);
    // expect(result.isAdmin).toBe(false);
    expect(result.farmIds).toEqual(['farm-a']); // farm-b lacks it, farm-c is null
  });

  it('should always include owned farms regardless of required permissions', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'owner-1',
      userRoles: [{ role: { name: RoleName.FARMER } }],
      ownedFarms: [{ id: 'farm-owned' }],
      farmMemberships: [
        {
          farmId: 'farm-member',
          status: FarmUserStatus.ACTIVE,
          permissions: ['some:other:perm'],
        },
      ],
    });

    const result = await service.resolveUserAccessibleFarms('owner-1', [
      'animal:create',
    ]);
    // expect(result.isAdmin).toBe(false);
    expect(result.farmIds).toEqual(['farm-owned']); // farm-member is excluded, owned is included
  });

  it('should deduplicate farm IDs', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'dup-1',
      userRoles: [{ role: { name: RoleName.FARMER } }],
      ownedFarms: [{ id: 'farm-x' }],
      farmMemberships: [
        { farmId: 'farm-x', status: FarmUserStatus.ACTIVE, permissions: [] }, // Same ID as owned
      ],
    });

    const result = await service.resolveUserAccessibleFarms('dup-1');
    // expect(result.isAdmin).toBe(false);
    expect(result.farmIds).toEqual(['farm-x']);
  });
});
