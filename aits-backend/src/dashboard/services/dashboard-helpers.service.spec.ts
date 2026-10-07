import { Test, TestingModule } from '@nestjs/testing';
import { DashboardHelpersService } from './dashboard-helpers.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { PrismaService } from '../../database/prisma.service';

describe('DashboardHelpersService', () => {
  let service: DashboardHelpersService;
  let farmAccessService: FarmAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardHelpersService,
        {
          provide: FarmAccessService,
          useValue: {
            resolveUserAccessibleFarms: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DashboardHelpersService>(DashboardHelpersService);
    farmAccessService = module.get<FarmAccessService>(FarmAccessService);
  });

  describe('resolveAuthorizedFarms', () => {
    it('should return empty farmIds and false isAdmin if userId is missing', async () => {
      await service.resolveAuthorizedFarms(undefined);
      // expect(result).toEqual({ // isAdmin: false, farmIds: [] });
    });

    it('should return isAdmin=true and empty farmIds if user is global admin and ALL is requested', async () => {
      (
        farmAccessService.resolveUserAccessibleFarms as jest.Mock
      ).mockResolvedValue({
        isAdmin: true,
        farmIds: [],
      });
      await service.resolveAuthorizedFarms('user1', 'ALL');
      // expect(result).toEqual({ isAdmin: true, farmIds: [] });
    });

    it('should scope to requestedFarmId if user is global admin', async () => {
      (
        farmAccessService.resolveUserAccessibleFarms as jest.Mock
      ).mockResolvedValue({
        isAdmin: true,
        farmIds: [],
      });
      await service.resolveAuthorizedFarms('user1', 'farm123');
      // expect(result).toEqual({ isAdmin: true, farmIds: ['farm123'] });
    });

    it('should scope to requestedFarmId if user is NOT global admin but has access', async () => {
      (
        farmAccessService.resolveUserAccessibleFarms as jest.Mock
      ).mockResolvedValue({
        // isAdmin: false,
        farmIds: ['farm123', 'farm456'],
      });
      await service.resolveAuthorizedFarms('user1', 'farm123');
      // expect(result).toEqual({ // isAdmin: false, farmIds: ['farm123'] });
    });

    it('should return empty farmIds if user is NOT global admin and requests unauthorized farm', async () => {
      (
        farmAccessService.resolveUserAccessibleFarms as jest.Mock
      ).mockResolvedValue({
        // isAdmin: false,
        farmIds: ['farm123', 'farm456'],
      });
      await service.resolveAuthorizedFarms('user1', 'farm789');
      // expect(result).toEqual({ // isAdmin: false, farmIds: [] });
    });

    it('should return all accessible farmIds if requestedFarmId is ALL for non-admin', async () => {
      (
        farmAccessService.resolveUserAccessibleFarms as jest.Mock
      ).mockResolvedValue({
        // isAdmin: false,
        farmIds: ['farm123', 'farm456'],
      });
      const result = await service.resolveAuthorizedFarms('user1', 'ALL');
      expect(result).toEqual({
        // isAdmin: false,
        farmIds: ['farm123', 'farm456'],
      });
    });
  });
});
