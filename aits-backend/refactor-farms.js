const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/farms');
const servicePath = path.join(basePath, 'farms.service.ts');
const sourceCode = fs.readFileSync(servicePath, 'utf8');
const lines = sourceCode.split('\n');

function getBlock(startLineMatch, endLineMatchOrNextStart) {
  const startIdx = lines.findIndex(l => l.includes(startLineMatch));
  if (startIdx === -1) throw new Error(`Could not find ${startLineMatch}`);
  
  let endIdx = -1;
  if (typeof endLineMatchOrNextStart === 'number') {
    endIdx = endLineMatchOrNextStart;
  } else if (endLineMatchOrNextStart) {
     const nextStartIdx = lines.findIndex((l, i) => i > startIdx && l.includes(endLineMatchOrNextStart));
     if (nextStartIdx !== -1) {
       // Search backwards for the closing brace of the previous method
       for (let i = nextStartIdx - 1; i > startIdx; i--) {
         if (lines[i].trim() === '}') {
           endIdx = i;
           break;
         }
       }
     }
  }
  
  if (endIdx === -1) {
     // If it's the last method, find the last brace before the class ends
     for(let i = lines.length - 1; i >= 0; i--) {
        if(lines[i].trim() === '}') {
           // Skip the class closing brace
           for(let j = i - 1; j > startIdx; j--) {
              if (lines[j].trim() === '}') {
                 endIdx = j;
                 break;
              }
           }
           break;
        }
     }
  }

  return lines.slice(startIdx, endIdx + 1).join('\n');
}

// 1. Types
const typesCode = `import { FarmUserRole, FarmUserStatus } from '@prisma/client';\n\n` + 
  lines.slice(32, 72).join('\n'); // Lines 33 to 72

// 2. Utils
const utilsCode = `import { Prisma, FarmUserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { AuditContext } from '../types/farms.types';
import { PrismaService } from '../../database/prisma.service';

const logger = new Logger('FarmsUtils');

/**
 * Helper: Record an immutable audit log entry
 */
export async function createAuditRecord(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null,
  auditContext?: AuditContext,
): Promise<void> {
  try {
    await tx.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValues: oldValues ? (oldValues as Prisma.InputJsonValue) : Prisma.JsonNull,
        newValues: newValues ? (newValues as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: auditContext?.ipAddress || null,
        userAgent: auditContext?.userAgent || null,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(\`Failed to create audit log for \${action}: \${msg}\`);
  }
}

${getBlock('async verifyFarmAccess(', 'async getMyFarm(')}
`;

const commonImports = `import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  Farm,
  FarmStatus,
  FarmUser,
  FarmUserRole,
  FarmUserStatus,
  Prisma,
  RoleName,
  UserStatus,
} from '@prisma/client';
import {
  SanitizedEmployeeUser,
  SanitizedFarmEmployee,
  PaginatedResult,
  AuditContext,
} from '../types/farms.types';
import { createAuditRecord, verifyFarmAccess } from '../utils/farms.utils';\n`;

// 3. Query Service
const queryService = `${commonImports}import { FarmQueryDto } from '../dto';

@Injectable()
export class FarmsQueryService {
  private readonly logger = new Logger(FarmsQueryService.name);
  constructor(private readonly prisma: PrismaService) {}

${getBlock('async getMyFarm(', 'async searchAllFarms(')}
${getBlock('async searchAllFarms(', 'async getFarms(')}
${getBlock('async getFarms(', 'async getFarmById(')}
${getBlock('async getFarmById(', 'async createFarm(')}
${getBlock('async getFarmStats(', 'async uploadEmployeePhoto(')}
}
`;

// 4. CRUD Service
const crudService = `${commonImports}import { CreateFarmDto, UpdateFarmDto } from '../dto';

@Injectable()
export class FarmsCrudService {
  private readonly logger = new Logger(FarmsCrudService.name);
  constructor(private readonly prisma: PrismaService) {}

${getBlock('async createFarm(', 'async updateFarm(')}
${getBlock('async updateFarm(', 'async deactivateFarm(')}
${getBlock('async deactivateFarm(', 'async getFarmEmployees(')}
}
`;

// 5. Employees Service
const employeesService = `${commonImports}
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import * as bcrypt from 'bcrypt';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto,
  TransferOwnershipDto,
} from '../dto';

@Injectable()
export class FarmsEmployeesService {
  private readonly logger = new Logger(FarmsEmployeesService.name);
  constructor(
    private readonly prisma: PrismaService,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

${getBlock('async getFarmEmployees(', 'async createFarmEmployee(')}
${getBlock('async createFarmEmployee(', 'async updateFarmEmployee(')}
${getBlock('async updateFarmEmployee(', 'async resetEmployeePassword(')}
${getBlock('async resetEmployeePassword(', 'async removeFarmEmployee(')}
${getBlock('async removeFarmEmployee(', 'async transferFarmOwnership(')}
${getBlock('async transferFarmOwnership(', 'async getFarmStats(')}
${getBlock('async uploadEmployeePhoto(', null)}
}
`;

