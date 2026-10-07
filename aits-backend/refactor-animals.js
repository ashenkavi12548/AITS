const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/animals');
const servicePath = path.join(basePath, 'animals.service.ts');
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
       for (let i = nextStartIdx - 1; i > startIdx; i--) {
         if (lines[i].trim() === '}') {
           endIdx = i;
           break;
         }
       }
     }
  }
  
  if (endIdx === -1) {
     for(let i = lines.length - 1; i >= 0; i--) {
        if(lines[i].trim() === '}') {
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

  let code = lines.slice(startIdx, endIdx + 1).join('\n');
  code = code.replace(/this\.verifyAnimalAccess\(/g, 'verifyAnimalAccess(this.prisma, ');
  code = code.replace(/this\.createAuditRecord\(/g, 'createAuditRecord(');
  return code;
}

// 1. Types
const typesCode = lines.slice(34, 43).join('\n'); 

// 2. Utils
const utilsCodeRaw = getBlock('private async verifyAnimalAccess(', 'private async createAuditRecord(') + '\n' + getBlock('private async createAuditRecord(', 'async findAll(');
let utilsCode = `import { Prisma, Animal } from '@prisma/client';
import { NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { AuditContext } from '../types/animals.types';
import { PrismaService } from '../../database/prisma.service';

const logger = new Logger('AnimalsUtils');

${utilsCodeRaw}
`;
utilsCode = utilsCode.replace(/private async verifyAnimalAccess\(/g, 'export async function verifyAnimalAccess(prisma: PrismaService, ');
utilsCode = utilsCode.replace(/private async createAuditRecord\(/g, 'export async function createAuditRecord(');
utilsCode = utilsCode.replace(/this\.prisma/g, 'prisma');
utilsCode = utilsCode.replace(/this\.logger/g, 'logger');

const commonImports = `import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Animal, AnimalStatus, Prisma } from '@prisma/client';
import { AuditContext, PaginatedResult } from '../types/animals.types';
import { createAuditRecord, verifyAnimalAccess } from '../utils/animals.utils';\n`;

// 3. Query Service
const queryService = `${commonImports}import { AnimalQueryDto } from '../dto';

@Injectable()
export class AnimalsQueryService {
  private readonly logger = new Logger(AnimalsQueryService.name);
  constructor(private readonly prisma: PrismaService) {}

${getBlock('async findAll(', 'async getHerdStats(')}
${getBlock('async getHerdStats(', 'async exportAnimalsCsv(')}
${getBlock('async findOne(', 'async createAnimal(')}
${getBlock('async getAnimalHistory(', 'async uploadAnimalPhoto(')}
}
`;

// 4. CRUD Service
const crudService = `${commonImports}import { CreateAnimalDto, UpdateAnimalDto } from '../dto';

@Injectable()
export class AnimalsCrudService {
  private readonly logger = new Logger(AnimalsCrudService.name);
  constructor(private readonly prisma: PrismaService) {}

${getBlock('async createAnimal(', 'async updateAnimal(')}
${getBlock('async updateAnimal(', 'async updateAnimalStatus(')}
${getBlock('async updateAnimalStatus(', 'async getAnimalIdentifiers(')}
${getBlock('async deleteAnimal(', null)}
${getBlock('async exportAnimalsCsv(', 'async findOne(')}
}
`;

// 5. Identifiers Service
const identifiersService = `${commonImports}import { AddIdentifierDto, ReplaceQrCodeDto } from '../dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import * as QRCode from 'qrcode';

@Injectable()
export class AnimalsIdentifiersService {
  private readonly logger = new Logger(AnimalsIdentifiersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

${getBlock('async getAnimalIdentifiers(', 'async addIdentifier(')}
${getBlock('async addIdentifier(', 'async getAnimalQr(')}
${getBlock('async getAnimalQr(', 'async replaceQrCode(')}
${getBlock('async replaceQrCode(', 'async deactivateQrCode(')}
${getBlock('async deactivateQrCode(', 'async getAnimalHistory(')}
${getBlock('async uploadAnimalPhoto(', 'async deleteAnimal(')}
}
`;

// 6. Index (Services Barrel)
const servicesIndex = `export { AnimalsQueryService } from './animals-query.service';
export { AnimalsCrudService } from './animals-crud.service';
export { AnimalsIdentifiersService } from './animals-identifiers.service';
`;

// 7. Facade
const facadeCode = `import { Injectable } from '@nestjs/common';
import { AnimalsQueryService, AnimalsCrudService, AnimalsIdentifiersService } from './services';
import {
  AnimalQueryDto,
  CreateAnimalDto,
  UpdateAnimalDto,
  AddIdentifierDto,
  ReplaceQrCodeDto,
} from './dto';
import { AuditContext, PaginatedResult } from './types/animals.types';
import { Animal } from '@prisma/client';

@Injectable()
export class AnimalsService {
  constructor(
    private readonly queryService: AnimalsQueryService,
    private readonly crudService: AnimalsCrudService,
    private readonly identifiersService: AnimalsIdentifiersService,
  ) {}

  // ─── Query ───
  async findAll(userId: string | undefined, query: AnimalQueryDto) { return this.queryService.findAll(userId, query); }
  async getHerdStats(userId?: string, farmId?: string) { return this.queryService.getHerdStats(userId, farmId); }
  async findOne(id: string, userId?: string) { return this.queryService.findOne(id, userId); }
  async getAnimalHistory(id: string, userId?: string) { return this.queryService.getAnimalHistory(id, userId); }

  // ─── CRUD ───
  async createAnimal(userId: string, dto: CreateAnimalDto, auditContext?: AuditContext) { return this.crudService.createAnimal(userId, dto, auditContext); }
  async updateAnimal(id: string, dto: UpdateAnimalDto, userId?: string, auditContext?: AuditContext) { return this.crudService.updateAnimal(id, dto, userId, auditContext); }
  async updateAnimalStatus(id: string, status: any, userId?: string, auditContext?: AuditContext) { return this.crudService.updateAnimalStatus(id, status, userId, auditContext); }
  async deleteAnimal(id: string, userId?: string, auditContext?: AuditContext) { return this.crudService.deleteAnimal(id, userId, auditContext); }
  async exportAnimalsCsv(userId: string | undefined, query: AnimalQueryDto) { return this.crudService.exportAnimalsCsv(userId, query); }

  // ─── Identifiers ───
  async getAnimalIdentifiers(id: string, userId?: string) { return this.identifiersService.getAnimalIdentifiers(id, userId); }
  async addIdentifier(id: string, dto: AddIdentifierDto, userId?: string, auditContext?: AuditContext) { return this.identifiersService.addIdentifier(id, dto, userId, auditContext); }
  async getAnimalQr(id: string, userId?: string) { return this.identifiersService.getAnimalQr(id, userId); }
  async replaceQrCode(id: string, dto: ReplaceQrCodeDto, userId?: string, auditContext?: AuditContext) { return this.identifiersService.replaceQrCode(id, dto, userId, auditContext); }
  async deactivateQrCode(id: string, userId?: string, auditContext?: AuditContext) { return this.identifiersService.deactivateQrCode(id, userId, auditContext); }
  async uploadAnimalPhoto(fileOrBase64: unknown) { return this.identifiersService.uploadAnimalPhoto(fileOrBase64); }
}
`;

fs.mkdirSync(path.join(basePath, 'types'), { recursive: true });
fs.mkdirSync(path.join(basePath, 'utils'), { recursive: true });
fs.mkdirSync(path.join(basePath, 'services'), { recursive: true });

fs.writeFileSync(path.join(basePath, 'types/animals.types.ts'), typesCode);
fs.writeFileSync(path.join(basePath, 'utils/animals.utils.ts'), utilsCode);
fs.writeFileSync(path.join(basePath, 'services/animals-query.service.ts'), queryService);
fs.writeFileSync(path.join(basePath, 'services/animals-crud.service.ts'), crudService);
fs.writeFileSync(path.join(basePath, 'services/animals-identifiers.service.ts'), identifiersService);
fs.writeFileSync(path.join(basePath, 'services/index.ts'), servicesIndex);
fs.writeFileSync(path.join(basePath, 'animals.service.ts'), facadeCode);

console.log("Animals refactoring script completed successfully.");
