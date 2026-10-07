import { Test, TestingModule } from '@nestjs/testing';
import { DashboardAnalyticsService } from './dashboard-analytics.service';
import { PrismaService } from '../../database/prisma.service';
import { DashboardHelpersService } from './dashboard-helpers.service';

describe('DashboardAnalyticsService', () => {
  let service: DashboardAnalyticsService;
  let prisma: PrismaService;
  let helpers: DashboardHelpersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardAnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            animal: {
              count: jest.fn(),
              groupBy: jest.fn(),
              findMany: jest.fn(),
            },
            milkProduction: {
              aggregate: jest
                .fn()
                .mockResolvedValue({ _sum: { quantityLiters: 0 } }),
              findMany: jest.fn(),
              groupBy: jest.fn(),
            },
            healthCase: { count: jest.fn(), findMany: jest.fn() },
            pregnancy: { count: jest.fn(), groupBy: jest.fn() },
            farmTransfer: { count: jest.fn(), findMany: jest.fn() },
            farm: { findMany: jest.fn() },
            quarantineRecord: { count: jest.fn().mockResolvedValue(0) },
          },
        },
        {
          provide: DashboardHelpersService,
          useValue: {
            parseDateRange: jest.fn().mockReturnValue({
              start: new Date(),
              end: new Date(),
              prevStart: new Date(),
              prevEnd: new Date(),
              days: 30,
            }),
            resolveAuthorizedFarms: jest
              .fn()
              .mockResolvedValue({ isAdmin: true, farmIds: [] }),
            createSummaryItem: jest.fn().mockReturnValue({ title: 'Mock' }),
            buildAnimalFilter: jest.fn().mockReturnValue({ deletedAt: null }),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardAnalyticsService>(DashboardAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
    helpers = module.get<DashboardHelpersService>(DashboardHelpersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverviewAnalytics', () => {
    it('should aggregate API responses securely and construct correct chart data shapes', async () => {
      // Mock basic counts
      (prisma.animal.count as jest.Mock).mockResolvedValue(10);
      (prisma.milkProduction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { quantityLiters: 100 },
      });
      (prisma.healthCase.count as jest.Mock).mockResolvedValue(2);
      (prisma.pregnancy.count as jest.Mock).mockResolvedValue(1);
      (prisma.farmTransfer.count as jest.Mock).mockResolvedValue(0);

      // Mock chart queries
      (prisma.animal.groupBy as jest.Mock).mockResolvedValue([
        { status: 'ACTIVE', _count: { id: 10 } },
      ]);
      (prisma.milkProduction.groupBy as jest.Mock).mockResolvedValue([
        { _count: { _all: 1 }, animalId: 'a1' },
      ]);
      (prisma.milkProduction.findMany as jest.Mock).mockResolvedValue([
        { productionDate: new Date('2026-09-14'), quantityLiters: 50 },
      ]);
      (prisma.healthCase.findMany as jest.Mock).mockResolvedValue([
        { title: 'Fever' },
      ]);
      (prisma.pregnancy.groupBy as jest.Mock).mockResolvedValue([
        { status: 'CONFIRMED', _count: { id: 1 } },
      ]);
      (prisma.farmTransfer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.farm.findMany as jest.Mock).mockResolvedValue([
        { name: 'Farm A', _count: { animals: 10 } },
      ]);
      (prisma.animal.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getOverviewAnalytics(
        {
          farmId: 'ALL',
        },
        'user-1',
      );

      expect(result.summary).toBeDefined();
      expect(result.animalStatusDistribution).toEqual([
        {
          name: 'ACTIVE',
          label: 'ACTIVE',
          value: 10,
          percentage: 100,
          color: '#10B981',
        },
      ]);
      expect(result.healthCasesByCategory).toEqual([
        { name: 'Fever', category: 'Fever', value: 1 },
      ]);
      expect(result.pregnancyStatusDistribution).toEqual([
        { name: 'CONFIRMED', label: 'CONFIRMED', value: 1 },
      ]);
      expect(result.animalsByFarm).toEqual([{ name: 'Farm A', value: 10 }]);

      // Ensure health filter checks for active status
      const healthCaseMock = prisma.healthCase as unknown as {
        findMany: jest.Mock<Promise<unknown>, [Record<string, unknown>]>;
      };
      expect(healthCaseMock.findMany.mock.calls.length).toBeGreaterThan(0);
      const callArgs = healthCaseMock.findMany.mock.calls[0]?.[0] as
        { where?: { status?: string } } | undefined;
      expect(callArgs?.where?.status).toBe('OPEN');
    });

    it('should aggregate data by week when date range exceeds 31 days', async () => {
      // Mock helpers to return days > 31
      jest.spyOn(helpers, 'parseDateRange').mockReturnValueOnce({
        start: new Date('2026-08-01T00:00:00.000Z'),
        end: new Date('2026-10-01T23:59:59.999Z'),
        prevStart: new Date('2026-06-01T00:00:00.000Z'),
        prevEnd: new Date('2026-07-31T23:59:59.999Z'),
        days: 62,
      });

      // Mock basic counts and aggregates
      (prisma.animal.count as jest.Mock).mockResolvedValue(10);
      (prisma.milkProduction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { quantityLiters: 100 },
      });
      (prisma.healthCase.count as jest.Mock).mockResolvedValue(2);
      (prisma.pregnancy.count as jest.Mock).mockResolvedValue(1);
      (prisma.farmTransfer.count as jest.Mock).mockResolvedValue(0);
      (prisma.animal.groupBy as jest.Mock).mockResolvedValue([
        { status: 'ACTIVE', _count: { id: 10 } },
      ]);
      (prisma.healthCase.findMany as jest.Mock).mockResolvedValue([
        { title: 'Fever' },
      ]);
      (prisma.pregnancy.groupBy as jest.Mock).mockResolvedValue([
        { status: 'CONFIRMED', _count: { id: 1 } },
      ]);
      (prisma.farm.findMany as jest.Mock).mockResolvedValue([
        { name: 'Farm A', _count: { animals: 10 } },
      ]);
      (prisma.animal.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.milkProduction.groupBy as jest.Mock).mockResolvedValue([
        { _count: { _all: 1 }, animalId: 'a1' },
      ]);

      // Mock specific test data
      (prisma.milkProduction.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            productionDate: new Date('2026-08-05T10:00:00.000Z'),
            quantityLiters: 10,
          },
          {
            productionDate: new Date('2026-08-11T10:00:00.000Z'),
            quantityLiters: 20,
          },
        ])
        .mockResolvedValueOnce([
          {
            productionDate: new Date('2026-06-05T10:00:00.000Z'),
            quantityLiters: 15,
          },
        ]);

      (prisma.farmTransfer.findMany as jest.Mock).mockResolvedValueOnce([
        { departureDate: new Date('2026-08-05T10:00:00.000Z') },
      ]);

      const result = await service.getOverviewAnalytics(
        {
          farmId: 'ALL',
        },
        'user-1',
      );

      // Ensure milkProductionTrend contains 'Wk of' prefix
      expect(result.milkProductionTrend.length).toBeGreaterThan(0);
      expect(result.milkProductionTrend[0].name).toMatch(/^Wk of /);
      expect(result.farmMovementTrend.length).toBeGreaterThan(0);
      expect(result.farmMovementTrend[0].name).toMatch(/^Wk of /);
    });
  });
});
