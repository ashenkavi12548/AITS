import { Injectable } from '@nestjs/common';
import {
  AnimalsQueryService,
  AnimalsCrudService,
  AnimalsIdentifiersService,
} from './services';
import {
  AnimalQueryDto,
  CreateAnimalDto,
  UpdateAnimalDto,
  CreateIdentifierDto,
  ReplaceQrDto,
  DeactivateQrDto,
  UpdateAnimalStatusDto,
} from './dto';
import { AuditContext } from './types/animals.types';

@Injectable()
export class AnimalsService {
  constructor(
    private readonly queryService: AnimalsQueryService,
    private readonly crudService: AnimalsCrudService,
    private readonly identifiersService: AnimalsIdentifiersService,
  ) {}

  // ─── Query ───
  async findAll(query: AnimalQueryDto, userId?: string) {
    return this.queryService.findAll(query, userId);
  }
  async getHerdStats(userId?: string, farmId?: string) {
    return this.queryService.getHerdStats(userId, farmId);
  }
  async findOne(id: string, userId?: string) {
    return this.queryService.findOne(id, userId);
  }
  async getAnimalHistory(id: string, userId?: string) {
    return this.queryService.getAnimalHistory(id, userId);
  }

  // ─── CRUD ───
  async createAnimal(
    dto: CreateAnimalDto,
    userId: string,
    auditContext?: AuditContext,
  ) {
    return this.crudService.createAnimal(dto, userId, auditContext);
  }
  async updateAnimal(
    id: string,
    dto: UpdateAnimalDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    return this.crudService.updateAnimal(id, dto, userId, auditContext);
  }
  async updateAnimalStatus(
    id: string,
    dto: UpdateAnimalStatusDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    return this.crudService.updateAnimalStatus(id, dto, userId, auditContext);
  }
  async deleteAnimal(id: string, userId?: string, auditContext?: AuditContext) {
    return this.crudService.deleteAnimal(id, userId, auditContext);
  }
  async exportAnimalsCsv(query: AnimalQueryDto, userId?: string) {
    return this.crudService.exportAnimalsCsv(query, userId);
  }

  // ─── Identifiers ───
  async getAnimalIdentifiers(id: string, userId?: string) {
    return this.identifiersService.getAnimalIdentifiers(id, userId);
  }
  async addIdentifier(
    id: string,
    dto: CreateIdentifierDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    return this.identifiersService.addIdentifier(id, dto, userId, auditContext);
  }
  async getAnimalQr(id: string, userId?: string) {
    return this.identifiersService.getAnimalQr(id, userId);
  }
  async replaceQrCode(
    id: string,
    dto: ReplaceQrDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    return this.identifiersService.replaceQrCode(id, dto, userId, auditContext);
  }
  async deactivateQrCode(
    id: string,
    qrId: string,
    dto: DeactivateQrDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    return this.identifiersService.deactivateQrCode(
      id,
      qrId,
      dto,
      userId,
      auditContext,
    );
  }
  async uploadAnimalPhoto(fileOrBase64: unknown) {
    return this.identifiersService.uploadAnimalPhoto(fileOrBase64);
  }
}
