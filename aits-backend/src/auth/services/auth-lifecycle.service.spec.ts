import { Test, TestingModule } from '@nestjs/testing';
import { AuthLifecycleService } from './auth-lifecycle.service';
import { PrismaService } from '../../database/prisma.service';
import { AuthCommonService } from './auth-common.service';
import { AuthTokensService } from './auth-tokens.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

describe('AuthLifecycleService', () => {
  let service: AuthLifecycleService;
  let prisma: PrismaService;
  let tokens: AuthTokensService;
  let common: AuthCommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthLifecycleService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUniqueOrThrow: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
            userRole: { create: jest.fn() },
            farm: { create: jest.fn().mockResolvedValue({ id: 'farm-id' }) },
            farmUser: { create: jest.fn() },
            notificationPreference: { create: jest.fn() },
          },
        },
        {
          provide: AuthCommonService,
          useValue: {
            logAuditEvent: jest.fn(),
            formatUser: jest
              .fn()
              .mockReturnValue({ id: 'user-id', email: 'test@example.com' }),
          },
        },
        {
          provide: AuthTokensService,
          useValue: {
            generateTokens: jest.fn().mockResolvedValue({
              accessToken: 'access',
              refreshToken: 'refresh',
              expiresIn: 900,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthLifecycleService>(AuthLifecycleService);
    prisma = module.get<PrismaService>(PrismaService);
    tokens = module.get<AuthTokensService>(AuthTokensService);
    common = module.get<AuthCommonService>(AuthCommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should throw ConflictException if email is already in use', async () => {
      jest
        .spyOn(prisma.user, 'findFirst')
        .mockResolvedValue({ id: 'existing-id' } as any);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
    });

    it('should successfully register a user, generate tokens, and create a session', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
      jest
        .spyOn(prisma.role, 'findUnique')
        .mockResolvedValue({ id: 'role-id', name: 'FARMER' } as any);
      jest
        .spyOn(prisma.user, 'create')
        .mockResolvedValue({ id: 'new-user-id' } as any);
      jest
        .spyOn(prisma.user, 'findUniqueOrThrow')
        .mockResolvedValue({ id: 'new-user-id' } as any);

      const result = await service.register(dto);

      expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(tokens.generateTokens).toHaveBeenCalledWith(
        'user-id',
        'test@example.com',
        undefined,
      );
      expect(result).toHaveProperty('accessToken', 'access');
      expect(result).toHaveProperty('refreshToken', 'refresh');
      expect(result).toHaveProperty('user');
    });
  });
});
