import { Injectable } from '@nestjs/common';
import {
  CreateMilkProductionDto,
  UpdateMilkProductionDto,
  MilkProductionQueryDto,
} from './dto';
import { FormattedMilkRecord } from './types/milk-production.types';
import { MilkProductionQueryService } from './services/milk-production-query.service';
import { MilkProductionStatsService } from './services/milk-production-stats.service';
import { MilkProductionCrudService } from './services/milk-production-crud.service';

/**
 * Facade service that delegates to focused sub-services.
 *
 * Sub-services:
 *  - MilkProductionQueryService  → getRecords, getRecordById, getFarms, getAnimals
 *  - MilkProductionStatsService  → getSummaryStats, getAnalyticsData
 *  - MilkProductionCrudService   → createRecord, updateRecord, voidRecord, deleteRecord, deleteRecordPermanent
 */
@Injectable()
export class MilkProductionService {
  constructor(
    private readonly queryService: MilkProductionQueryService,
    private readonly statsService: MilkProductionStatsService,
    private readonly crudService: MilkProductionCrudService,
  ) {}

  // ─── Query Operations ──────────────────────────────────────────────────

  async getRecords(userId: string, query: MilkProductionQueryDto) {
    return this.queryService.getRecords(userId, query);
  }

  async getRecordById(
    userId: string,
    id: string,
  ): Promise<FormattedMilkRecord> {
    return this.queryService.getRecordById(userId, id);
  }

  async getFarms(userId: string) {
    return this.queryService.getFarms(userId);
  }

  async getAnimals(userId: string, targetFarmId?: string) {
    return this.queryService.getAnimals(userId, targetFarmId);
  }

  // ─── Stats & Analytics ─────────────────────────────────────────────────

  async getSummaryStats(userId: string, targetFarmId?: string) {
    return this.statsService.getSummaryStats(userId, targetFarmId);
  }

  async getAnalyticsData(userId: string, targetFarmId?: string) {
    return this.statsService.getAnalyticsData(userId, targetFarmId);
  }

  // ─── CRUD Operations ──────────────────────────────────────────────────

  async createRecord(
    userId: string,
    dto: CreateMilkProductionDto,
  ): Promise<FormattedMilkRecord> {
    return this.crudService.createRecord(userId, dto);
  }

  async updateRecord(
    userId: string,
    id: string,
    dto: UpdateMilkProductionDto,
  ): Promise<FormattedMilkRecord> {
    return this.crudService.updateRecord(userId, id, dto);
  }

  async voidRecord(
    userId: string,
    id: string,
    reason: string,
  ): Promise<{
    success: boolean;
    message: string;
    record: FormattedMilkRecord;
  }> {
    return this.crudService.voidRecord(userId, id, reason);
  }

  async deleteRecord(
    userId: string,
    id: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.crudService.deleteRecord(userId, id, reason);
  }

  async deleteRecordPermanent(
    userId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.crudService.deleteRecordPermanent(userId, id);
  }
}
