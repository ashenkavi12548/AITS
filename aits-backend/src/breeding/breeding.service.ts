import { Injectable } from '@nestjs/common';
import {
  CreateBreedingDto,
  UpdateBreedingDto,
  BreedingQueryDto,
  CreatePregnancyCheckDto,
  PregnancyQueryDto,
  CreateCalvingDto,
  CalvingQueryDto,
} from './dto';
import {
  BreedingRecordsService,
  BreedingQueryService,
  PregnancyService,
  CalvingService,
} from './services';

@Injectable()
export class BreedingService {
  constructor(
    private readonly recordsService: BreedingRecordsService,
    private readonly queryService: BreedingQueryService,
    private readonly pregnancyService: PregnancyService,
    private readonly calvingService: CalvingService,
  ) {}

  // ─── Query / Analytics ───
  async getBreedingSummary(userId: string, farmId?: string) {
    return this.queryService.getBreedingSummary(userId, farmId);
  }
  async getUpcomingActivities(userId: string) {
    return this.queryService.getUpcomingActivities(userId);
  }
  async getAnalyticsData(userId: string) {
    return this.queryService.getAnalyticsData(userId);
  }
  async getEligibleFemaleAnimals(userId: string, farmId?: string) {
    return this.queryService.getEligibleFemaleAnimals(userId, farmId);
  }
  async getAvailableBulls(userId: string, farmId?: string) {
    return this.queryService.getAvailableBulls(userId, farmId);
  }
  getSemenInventory() {
    return this.queryService.getSemenInventory();
  }

  // ─── Records ───
  async getBreedingRecords(userId: string, query: BreedingQueryDto) {
    return this.recordsService.getBreedingRecords(userId, query);
  }
  async getBreedingRecordById(userId: string, id: string) {
    return this.recordsService.getBreedingRecordById(userId, id);
  }
  async createBreedingRecord(userId: string, dto: CreateBreedingDto) {
    return this.recordsService.createBreedingRecord(userId, dto);
  }
  async updateBreedingRecord(
    userId: string,
    id: string,
    dto: UpdateBreedingDto,
  ) {
    return this.recordsService.updateBreedingRecord(userId, id, dto);
  }
  async deleteBreedingRecord(userId: string, id: string) {
    return this.recordsService.deleteBreedingRecord(userId, id);
  }

  // ─── Pregnancy ───
  async getPregnancySummary(userId: string, farmId?: string) {
    return this.pregnancyService.getPregnancySummary(userId, farmId);
  }
  async getPregnancyChecks(userId: string, query: PregnancyQueryDto) {
    return this.pregnancyService.getPregnancyChecks(userId, query);
  }
  async createPregnancyCheck(userId: string, dto: CreatePregnancyCheckDto) {
    return this.pregnancyService.createPregnancyCheck(userId, dto);
  }

  // ─── Calving ───
  async getCalvingSummary(userId: string, farmId?: string) {
    return this.calvingService.getCalvingSummary(userId, farmId);
  }
  async getCalvingRecords(userId: string, query: CalvingQueryDto) {
    return this.calvingService.getCalvingRecords(userId, query);
  }
  async createCalvingRecord(userId: string, dto: CreateCalvingDto) {
    return this.calvingService.createCalvingRecord(userId, dto);
  }
}
