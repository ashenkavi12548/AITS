import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MockPrismaService = {
  user: { findFirst: jest.Mock };
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    // Override env for test
    process.env.JWT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should throw UnauthorizedException if payload has no sub', async () => {
    await expect(
      strategy.validate({} as unknown as { sub: string; email: string }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      strategy.validate({} as unknown as { sub: string; email: string }),
    ).rejects.toThrow('Invalid token payload');
  });

  it('should throw UnauthorizedException if user is not found', async () => {
    prismaService.user.findFirst.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: 'user-1', email: 'test@test.com' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      strategy.validate({ sub: 'user-1', email: 'test@test.com' }),
    ).rejects.toThrow('User account is inactive or not found');
  });

  it('should throw UnauthorizedException if user status is not ACTIVE', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      status: 'SUSPENDED',
    });
    await expect(
      strategy.validate({ sub: 'user-1', email: 'test@test.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should properly map roles, permissions, and owned farms', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      status: 'ACTIVE',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      profileImageUrl: null,
      userRoles: [
        {
          role: {
            name: 'WORKER',
            rolePermissions: [{ permission: { name: 'dashboard:view' } }],
          },
        },
      ],
      farmMemberships: [
        { farmId: 'farm-1', permissions: ['animal:read'] },
        { farmId: 'farm-2', permissions: null as unknown as string[] }, // defensive check
      ],
      ownedFarms: [{ id: 'farm-3' }],
    });

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'test@test.com',
      role: 'PAYLOAD_ROLE',
    });

    expect(result).toEqual({
      id: 'user-1',
      email: 'test@test.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      profileImageUrl: null,
      status: 'ACTIVE',
      role: 'WORKER', // primary role from DB
      roles: ['WORKER'],
      permissions: ['dashboard:view', 'animal:read'], // merged global and farm
      globalPermissions: ['dashboard:view'],
      farmPermissions: {
        'farm-1': ['animal:read'],
        'farm-2': [],
      },
      ownedFarms: ['farm-3'],
    });
  });

  it('should use payload role or FARMER fallback if DB roles are empty', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'user-2',
      email: 'test2@test.com',
      status: 'ACTIVE',
      userRoles: [],
      farmMemberships: [],
      ownedFarms: [],
    });

    // With payload role
    const result1 = await strategy.validate({
      sub: 'user-2',
      email: 'test2@test.com',
      role: 'PAYLOAD_ROLE',
    });
    expect(result1.role).toBe('PAYLOAD_ROLE');
    expect(result1.roles).toEqual(['PAYLOAD_ROLE']);

    // Without payload role (FARMER fallback)
    const result2 = await strategy.validate({
      sub: 'user-2',
      email: 'test2@test.com',
    });
    expect(result2.role).toBe('FARMER');
    expect(result2.roles).toEqual(['FARMER']);
  });

  it('should safely handle missing userRoles safely in flatMap', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'user-3',
      email: 'test3@test.com',
      status: 'ACTIVE',
      userRoles: [{ role: { name: 'SOME_ROLE' } }], // rolePermissions missing for branch check
      farmMemberships: [],
      ownedFarms: [],
    });

    const result = await strategy.validate({
      sub: 'user-3',
      email: 'test3@test.com',
    });
    expect(result.globalPermissions).toEqual([]);
  });
});
