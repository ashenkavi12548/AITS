import {
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
  BreedingMethodInput,
  BreedingStatusInput,
} from '../dto';
import {
  NotesMetadata,
  FormattedBreedingRecord,
} from '../types/breeding.types';
import {
  resolveAnimal,
  parseDateString,
  formatDateString,
  parseNotesMetadata,
} from '../utils/breeding.utils';
@Injectable()
export class BreedingRecordsService {
  private readonly logger = new Logger(BreedingRecordsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
  ) {}

  async getBreedingRecords(userId: string, query: BreedingQueryDto) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.BreedingRecordWhereInput = {};

    // Farm scoping
    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.femaleAnimal = {
        farmId:
          query.farmId && farmIds.includes(query.farmId)
            ? query.farmId
            : { in: farmIds },
      };
    } else if (query.farmId) {
      where.femaleAnimal = { farmId: query.farmId };
    }

    // Method filter
    if (query.method) {
      const isAI = query.method.toUpperCase().includes('ARTIFICIAL');
      where.breedingMethod = isAI
        ? BreedingMethod.ARTIFICIAL_INSEMINATION
        : BreedingMethod.NATURAL;
    }

    // Date range
    if (query.startDate || query.endDate) {
      where.breedingDate = {};
      if (query.startDate) {
        const s = new Date(query.startDate);
        s.setHours(0, 0, 0, 0);
        where.breedingDate.gte = s;
      }
      if (query.endDate) {
        const e = new Date(query.endDate);
        e.setHours(23, 59, 59, 999);
        where.breedingDate.lte = e;
      }
    }

    // Text search
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        {
          femaleAnimal: {
            animalNumber: { contains: term, mode: 'insensitive' },
          },
        },
        { femaleAnimal: { name: { contains: term, mode: 'insensitive' } } },
        {
          femaleAnimal: {
            farm: { name: { contains: term, mode: 'insensitive' } },
          },
        },
        { technician: { firstName: { contains: term, mode: 'insensitive' } } },
        { technician: { lastName: { contains: term, mode: 'insensitive' } } },
        { maleAnimal: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.breedingRecord.count({ where }),
      this.prisma.breedingRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { breedingDate: query.sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          femaleAnimal: {
            include: { farm: { select: { id: true, name: true } } },
          },
          maleAnimal: {
            select: { id: true, animalNumber: true, name: true, breed: true },
          },
          technician: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    const formatted: FormattedBreedingRecord[] = records.map((r) => {
      const { userNotes, meta } = parseNotesMetadata(r.notes);
      const sDate = formatDateString(r.breedingDate);

      const d60 = new Date(r.breedingDate);
      d60.setDate(d60.getDate() + 60);
      const d90 = new Date(r.breedingDate);
      d90.setDate(d90.getDate() + 90);
      const d283 = new Date(r.breedingDate);
      d283.setDate(d283.getDate() + 283);

      return {
        id: r.id,
        serviceDate: sDate,
        femaleAnimalId: r.femaleAnimal.id,
        femaleAnimalTag: r.femaleAnimal.animalNumber,
        femaleAnimalName: r.femaleAnimal.name || r.femaleAnimal.animalNumber,
        species: r.femaleAnimal.species,
        imageUrl: r.femaleAnimal.imageUrl,
        femaleBreed: r.femaleAnimal.breed || 'Jersey / Friesian Cross',
        femaleDob: r.femaleAnimal.dateOfBirth
          ? formatDateString(r.femaleAnimal.dateOfBirth)
          : '2021-01-01',
        reproductiveStatus: 'Inseminated (PD Pending)',
        farmId: r.femaleAnimal.farmId,
        farmName: r.femaleAnimal.farm.name,
        serviceMethod:
          String(r.breedingMethod) === 'ARTIFICIAL_INSEMINATION'
            ? 'ARTIFICIAL_INSEMINATION'
            : 'NATURAL',
        attemptNumber: meta.attemptNumber || 1,
        technician:
          `${r.technician.firstName} ${r.technician.lastName}`.trim() ||
          r.technician.email,
        status:
          meta.status ||
          (String(r.status) === 'COMPLETED' ? 'COMPLETED' : String(r.status)),
        notes: userNotes,
        semenStrawId: meta.semenStrawId,
        semenBatchNumber: meta.semenBatchNumber,
        semenSupplier: meta.semenSupplier,
        inseminationMethod: meta.inseminationMethod,
        bullId: r.maleAnimal?.id || meta.bullId,
        bullTag: r.maleAnimal?.animalNumber || meta.bullTag,
        bullName: r.maleAnimal?.name || meta.bullName,
        bullBreed: r.maleAnimal?.breed || meta.bullBreed,
        bullOwnerSource: meta.bullOwnerSource,
        firstPregnancyCheckDate:
          meta.firstPregnancyCheckDate || formatDateString(d60),
        secondPregnancyCheckDate:
          meta.secondPregnancyCheckDate || formatDateString(d90),
        estimatedCalvingDate:
          meta.estimatedCalvingDate || formatDateString(d283),
        createdBy: `${r.technician.firstName} ${r.technician.lastName}`.trim(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
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
  async getBreedingRecordById(
    userId: string,
    id: string,
  ): Promise<FormattedBreedingRecord> {
    const record = await this.prisma.breedingRecord.findUnique({
      where: { id },
      include: {
        femaleAnimal: {
          include: { farm: { select: { id: true, name: true } } },
        },
        maleAnimal: {
          select: { id: true, animalNumber: true, name: true, breed: true },
        },
        technician: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Breeding record "${id}" was not found.`);
    }

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    if (!farmIds.includes(record.femaleAnimal.farmId)) {
      throw new ForbiddenException(
        'You do not have access to this farm facility.',
      );
    }

    const { userNotes, meta } = parseNotesMetadata(record.notes);
    const d60 = new Date(record.breedingDate);
    d60.setDate(d60.getDate() + 60);
    const d90 = new Date(record.breedingDate);
    d90.setDate(d90.getDate() + 90);
    const d283 = new Date(record.breedingDate);
    d283.setDate(d283.getDate() + 283);

    return {
      id: record.id,
      serviceDate: formatDateString(record.breedingDate),
      femaleAnimalId: record.femaleAnimal.id,
      femaleAnimalTag: record.femaleAnimal.animalNumber,
      femaleAnimalName:
        record.femaleAnimal.name || record.femaleAnimal.animalNumber,
      femaleBreed: record.femaleAnimal.breed || 'Cattle',
      femaleDob: record.femaleAnimal.dateOfBirth
        ? formatDateString(record.femaleAnimal.dateOfBirth)
        : '2021-01-01',
      reproductiveStatus: 'Inseminated',
      farmId: record.femaleAnimal.farmId,
      farmName: record.femaleAnimal.farm.name,
      serviceMethod:
        String(record.breedingMethod) === 'ARTIFICIAL_INSEMINATION'
          ? 'ARTIFICIAL_INSEMINATION'
          : 'NATURAL',
      attemptNumber: meta.attemptNumber || 1,
      technician:
        `${record.technician.firstName} ${record.technician.lastName}`.trim(),
      status: meta.status || String(record.status),
      notes: userNotes,
      semenStrawId: meta.semenStrawId,
      semenBatchNumber: meta.semenBatchNumber,
      semenSupplier: meta.semenSupplier,
      inseminationMethod: meta.inseminationMethod,
      bullId: record.maleAnimal?.id || meta.bullId,
      bullTag: record.maleAnimal?.animalNumber || meta.bullTag,
      bullName: record.maleAnimal?.name || meta.bullName,
      bullBreed: record.maleAnimal?.breed || meta.bullBreed,
      bullOwnerSource: meta.bullOwnerSource,
      firstPregnancyCheckDate:
        meta.firstPregnancyCheckDate || formatDateString(d60),
      secondPregnancyCheckDate:
        meta.secondPregnancyCheckDate || formatDateString(d90),
      estimatedCalvingDate: meta.estimatedCalvingDate || formatDateString(d283),
      createdBy:
        `${record.technician.firstName} ${record.technician.lastName}`.trim(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
  async createBreedingRecord(
    userId: string,
    dto: CreateBreedingDto,
  ): Promise<FormattedBreedingRecord> {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    if (!farmIds.includes(dto.farmId)) {
      throw new ForbiddenException(
        'You do not have access to log breeding on this farm.',
      );
    }

    const female = await resolveAnimal(
      this.prisma,
      dto.femaleAnimalId,
      dto.farmId,
    );
    let maleAnimalId: string | null = null;
    let male: import('@prisma/client').Animal | null = null;
    if (dto.bullId) {
      try {
        male = await resolveAnimal(this.prisma, dto.bullId);
        maleAnimalId = male.id;
      } catch {
        // Bull may be external or tag string
      }
    }

    const bDate = parseDateString(dto.serviceDate);

    // Check if the female is already pregnant
    const activePregnancy = await this.prisma.pregnancy.findFirst({
      where: {
        animalId: female.id,
        status: { in: [PregnancyStatus.PENDING, PregnancyStatus.CONFIRMED] },
      },
    });

    if (activePregnancy) {
      throw new BadRequestException(
        `Animal ${female.animalNumber} is currently pregnant or pending a pregnancy check and cannot receive a new breeding service.`,
      );
    }

    if (maleAnimalId && male) {
      this.animalBusinessRulesService.validateBreedingEligibility(
        male,
        female,
        bDate,
      );
    } else {
      // If external bull string is provided without ID, at least validate female
      this.animalBusinessRulesService.validateActiveStatus(female, 'breeding');
      this.animalBusinessRulesService.validateTimeline(female, bDate);
    }

    const d60 = new Date(bDate);
    d60.setDate(d60.getDate() + 60);
    const d90 = new Date(bDate);
    d90.setDate(d90.getDate() + 90);
    const d283 = new Date(bDate);
    d283.setDate(d283.getDate() + 283);

    const isAI =
      dto.serviceMethod === BreedingMethodInput.ARTIFICIAL_INSEMINATION ||
      dto.serviceMethod.includes('ARTIFICIAL');

    const meta: NotesMetadata = {
      attemptNumber: dto.attemptNumber || 1,
      status: 'COMPLETED',
      notes: dto.notes || '',
      semenStrawId: dto.semenStrawId,
      semenBatchNumber: dto.semenBatchNumber,
      semenSupplier: dto.semenSupplier,
      inseminationMethod: dto.inseminationMethod,
      bullId: dto.bullId,
      bullTag: dto.bullTag,
      bullName: dto.bullName,
      bullBreed: dto.bullBreed,
      bullOwnerSource: dto.bullOwnerSource,
      firstPregnancyCheckDate:
        dto.firstPregnancyCheckDate || formatDateString(d60),
      secondPregnancyCheckDate:
        dto.secondPregnancyCheckDate || formatDateString(d90),
      estimatedCalvingDate: dto.estimatedCalvingDate || formatDateString(d283),
    };

    const created = await this.prisma.breedingRecord.create({
      data: {
        femaleAnimalId: female.id,
        maleAnimalId,
        breedingDate: bDate,
        breedingMethod: isAI
          ? BreedingMethod.ARTIFICIAL_INSEMINATION
          : BreedingMethod.NATURAL,
        technicianId: userId,
        status: BreedingStatus.COMPLETED,
        notes: JSON.stringify(meta),
      },
      include: {
        femaleAnimal: {
          include: { farm: { select: { id: true, name: true } } },
        },
        maleAnimal: {
          select: { id: true, animalNumber: true, name: true, breed: true },
        },
        technician: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return this.getBreedingRecordById(userId, created.id);
  }
  async updateBreedingRecord(
    userId: string,
    id: string,
    dto: UpdateBreedingDto,
  ): Promise<FormattedBreedingRecord> {
    const existing = await this.getBreedingRecordById(userId, id);
    const { meta } = parseNotesMetadata(existing.notes);

    const updatedMeta: NotesMetadata = {
      ...meta,
      ...dto,
      status: dto.status || meta.status || existing.status,
      notes: dto.notes !== undefined ? dto.notes : existing.notes,
    };

    let prismaStatus: BreedingStatus = BreedingStatus.COMPLETED;
    if (dto.status === BreedingStatusInput.CANCELLED)
      prismaStatus = BreedingStatus.CANCELLED;
    else if (dto.status === BreedingStatusInput.UNSUCCESSFUL)
      prismaStatus = BreedingStatus.FAILED;

    const data: Prisma.BreedingRecordUpdateInput = {
      notes: JSON.stringify(updatedMeta),
      status: prismaStatus,
    };

    if (dto.serviceDate) {
      data.breedingDate = parseDateString(dto.serviceDate);
    }
    if (dto.serviceMethod) {
      data.breedingMethod =
        dto.serviceMethod === BreedingMethodInput.ARTIFICIAL_INSEMINATION ||
        dto.serviceMethod.includes('ARTIFICIAL')
          ? BreedingMethod.ARTIFICIAL_INSEMINATION
          : BreedingMethod.NATURAL;
    }

    await this.prisma.breedingRecord.update({
      where: { id },
      data,
    });

    return this.getBreedingRecordById(userId, id);
  }
  async deleteBreedingRecord(
    userId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getBreedingRecordById(userId, id);
    await this.prisma.breedingRecord.delete({ where: { id } });
    return { success: true };
  }
}
