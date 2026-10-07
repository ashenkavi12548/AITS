import { Injectable } from '@nestjs/common';
import {
  FarmsQueryService,
  FarmsCrudService,
  FarmsEmployeesService,
} from './services';
import {
  CreateFarmDto,
  UpdateFarmDto,
  FarmQueryDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto,
  TransferOwnershipDto,
} from './dto';
import {
  SanitizedFarmEmployee,
  PaginatedResult,
  AuditContext,
} from './types/farms.types';
import { Farm } from '@prisma/client';

@Injectable()
export class FarmsService {
  constructor(
    private readonly queryService: FarmsQueryService,
    private readonly crudService: FarmsCrudService,
    private readonly employeesService: FarmsEmployeesService,
  ) {}

  // ─── Query ───
  async getMyFarm(userId: string) {
    return this.queryService.getMyFarm(userId);
  }
  async searchAllFarms(searchQuery?: string): Promise<Partial<Farm>[]> {
    return this.queryService.searchAllFarms(searchQuery);
  }
  async getFarms(userId: string, query: FarmQueryDto) {
    return this.queryService.getFarms(userId, query);
  }
  async getFarmById(userId: string, farmId: string) {
    return this.queryService.getFarmById(userId, farmId);
  }
  async getFarmStats(userId: string, farmId: string) {
    return this.queryService.getFarmStats(userId, farmId);
  }

  // ─── CRUD ───
  async createFarm(
    userId: string,
    dto: CreateFarmDto,
    auditContext?: AuditContext,
  ) {
    return this.crudService.createFarm(userId, dto, auditContext);
  }
  async updateFarm(
    userId: string,
    id: string,
    dto: UpdateFarmDto,
    auditContext?: AuditContext,
  ) {
    return this.crudService.updateFarm(userId, id, dto, auditContext);
  }
  async deactivateFarm(
    userId: string,
    id: string,
    auditContext?: AuditContext,
  ) {
    return this.crudService.deactivateFarm(userId, id, auditContext);
  }

  // ─── Employees ───
  async getFarmEmployees(
    userId: string,
    farmId: string,
    query: EmployeeQueryDto,
  ): Promise<PaginatedResult<SanitizedFarmEmployee> | SanitizedFarmEmployee[]> {
    return this.employeesService.getFarmEmployees(userId, farmId, query);
  }
  async createFarmEmployee(
    userId: string,
    farmId: string,
    dto: CreateEmployeeDto,
    auditContext?: AuditContext,
  ) {
    return this.employeesService.createFarmEmployee(
      userId,
      farmId,
      dto,
      auditContext,
    );
  }
  async updateFarmEmployee(
    userId: string,
    farmId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
    auditContext?: AuditContext,
  ) {
    return this.employeesService.updateFarmEmployee(
      userId,
      farmId,
      employeeId,
      dto,
      auditContext,
    );
  }
  async resetEmployeePassword(
    userId: string,
    farmId: string,
    employeeId: string,
    newPassword: string,
    auditContext?: AuditContext,
  ) {
    return this.employeesService.resetEmployeePassword(
      userId,
      farmId,
      employeeId,
      newPassword,
      auditContext,
    );
  }
  async removeFarmEmployee(
    userId: string,
    farmId: string,
    employeeId: string,
    auditContext?: AuditContext,
  ) {
    return this.employeesService.removeFarmEmployee(
      userId,
      farmId,
      employeeId,
      auditContext,
    );
  }
  async transferFarmOwnership(
    userId: string,
    farmId: string,
    dto: TransferOwnershipDto,
    auditContext?: AuditContext,
  ) {
    return this.employeesService.transferFarmOwnership(
      userId,
      farmId,
      dto,
      auditContext,
    );
  }
  async uploadEmployeePhoto(file?: Express.Multer.File) {
    return this.employeesService.uploadEmployeePhoto(file);
  }
}
