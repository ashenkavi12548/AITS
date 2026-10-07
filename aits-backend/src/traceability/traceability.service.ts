import { Injectable } from '@nestjs/common';
import {
  DailyActivityType,
  ActivitySession,
  ActivityStatus,
  FarmTransferStatus,
  FarmTransferReason,
} from '@prisma/client';
import { CreateDailyActivityDto } from './dto/create-daily-activity.dto';
import {
  ConfirmArrivalDto,
  CreateFarmTransferDto,
  CancelTransferDto,
} from './dto/farm-transfer.dto';
import { DailyActivityService } from './services/daily-activity.service';
import { FarmTransferService } from './services/farm-transfer.service';
import { AnimalTraceService } from './services/animal-trace.service';

export * from './services/traceability-shapes';

@Injectable()
export class TraceabilityService {
  constructor(
    private readonly dailyActivityService: DailyActivityService,
    private readonly farmTransferService: FarmTransferService,
    private readonly animalTraceService: AnimalTraceService,
  ) {}

  // ─── Farm & Animals Helpers ──────────────────────────────────────────────────

  async getActiveFarms(userId: string) {
    return this.animalTraceService.getActiveFarms(userId);
  }

  async getEligibleAnimals(userId: string, farmId?: string) {
    return this.animalTraceService.getEligibleAnimals(userId, farmId);
  }

  // ─── Overview Stats ──────────────────────────────────────────────────────────

  async getTraceabilityOverview(
    userId: string,
    farmId?: string,
    date?: string,
  ) {
    return this.animalTraceService.getTraceabilityOverview(
      userId,
      farmId,
      date,
    );
  }

  // ─── Daily Activities ────────────────────────────────────────────────────────

  async getDailyActivities(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      farmId?: string;
      animalId?: string;
      activityType?: DailyActivityType | 'ALL';
      session?: ActivitySession | 'ALL';
      status?: ActivityStatus | 'ALL';
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    return this.dailyActivityService.getDailyActivities(userId, filters);
  }

  async createDailyActivity(userId: string, dto: CreateDailyActivityDto) {
    return this.dailyActivityService.createDailyActivity(userId, dto);
  }

  async deleteDailyActivity(userId: string, id: string) {
    return this.dailyActivityService.deleteDailyActivity(userId, id);
  }

  // ─── Farm Transfers ──────────────────────────────────────────────────────────

  async getFarmTransfers(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      fromFarmId?: string;
      toFarmId?: string;
      animalId?: string;
      status?: FarmTransferStatus | 'ALL';
      reason?: FarmTransferReason | 'ALL';
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    return this.farmTransferService.getFarmTransfers(userId, filters);
  }

  async createFarmTransfer(userId: string, dto: CreateFarmTransferDto) {
    return this.farmTransferService.createFarmTransfer(userId, dto);
  }

  async markInTransit(userId: string, id: string) {
    return this.farmTransferService.markInTransit(userId, id);
  }

  async confirmArrival(userId: string, id: string, dto: ConfirmArrivalDto) {
    return this.farmTransferService.confirmArrival(userId, id, dto);
  }

  async completeTransfer(userId: string, id: string) {
    return this.farmTransferService.completeTransfer(userId, id);
  }

  async cancelTransfer(userId: string, id: string, dto: CancelTransferDto) {
    return this.farmTransferService.cancelTransfer(userId, id, dto);
  }

  // ─── Lifetime Trace ──────────────────────────────────────────────────────────

  async getAnimalLifetimeTrace(
    userId: string,
    animalId: string,
    filters: {
      category?: string;
      startDate?: string;
      endDate?: string;
      sortOrder?: 'newest' | 'oldest';
    } = {},
  ) {
    return this.animalTraceService.getAnimalLifetimeTrace(
      userId,
      animalId,
      filters,
    );
  }
}
