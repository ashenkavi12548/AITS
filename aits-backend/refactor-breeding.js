const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/breeding');
const servicePath = path.join(basePath, 'breeding.service.ts');
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

  return lines.slice(startIdx, endIdx + 1).join('\n');
}

// 1. Types
const typesCode = lines.slice(29, 145).join('\n'); 

// 2. Utils
const utilsCodeRaw = getBlock('private async resolveAnimal(', 'async getBreedingRecords(');
let utilsCode = `import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveAnimal(prisma: PrismaService, animalIdOrTag: string, targetFarmId?: string) {
${utilsCodeRaw.substring(utilsCodeRaw.indexOf('{') + 1).replace(/this\.prisma/g, 'prisma').replace(/BreedingService\.UUID_REGEX/g, 'UUID_REGEX')}
`;

const commonImports = `import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { AnimalBusinessRulesService } from '../../common/business-rules/animal-business-rules.service';
import {
  Prisma,
  BreedingMethod,
  BreedingStatus,
  PregnancyStatus,
} from '@prisma/client';
import {
  CreateBreedingDto,
  UpdateBreedingDto,
  BreedingQueryDto,
  CreatePregnancyCheckDto,
  PregnancyQueryDto,
  CreateCalvingDto,
  CalvingQueryDto,
  BreedingMethodInput,
  BreedingStatusInput,
  PregnancyStatusInput,
} from '../dto';
import { NotesMetadata, FormattedBreedingRecord, FormattedPregnancyCheck, FormattedCalvingRecord } from '../types/breeding.types';
import { resolveAnimal } from '../utils/breeding.utils';\n`;

const classPrefix = (name) => `@Injectable()
export class ${name} {
  private readonly logger = new Logger(${name}.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
  ) {}

`;

const commonClassClose = `}\n`;

