import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../database/prisma.service';
import { FarmAccessService } from '../auth/services/farm-access.service';
import { ConflictException } from '@nestjs/common';
import { CreateVaccinationDto, UpdateVaccinationDto } from './dto';
import { HealthStateService } from './health-state.service';
import { SurveillanceService } from './surveillance.service';

describe('HealthService - Vaccinations', () => {
  let service: HealthService;
  let prismaService: PrismaService;
  let farmAccessService: FarmAccessService;

  const mockPrismaService = {
    animal: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    vaccination: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockFarmAccessService = {
    hasFarmAccess: jest.fn().mockResolvedValue(true),
    resolveUserAccessibleFarms: jest.fn().mockResolvedValue({
      farmIds: ['farm-1'],
      isGlobalAdmin: false,
    }),
  };

  const mockHealthStateService = {
    evaluateOverallHealthStatus: jest.fn(),
  };

  const mockSurveillanceService = {
    reportHealthEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FarmAccessService, useValue: mockFarmAccessService },
        { provide: HealthStateService, useValue: mockHealthStateService },
        { provide: SurveillanceService, useValue: mockSurveillanceService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
    farmAccessService = module.get<FarmAccessService>(FarmAccessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVaccination', () => {
    it('should throw ConflictException if vaccination exists on the same day', async () => {
      const dto: CreateVaccinationDto = {
        animalTag: 'TAG123',
        vaccineName: 'FMD',
        dose: '2ml',
      };
      const userId = 'user-1';

      mockPrismaService.animal.findUnique.mockResolvedValue({
        id: 'animal-1',
        farmId: 'farm-1',
      });
      mockPrismaService.vaccination.findFirst.mockResolvedValue({
        id: 'existing-vac',
      });

      await expect(service.createVaccination(dto, userId)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.vaccination.findFirst).toHaveBeenCalled();
    });

    it('should set vaccinationDate to current system date (today)', async () => {
      const dto: CreateVaccinationDto = {
        animalTag: 'TAG123',
        vaccineName: 'FMD',
        dose: '2ml',
      };
      const userId = 'user-1';

      mockPrismaService.animal.findUnique.mockResolvedValue({
        id: 'animal-1',
        farmId: 'farm-1',
      });
      mockPrismaService.vaccination.findFirst.mockResolvedValue(null);
      mockPrismaService.vaccination.create.mockResolvedValue({ id: 'new-vac' });

      await service.createVaccination(dto, userId);

      expect(mockPrismaService.vaccination.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            vaccineName: 'FMD',
            // Check that it ignores dto.vaccinationDate and uses a new Date
            vaccinationDate: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('updateVaccination', () => {
    it('should update vaccination without changing vaccinationDate', async () => {
      const dto: UpdateVaccinationDto = {
        vaccineName: 'FMD Booster',
        dose: '3ml',
        status: 'COMPLETED',
      };
      const vacId = 'vac-1';
      const userId = 'user-1';

      const existingVac = {
        id: vacId,
        animalId: 'animal-1',
        vaccineName: 'FMD',
        vaccinationDate: new Date('2025-01-01'), // Original Date
        animal: {
          farmId: 'farm-1',
        },
      };

      mockPrismaService.vaccination.findUnique.mockResolvedValue(existingVac);
      mockPrismaService.vaccination.update.mockResolvedValue({ id: vacId });

      await service.updateVaccination(vacId, dto, userId);

      expect(mockPrismaService.vaccination.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: vacId },
          data: expect.not.objectContaining({
            vaccinationDate: expect.anything(),
          }),
        }),
      );
    });

    it('should clear existing SCHEDULED reminders if nextDueDate is null', async () => {
      const dto: UpdateVaccinationDto = {
        nextDueDate: null,
      };
      const vacId = 'vac-1';
      const userId = 'user-1';

      const existingVac = {
        id: vacId,
        animalId: 'animal-1',
        vaccineName: 'FMD',
        animal: {
          farmId: 'farm-1',
        },
      };

      mockPrismaService.vaccination.findUnique.mockResolvedValue(existingVac);
      mockPrismaService.vaccination.update.mockResolvedValue({ id: vacId });

      await service.updateVaccination(vacId, dto, userId);

      expect(mockPrismaService.vaccination.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            animalId: 'animal-1',
            vaccineName: 'FMD',
            status: 'SCHEDULED',
          },
        }),
      );
    });
  });
});