// 6. Index (Services Barrel)
const servicesIndex = `export { FarmsQueryService } from './farms-query.service';
export { FarmsCrudService } from './farms-crud.service';
export { FarmsEmployeesService } from './farms-employees.service';
`;

// 7. Facade
const facadeCode = `import { Injectable } from '@nestjs/common';
import { FarmsQueryService, FarmsCrudService, FarmsEmployeesService } from './services';
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
import { Farm, FarmUserRole } from '@prisma/client';

@Injectable()
export class FarmsService {
  constructor(
    private readonly queryService: FarmsQueryService,
    private readonly crudService: FarmsCrudService,
    private readonly employeesService: FarmsEmployeesService,
  ) {}

  // ─── Query ───
  async getMyFarm(userId: string) { return this.queryService.getMyFarm(userId); }
  async searchAllFarms(searchQuery?: string): Promise<Partial<Farm>[]> { return this.queryService.searchAllFarms(searchQuery); }
  async getFarms(userId: string, query: FarmQueryDto) { return this.queryService.getFarms(userId, query); }
  async getFarmById(userId: string, farmId: string) { return this.queryService.getFarmById(userId, farmId); }
  async getFarmStats(userId: string, farmId: string) { return this.queryService.getFarmStats(userId, farmId); }

  // ─── CRUD ───
  async createFarm(userId: string, dto: CreateFarmDto, auditContext?: AuditContext) { return this.crudService.createFarm(userId, dto, auditContext); }
  async updateFarm(userId: string, id: string, dto: UpdateFarmDto, auditContext?: AuditContext) { return this.crudService.updateFarm(userId, id, dto, auditContext); }
  async deactivateFarm(userId: string, id: string, auditContext?: AuditContext) { return this.crudService.deactivateFarm(userId, id, auditContext); }

  // ─── Employees ───
  async getFarmEmployees(userId: string, farmId: string, query: EmployeeQueryDto): Promise<PaginatedResult<SanitizedFarmEmployee>> { return this.employeesService.getFarmEmployees(userId, farmId, query); }
  async createFarmEmployee(userId: string, farmId: string, dto: CreateEmployeeDto, auditContext?: AuditContext) { return this.employeesService.createFarmEmployee(userId, farmId, dto, auditContext); }
  async updateFarmEmployee(userId: string, farmId: string, employeeId: string, dto: UpdateEmployeeDto, auditContext?: AuditContext) { return this.employeesService.updateFarmEmployee(userId, farmId, employeeId, dto, auditContext); }
  async resetEmployeePassword(userId: string, farmId: string, employeeId: string, auditContext?: AuditContext) { return this.employeesService.resetEmployeePassword(userId, farmId, employeeId, auditContext); }
  async removeFarmEmployee(userId: string, farmId: string, employeeId: string, auditContext?: AuditContext) { return this.employeesService.removeFarmEmployee(userId, farmId, employeeId, auditContext); }
  async transferFarmOwnership(userId: string, farmId: string, dto: TransferOwnershipDto, auditContext?: AuditContext) { return this.employeesService.transferFarmOwnership(userId, farmId, dto, auditContext); }
  async uploadEmployeePhoto(file?: Express.Multer.File) { return this.employeesService.uploadEmployeePhoto(file); }
}
`;

fs.mkdirSync(path.join(basePath, 'types'), { recursive: true });
fs.mkdirSync(path.join(basePath, 'utils'), { recursive: true });
fs.mkdirSync(path.join(basePath, 'services'), { recursive: true });

fs.writeFileSync(path.join(basePath, 'types/farms.types.ts'), typesCode);
fs.writeFileSync(path.join(basePath, 'utils/farms.utils.ts'), utilsCode);
fs.writeFileSync(path.join(basePath, 'services/farms-query.service.ts'), queryService);
fs.writeFileSync(path.join(basePath, 'services/farms-crud.service.ts'), crudService);
fs.writeFileSync(path.join(basePath, 'services/farms-employees.service.ts'), employeesService);
fs.writeFileSync(path.join(basePath, 'services/index.ts'), servicesIndex);
fs.writeFileSync(path.join(basePath, 'farms.service.ts'), facadeCode);

console.log("Farms refactoring script completed successfully.");
