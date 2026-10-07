import { Injectable, Logger } from '@nestjs/common';
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
  CreatePregnancyCheckDto,
  PregnancyQueryDto,
  PregnancyStatusInput,
} from '../dto';
import {
  NotesMetadata,
  FormattedPregnancyCheck,
} from '../types/breeding.types';
import {
  resolveAnimal,
  parseDateString,
  formatDateString,
  parseNotesMetadata,
} from '../utils/breeding.utils';
@Injectable()
export class PregnancyService {
  private readonly logger = new Logger(PregnancyService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
  ) {}

  async getPregnancySummary(userId: string, targetFarmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const where: Prisma.PregnancyWhereInput = {};
    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return {
          checksDueToday: 0,
          checksDueThisWeek: 0,
          confirmedPregnancies: 0,
          rechecksRequired: 0,
          overdueChecks: 0,
        };
      }
      where.animal = {
        farmId:
          targetFarmId && farmIds.includes(targetFarmId)
            ? targetFarmId
            : { in: farmIds },
      };
    } else if (targetFarmId) {
      where.animal = { farmId: targetFarmId };
    }

    const pregnancies = await this.prisma.pregnancy.findMany({
      where,
      select: { status: true, pregnancyDate: true, notes: true },
    });

    const confirmed = pregnancies.filter(
      (p) => String(p.status) === 'CONFIRMED',
    ).length;
    const rechecks = pregnancies.filter((p) => {
      const { meta } = parseNotesMetadata(p.notes);
      return meta.pregnancyStatus === 'RECHECK_REQUIRED';
    }).length;

    const now = new Date();
    const todayStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
      ),
    );
    const todayEnd = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const dueToday = pregnancies.filter(
      (p) =>
        String(p.status) === 'PENDING' &&
        p.pregnancyDate >= todayStart &&
        p.pregnancyDate <= todayEnd,
    ).length;

    const dueThisWeek = pregnancies.filter(
      (p) =>
        String(p.status) === 'PENDING' &&
        p.pregnancyDate >= weekStart &&
        p.pregnancyDate <= weekEnd,
    ).length;

    return {
      checksDueToday: dueToday,
      checksDueThisWeek: dueThisWeek,
      confirmedPregnancies: confirmed,
      rechecksRequired: rechecks,
      overdueChecks: 0,
    };
  }
  async getPregnancyChecks(userId: string, query: PregnancyQueryDto) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PregnancyWhereInput = {};
    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.animal = {
        farmId:
          query.farmId && farmIds.includes(query.farmId)
            ? query.farmId
            : { in: farmIds },
      };
    } else if (query.farmId) {
      where.animal = { farmId: query.farmId };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { animal: { animalNumber: { contains: term, mode: 'insensitive' } } },
        { animal: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.pregnancy.count({ where }),
      this.prisma.pregnancy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { pregnancyDate: query.sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          animal: { include: { farm: { select: { id: true, name: true } } } },
          breedingRecord: {
            select: {
              id: true,
              breedingDate: true,
              technician: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    const formatted: FormattedPregnancyCheck[] = records.map((p) => {
      const { userNotes, meta } = parseNotesMetadata(p.notes);
      return {
        id: p.id,
        breedingServiceId: p.breedingRecordId,
        femaleAnimalId: p.animal.id,
        femaleAnimalTag: p.animal.animalNumber,
        femaleAnimalName: p.animal.name || p.animal.animalNumber,
        species: p.animal.species,
        imageUrl: p.animal.imageUrl,
        farmId: p.animal.farmId,
        farmName: p.animal.farm.name,
        lastServiceDate: formatDateString(p.breedingRecord.breedingDate),
        checkDate: formatDateString(p.pregnancyDate),
        checkType: meta.checkType || '60_DAY_CHECK',
        checkMethod: meta.checkMethod || 'Transrectal Ultrasonography',
        pregnancyStatus:
          String(p.status) === 'CONFIRMED'
            ? 'CONFIRMED'
            : String(p.status) === 'FAILED'
              ? 'NOT_PREGNANT'
              : String(p.status) === 'CANCELLED'
                ? 'PREGNANCY_LOST'
                : 'RECHECK_REQUIRED',
        pregnancyStageDays: meta.pregnancyStageDays || 60,
        estimatedCalvingDate: formatDateString(p.expectedCalvingDate),
        technicianOrVet:
          meta.technicianOrVet ||
          `${p.breedingRecord.technician.firstName} ${p.breedingRecord.technician.lastName}`.trim(),
        notes: userNotes,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
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
  async createPregnancyCheck(
    userId: string,
    dto: CreatePregnancyCheckDto,
  ): Promise<FormattedPregnancyCheck> {
    const female = await resolveAnimal(
      this.prisma,
      dto.femaleAnimalId,
      dto.farmId,
    );

    // Business rules validation
    this.animalBusinessRulesService.validatePregnancyEligibility(
      female,
      parseDateString(dto.checkDate),
    );

    let breedingRecordId = dto.breedingServiceId;

    if (!breedingRecordId) {
      const latest = await this.prisma.breedingRecord.findFirst({
        where: { femaleAnimalId: female.id },
        orderBy: { breedingDate: 'desc' },
      });
      if (latest) breedingRecordId = latest.id;
    }

    if (!breedingRecordId) {
      // Auto create an anchor breeding record if none existed
      const newBreeding = await this.prisma.breedingRecord.create({
        data: {
          femaleAnimalId: female.id,
          breedingDate: parseDateString(dto.checkDate),
          breedingMethod: BreedingMethod.ARTIFICIAL_INSEMINATION,
          technicianId: userId,
          status: BreedingStatus.COMPLETED,
          notes: 'Auto-linked via pregnancy diagnosis',
        },
      });
      breedingRecordId = newBreeding.id;
    }

    const checkDateParsed = parseDateString(dto.checkDate);
    const expectedCalv = dto.estimatedCalvingDate
      ? parseDateString(dto.estimatedCalvingDate)
      : new Date(checkDateParsed.getTime() + 223 * 86400000);

    let dbStatus: PregnancyStatus = PregnancyStatus.PENDING;
    if (dto.pregnancyStatus === PregnancyStatusInput.CONFIRMED)
      dbStatus = PregnancyStatus.CONFIRMED;
    else if (dto.pregnancyStatus === PregnancyStatusInput.NOT_PREGNANT)
      dbStatus = PregnancyStatus.FAILED;
    else if (dto.pregnancyStatus === PregnancyStatusInput.PREGNANCY_LOST)
      dbStatus = PregnancyStatus.CANCELLED;

    const meta: NotesMetadata = {
      checkType: dto.checkType,
      checkMethod: dto.checkMethod || 'Transrectal Palpation / Ultrasound',
      pregnancyStageDays: dto.pregnancyStageDays || 60,
      technicianOrVet: dto.technicianOrVet,
      notes: dto.notes || '',
    };

    const created = await this.prisma.pregnancy.create({
      data: {
        animalId: female.id,
        breedingRecordId,
        pregnancyDate: checkDateParsed,
        expectedCalvingDate: expectedCalv,
        status: dbStatus,
        notes: JSON.stringify(meta),
      },
      include: {
        animal: { include: { farm: { select: { id: true, name: true } } } },
        breedingRecord: {
          select: {
            id: true,
            breedingDate: true,
            technician: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Update parent breeding record status
    let breedingStatus: BreedingStatus = BreedingStatus.COMPLETED;
    if (dbStatus === PregnancyStatus.FAILED)
      breedingStatus = BreedingStatus.FAILED;
    if (dbStatus === PregnancyStatus.CANCELLED)
      breedingStatus = BreedingStatus.CANCELLED;

    await this.prisma.breedingRecord.update({
      where: { id: breedingRecordId },
      data: { status: breedingStatus },
    });

    return {
      id: created.id,
      breedingServiceId: created.breedingRecordId,
      femaleAnimalId: created.animal.id,
      femaleAnimalTag: created.animal.animalNumber,
      femaleAnimalName: created.animal.name || created.animal.animalNumber,
      farmId: created.animal.farmId,
      farmName: created.animal.farm.name,
      lastServiceDate: formatDateString(created.breedingRecord.breedingDate),
      checkDate: formatDateString(created.pregnancyDate),
      checkType: dto.checkType,
      checkMethod: meta.checkMethod || 'Palpation',
      pregnancyStatus: dto.pregnancyStatus,
      pregnancyStageDays: dto.pregnancyStageDays,
      estimatedCalvingDate: formatDateString(created.expectedCalvingDate),
      technicianOrVet: dto.technicianOrVet || 'Veterinarian',
      notes: dto.notes,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