const prepareBlock = (code) => {
  let c = code.replace(/this\.resolveAnimal\(/g, 'resolveAnimal(this.prisma, ');
  return c;
}

// 3. Records Service
const recordsService = `${commonImports}${classPrefix('BreedingRecordsService')}
${prepareBlock(getBlock('async getBreedingRecords(', 'async getBreedingRecordById('))}
${prepareBlock(getBlock('async getBreedingRecordById(', 'async createBreedingRecord('))}
${prepareBlock(getBlock('async createBreedingRecord(', 'async updateBreedingRecord('))}
${prepareBlock(getBlock('async updateBreedingRecord(', 'async deleteBreedingRecord('))}
${prepareBlock(getBlock('async deleteBreedingRecord(', 'async getBreedingSummary('))}
${commonClassClose}`;

// 4. Query Service
const queryService = `${commonImports}${classPrefix('BreedingQueryService')}
${prepareBlock(getBlock('async getBreedingSummary(', 'async getUpcomingActivities('))}
${prepareBlock(getBlock('async getUpcomingActivities(', 'async getAnalyticsData('))}
${prepareBlock(getBlock('async getAnalyticsData(', 'async getEligibleFemaleAnimals('))}
${prepareBlock(getBlock('async getEligibleFemaleAnimals(', 'async getAvailableBulls('))}
${prepareBlock(getBlock('async getAvailableBulls(', 'async getPregnancySummary('))}
  getSemenInventory() {
    return []; // Placeholder logic from original service
  }
${commonClassClose}`;

// 5. Pregnancy Service
const pregnancyService = `${commonImports}${classPrefix('PregnancyService')}
${prepareBlock(getBlock('async getPregnancySummary(', 'async getPregnancyChecks('))}
${prepareBlock(getBlock('async getPregnancyChecks(', 'async createPregnancyCheck('))}
${prepareBlock(getBlock('async createPregnancyCheck(', 'async getCalvingSummary('))}
${commonClassClose}`;

// 6. Calving Service
const calvingService = `${commonImports}${classPrefix('CalvingService')}
${prepareBlock(getBlock('async getCalvingSummary(', 'async getCalvingRecords('))}
${prepareBlock(getBlock('async getCalvingRecords(', 'async createCalvingRecord('))}
${prepareBlock(getBlock('async createCalvingRecord(', null))}
${commonClassClose}`;

// 7. Index
const servicesIndex = `export { BreedingRecordsService } from './breeding-records.service';
export { BreedingQueryService } from './breeding-query.service';
export { PregnancyService } from './breeding-pregnancy.service';
export { CalvingService } from './breeding-calving.service';
`;

// 8. Facade
const facadeCode = `import { Injectable } from '@nestjs/common';
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
  async getBreedingSummary(userId: string, farmId?: string) { return this.queryService.getBreedingSummary(userId, farmId); }
  async getUpcomingActivities(userId: string) { return this.queryService.getUpcomingActivities(userId); }
  async getAnalyticsData(userId: string) { return this.queryService.getAnalyticsData(userId); }
  async getEligibleFemaleAnimals(userId: string, farmId?: string) { return this.queryService.getEligibleFemaleAnimals(userId, farmId); }
  async getAvailableBulls(userId: string, farmId?: string) { return this.queryService.getAvailableBulls(userId, farmId); }
  getSemenInventory() { return this.queryService.getSemenInventory(); }

  // ─── Records ───
  async getBreedingRecords(userId: string, query: BreedingQueryDto) { return this.recordsService.getBreedingRecords(userId, query); }
  async getBreedingRecordById(userId: string, id: string) { return this.recordsService.getBreedingRecordById(userId, id); }
  async createBreedingRecord(userId: string, dto: CreateBreedingDto) { return this.recordsService.createBreedingRecord(userId, dto); }
  async updateBreedingRecord(userId: string, id: string, dto: UpdateBreedingDto) { return this.recordsService.updateBreedingRecord(userId, id, dto); }
  async deleteBreedingRecord(userId: string, id: string) { return this.recordsService.deleteBreedingRecord(userId, id); }

  // ─── Pregnancy ───
  async getPregnancySummary(userId: string, farmId?: string) { return this.pregnancyService.getPregnancySummary(userId, farmId); }
  async getPregnancyChecks(userId: string, query: PregnancyQueryDto) { return this.pregnancyService.getPregnancyChecks(userId, query); }
  async createPregnancyCheck(userId: string, dto: CreatePregnancyCheckDto) { return this.pregnancyService.createPregnancyCheck(userId, dto); }

  // ─── Calving ───
  async getCalvingSummary(userId: string, farmId?: string) { return this.calvingService.getCalvingSummary(userId, farmId); }
  async getCalvingRecords(userId: string, query: CalvingQueryDto) { return this.calvingService.getCalvingRecords(userId, query); }
  async createCalvingRecord(userId: string, dto: CreateCalvingDto) { return this.calvingService.createCalvingRecord(userId, dto); }
}
`;

fs.mkdirSync(path.join(basePath, 'types'), { recursive: true });
fs.mkdirSync(path.join(basePath, 'utils'), { recursive: true });
fs.mkdirSync(path.join(basePath, 'services'), { recursive: true });

fs.writeFileSync(path.join(basePath, 'types/breeding.types.ts'), typesCode);
fs.writeFileSync(path.join(basePath, 'utils/breeding.utils.ts'), utilsCode);
fs.writeFileSync(path.join(basePath, 'services/breeding-records.service.ts'), recordsService);
fs.writeFileSync(path.join(basePath, 'services/breeding-query.service.ts'), queryService);
fs.writeFileSync(path.join(basePath, 'services/breeding-pregnancy.service.ts'), pregnancyService);
fs.writeFileSync(path.join(basePath, 'services/breeding-calving.service.ts'), calvingService);
fs.writeFileSync(path.join(basePath, 'services/index.ts'), servicesIndex);
fs.writeFileSync(path.join(basePath, 'breeding.service.ts'), facadeCode);

console.log("Breeding refactoring script completed successfully.");
