import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { AnimalBusinessRulesService } from '../../common/business-rules/animal-business-rules.service';
import { Prisma } from '@prisma/client';
import { CreateCalvingDto, CalvingQueryDto } from '../dto';
import { NotesMetadata, FormattedCalvingRecord } from '../types/breeding.types';
import {
  resolveAnimal,
  parseDateString,
  formatDateString,
  parseNotesMetadata,
} from '../utils/breeding.utils';
@Injectable()
export class CalvingService {
  private readonly logger = new Logger(CalvingService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
  ) {}

  async getCalvingSummary(userId: string, targetFarmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const where: Prisma.CalvingRecordWhereInput = {};
    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return {
          expectedThisWeek: 0,
          expectedThisMonth: 0,
          completedCalvings: 0,
          overdueCalvings: 0,
          complicatedCalvings: 0,
        };
      }
      where.mother = {
        farmId:
          targetFarmId && farmIds.includes(targetFarmId)
            ? targetFarmId
            : { in: farmIds },
      };
    } else if (targetFarmId) {
      where.mother = { farmId: targetFarmId };
    }

    const records = await this.prisma.calvingRecord.findMany({
      where,
      select: { calvingType: true, complications: true, calvingDate: true },
    });

    const complicated = records.filter(
      (c) => c.complications && c.complications.trim() !== '',
    ).length;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const thisWeek = records.filter(
      (c) => c.calvingDate >= weekStart && c.calvingDate <= weekEnd,
    ).length;
    const thisMonth = records.filter(
      (c) => c.calvingDate >= monthStart && c.calvingDate <= monthEnd,
    ).length;

    return {
      expectedThisWeek: thisWeek,
      expectedThisMonth: thisMonth,
      completedCalvings: records.length,
      overdueCalvings: 0,
      complicatedCalvings: complicated,
    };
  }
  async getCalvingRecords(userId: string, query: CalvingQueryDto) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.CalvingRecordWhereInput = {};
    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.mother = {
        farmId:
          query.farmId && farmIds.includes(query.farmId)
            ? query.farmId
            : { in: farmIds },
      };
    } else if (query.farmId) {
      where.mother = { farmId: query.farmId };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { mother: { animalNumber: { contains: term, mode: 'insensitive' } } },
        { mother: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.calvingRecord.count({ where }),
      this.prisma.calvingRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { calvingDate: query.sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          mother: { include: { farm: { select: { id: true, name: true } } } },
          pregnancy: { select: { id: true, expectedCalvingDate: true } },
        },
      }),
    ]);

    const formatted: FormattedCalvingRecord[] = records.map((c) => {
      const { userNotes, meta } = parseNotesMetadata(c.notes);
      return {
        id: c.id,
        pregnancyCheckId: c.pregnancyId || undefined,
        motherAnimalId: c.mother.id,
        motherAnimalTag: c.mother.animalNumber,
        motherAnimalName: c.mother.name || c.mother.animalNumber,
        species: c.mother.species,
        imageUrl: c.mother.imageUrl,
        farmId: c.mother.farmId,
        farmName: c.mother.farm.name,
        expectedCalvingDate: c.pregnancy?.expectedCalvingDate
          ? formatDateString(c.pregnancy.expectedCalvingDate)
          : formatDateString(c.calvingDate),
        actualCalvingDate: formatDateString(c.calvingDate),
        calvingStatus: meta.calvingStatus || 'COMPLETED',
        numberOfCalves: c.calfCount,
        calfGender: meta.calfGender || 'FEMALE',
        calfBirthWeightKg: meta.calfBirthWeightKg || 38.5,
        calfStatus: meta.calfStatus || 'HEALTHY',
        birthDifficulty: meta.birthDifficulty || 'EASY',
        assistanceRequired: Boolean(meta.assistanceRequired),
        complications: c.complications || undefined,
        recordedBy: meta.recordedBy || 'Farm Staff',
        notes: userNotes,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
  async createCalvingRecord(
    userId: string,
    dto: CreateCalvingDto,
  ): Promise<FormattedCalvingRecord> {
    const mother = await resolveAnimal(
      this.prisma,
      dto.motherAnimalId,
      dto.farmId,
    );
    const calvingDateParsed = dto.actualCalvingDate
      ? parseDateString(dto.actualCalvingDate)
      : new Date();

    // Business rules validation
    this.animalBusinessRulesService.validateCalvingEligibility(
      mother,
      calvingDateParsed,
    );

    let pregnancyId = dto.pregnancyCheckId;
    if (!pregnancyId) {
      const activePregnancy = await this.prisma.pregnancy.findFirst({
        where: {
          animalId: mother.id,
          status: 'CONFIRMED',
        },
        orderBy: { pregnancyDate: 'desc' },
      });
      if (activePregnancy) {
        pregnancyId = activePregnancy.id;
      }
    }

    const meta: NotesMetadata = {
      calvingStatus: dto.calvingStatus,
      calfGender: dto.calfGender,
      calfBirthWeightKg: dto.calfBirthWeightKg,
      calfStatus: dto.calfStatus,
      birthDifficulty: dto.birthDifficulty,
      assistanceRequired: dto.assistanceRequired,
      recordedBy: dto.recordedBy,
      notes: dto.notes || '',
    };

    const created = await this.prisma.calvingRecord.create({
      data: {
        motherId: mother.id,
        pregnancyId: pregnancyId || null,
        calvingDate: calvingDateParsed,
        calfCount: dto.numberOfCalves || 1,
        calvingType: dto.birthDifficulty || 'EASY',
        complications: dto.complications || null,
        notes: JSON.stringify(meta),
      },
      include: {
        mother: { include: { farm: { select: { id: true, name: true } } } },
        pregnancy: { select: { id: true, expectedCalvingDate: true } },
      },
    });

    if (pregnancyId) {
      await this.prisma.pregnancy.update({
        where: { id: pregnancyId },
        data: {
          status: 'COMPLETED',
          actualCalvingDate: calvingDateParsed,
        },
      });
    }

    return {
      id: created.id,
      pregnancyCheckId: created.pregnancyId || undefined,
      motherAnimalId: created.mother.id,
      motherAnimalTag: created.mother.animalNumber,
      motherAnimalName: created.mother.name || created.mother.animalNumber,
      species: created.mother.species,
      imageUrl: created.mother.imageUrl,
      farmId: created.mother.farmId,
      farmName: created.mother.farm.name,
      expectedCalvingDate:
        dto.expectedCalvingDate || formatDateString(calvingDateParsed),
      actualCalvingDate: formatDateString(calvingDateParsed),
      calvingStatus: dto.calvingStatus,
      numberOfCalves: dto.numberOfCalves || 1,
      calfGender: dto.calfGender,
      calfBirthWeightKg: dto.calfBirthWeightKg,
      calfStatus: dto.calfStatus,
      birthDifficulty: dto.birthDifficulty,
      assistanceRequired: Boolean(dto.assistanceRequired),
      complications: dto.complications,
      recordedBy: dto.recordedBy || 'Farm Staff',
      notes: dto.notes,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
