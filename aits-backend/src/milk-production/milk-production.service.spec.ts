import { Test, TestingModule } from '@nestjs/testing';
import { MilkProductionService } from './milk-production.service';
import { PrismaService } from '../database/prisma.service';
import { FarmAccessService } from '../auth/services/farm-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnimalBusinessRulesService } from '../common/business-rules/animal-business-rules.service';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

type MockPrismaService = {
  milkProduction: {
    findUnique: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
};

type MockFarmAccessService = {
  resolveUserAccessibleFarms: jest.Mock;
};

describe('MilkProductionService', () => {
  let service: MilkProductionService;
  let prismaService: MockPrismaService;
  let farmAccessService: MockFarmAccessService;

  beforeEach(async () => {
    prismaService = {
      milkProduction: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    farmAccessService = {
      resolveUserAccessibleFarms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilkProductionService,
        { provide: PrismaService, useValue: prismaService },
        { provide: FarmAccessService, useValue: farmAccessService },
        {
          provide: NotificationsService,
          useValue: { sendNotification: jest.fn() },
        },
        {
          provide: AnimalBusinessRulesService,
          useValue: { validateMilkEligibility: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MilkProductionService>(MilkProductionService);
  });

  describe('deleteRecordPermanent', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const mockUserId = 'user-123';
    const mockFarmId = 'farm-123';
    const mockRecord = {
      id: validUuid,
      farmId: mockFarmId,
      animalId: 'animal-123',
      productionDate: new Date(),
      quantityLiters: 10,
    };

    it('should throw BadRequestException if UUID is invalid format', async () => {
      await expect(
        service.deleteRecordPermanent(mockUserId, 'invalid-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if record does not exist', async () => {
      prismaService.milkProduction.findUnique.mockResolvedValue(null);
      await expect(
        service.deleteRecordPermanent(mockUserId, validUuid),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user lacks milk:delete-permanent for the farm', async () => {
      prismaService.milkProduction.findUnique.mockResolvedValue(mockRecord);
      farmAccessService.resolveUserAccessibleFarms.mockResolvedValue({
        farmIds: ['other-farm'],
      });

      await expect(
        service.deleteRecordPermanent(mockUserId, validUuid),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully permanently delete the record if user is authorized', async () => {
      prismaService.milkProduction.findUnique.mockResolvedValue(mockRecord);
      farmAccessService.resolveUserAccessibleFarms.mockResolvedValue({
        farmIds: [mockFarmId],
      });
      prismaService.milkProduction.delete.mockResolvedValue({ id: validUuid });
      prismaService.user.findUnique.mockResolvedValue({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      });

      const result = await service.deleteRecordPermanent(mockUserId, validUuid);

      expect(prismaService.auditLog.create).toHaveBeenCalled();
      expect(prismaService.milkProduction.delete).toHaveBeenCalledWith({
        where: { id: validUuid },
      });
      expect(result.success).toBe(true);
    });
  });
});
