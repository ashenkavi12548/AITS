import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, VaccinationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import {
  CreateVaccinationDto,
  UpdateVaccinationDto,
  HealthQueryDto,
} from '../dto';
import { PaginatedResult } from '../health.types';

@Injectable()
export class HealthVaccinationService {
  private readonly logger = new Logger(HealthVaccinationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  /**
   * Helper to verify and find animal by UUID or Tag Number scoped to user authorization.
   */
  private async findAuthorizedAnimal(
    animalTagOrId: string,
    farmScope: { farmIds: string[] },
  ) {
    const animal = await this.prisma.animal.findFirst({
      where: {
        OR: [
          { animalNumber: animalTagOrId },
          { id: animalTagOrId.length === 36 ? animalTagOrId : undefined },
        ],
        deletedAt: null,
      },
      include: { farm: true },
    });

    if (!animal) {
      throw new NotFoundException(
        `Animal '${animalTagOrId}' not found in registry`,
      );
    }

    if (!farmScope.farmIds.includes(animal.farmId)) {
      throw new ForbiddenException(
        `Access denied for animal '${animal.animalNumber}' on farm '${animal.farm.name}'`,
      );
    }

    if (animal.status === 'SOLD') {
      throw new ConflictException(
        `Animal '${animal.animalNumber}' has been sold and is no longer available for farm processes.`,
      );
    }

    return animal;
  }

  async getVaccinations(
    query: HealthQueryDto,
    userId: string,
  ): Promise<PaginatedResult<unknown>> {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const { page = 1, limit = 20, search, status, farmId, animalId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VaccinationWhereInput = {
      ...(farmId
        ? { animal: { farmId } }
        : { animal: { farmId: { in: scope.farmIds } } }),
      ...(animalId ? { animalId } : {}),
      ...(status ? { status: status as VaccinationStatus } : {}),
      ...(search
        ? {
            OR: [
              { vaccineName: { contains: search, mode: 'insensitive' } },
              { batchNumber: { contains: search, mode: 'insensitive' } },
              {
                animal: {
                  animalNumber: { contains: search, mode: 'insensitive' },
                },
              },
              {
                animal: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.vaccination.count({ where }),
      this.prisma.vaccination.findMany({
        where,
        include: {
          animal: {
            select: {
              id: true,
              animalNumber: true,
              name: true,
              breed: true,
              species: true,
              imageUrl: true,
              farm: { select: { id: true, name: true } },
            },
          },
          administeredBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { vaccinationDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const now = new Date();
    const formatted = records.map((v) => {
      let statusKey = 'up_to_date';
      if (v.nextDueDate) {
        const due = new Date(v.nextDueDate);
        const daysDiff = Math.ceil(
          (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysDiff < 0) {
          statusKey = 'overdue';
        } else if (daysDiff <= 30) {
          statusKey = 'due_soon';
        }
      }

      return {
        id: v.id,
        animalTag: v.animal.animalNumber,
        animalName: v.animal.name || 'Unnamed',
        breed: v.animal.breed,
        species: v.animal.species,
        imageUrl: v.animal.imageUrl,
        vaccine: v.vaccineName,
        dose: v.dose,
        batchNo: v.batchNumber || 'N/A',
        date: v.vaccinationDate.toISOString().split('T')[0],
        nextDue: v.nextDueDate
          ? v.nextDueDate.toISOString().split('T')[0]
          : null,
        vet: `${v.administeredBy.firstName} ${v.administeredBy.lastName}`,
        status: statusKey,
        notes: v.notes || '',
        farmName: v.animal.farm.name,
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVaccinePrograms(userId: string, farmId?: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const farmFilter: Prisma.AnimalWhereInput = {
      deletedAt: null,
      ...(farmId ? { farmId } : { farmId: { in: scope.farmIds } }),
    };

    const totalAnimals = await this.prisma.animal.count({ where: farmFilter });
    const standardPrograms = [
      {
        name: 'Foot and Mouth Disease (FMD)',
        abbr: 'FMD',
        interval: '6 months',
        color: 'bg-sky-500',
        light: 'bg-sky-500/10',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-500/20',
      },
      {
        name: 'Anthrax',
        abbr: 'ANT',
        interval: 'Annual',
        color: 'bg-purple-500',
        light: 'bg-purple-500/10',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/20',
      },
      {
        name: 'Blackleg (Clostridium)',
        abbr: 'BLK',
        interval: 'Annual',
        color: 'bg-orange-500',
        light: 'bg-orange-500/10',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/20',
      },
      {
        name: 'Rabies',
        abbr: 'RAB',
        interval: '3 years',
        color: 'bg-red-500',
        light: 'bg-red-500/10',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500/20',
      },
      {
        name: 'Lumpy Skin Disease (LSD)',
        abbr: 'LSD',
        interval: 'Annual',
        color: 'bg-[#10a37f]',
        light: 'bg-[#10a37f]/10',
        text: 'text-[#10a37f]',
        border: 'border-[#10a37f]/20',
      },
    ];

    const results = await Promise.all(
      standardPrograms.map(async (p) => {
        const coveredCount = await this.prisma.vaccination.count({
          where: {
            vaccineName: { contains: p.abbr, mode: 'insensitive' },
            animal: farmFilter,
          },
        });

        return {
          ...p,
          covered: coveredCount,
          total: totalAnimals,
        };
      }),
    );

    return results;
  }

  async createVaccination(dto: CreateVaccinationDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);

    const vaccinationDate = dto.vaccinationDate
      ? new Date(dto.vaccinationDate)
      : new Date();
    const nextDueDate = dto.nextDueDate ? new Date(dto.nextDueDate) : null;

    // Check for exact duplicate on the same day
    const startOfDay = new Date(vaccinationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(vaccinationDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingVaccination = await this.prisma.vaccination.findFirst({
      where: {
        animalId: animal.id,
        vaccineName: { equals: dto.vaccineName, mode: 'insensitive' },
        vaccinationDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: VaccinationStatus.CANCELLED },
      },
    });

    if (existingVaccination) {
      throw new ConflictException({
        message: `Animal '${animal.animalNumber}' already has a '${dto.vaccineName}' vaccination recorded on this day.`,
        code: 'VACCINATION_DUPLICATE',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const vaccination = await tx.vaccination.create({
        data: {
          animalId: animal.id,
          administeredById: userId,
          vaccineName: dto.vaccineName,
          dose: dto.dose,
          batchNumber: dto.batchNumber,
          vaccinationDate,
          nextDueDate,
          status: dto.status || VaccinationStatus.COMPLETED,
          notes: dto.notes,
        },
        include: { animal: true, administeredBy: true },
      });

      if (nextDueDate) {
        await tx.vaccination.create({
          data: {
            animalId: animal.id,
            administeredById: userId,
            vaccineName: dto.vaccineName,
            dose: dto.dose,
            vaccinationDate: nextDueDate,
            nextDueDate: nextDueDate,
            status: VaccinationStatus.SCHEDULED,
            notes: `Auto-scheduled booster for ${dto.vaccineName}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'VACCINATION_RECORD',
          entityType: 'Vaccination',
          entityId: vaccination.id,
          newValues: {
            animalNumber: animal.animalNumber,
            vaccineName: dto.vaccineName,
            batchNumber: dto.batchNumber,
          },
        },
      });

      return vaccination;
    });
  }

  async getVaccinationProgramCatalog(userId: string, farmId?: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const targetFarmIds = farmId ? [farmId] : scope.farmIds;

    return this.prisma.vaccinationProgram.findMany({
      where: {
        active: true,
        OR: [
          { farmId: null },
          ...(targetFarmIds ? [{ farmId: { in: targetFarmIds } }] : []),
        ],
      },
      include: { disease: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateVaccination(
    id: string,
    dto: UpdateVaccinationDto,
    userId: string,
  ) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const existingVaccination = await this.prisma.vaccination.findUnique({
      where: { id },
      include: { animal: true },
    });
    if (!existingVaccination) {
      throw new NotFoundException(`Vaccination record '${id}' not found`);
    }

    if (!scope.farmIds.includes(existingVaccination.animal.farmId)) {
      throw new ForbiddenException(
        `Access denied for modifying vaccination records on this farm.`,
      );
    }

    const nextDueDate =
      dto.nextDueDate === null
        ? null
        : dto.nextDueDate
          ? new Date(dto.nextDueDate)
          : undefined;

    return this.prisma.$transaction(async (tx) => {
      const updatedVaccination = await tx.vaccination.update({
        where: { id },
        data: {
          ...(dto.vaccineName && { vaccineName: dto.vaccineName }),
          ...(dto.dose !== undefined && { dose: dto.dose }),

          ...(dto.batchNumber !== undefined && {
            batchNumber: dto.batchNumber,
          }),
          ...(nextDueDate !== undefined && { nextDueDate }),
          ...(dto.status && { status: dto.status }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
        include: { animal: true, administeredBy: true },
      });

      // 4. Update the Calendar Reminder if nextDueDate is edited
      if (nextDueDate !== undefined) {
        // Find existing scheduled reminder (vaccinationDate matches the old nextDueDate, and status is SCHEDULED)
        const oldDueDate = existingVaccination.nextDueDate;

        if (oldDueDate) {
          const scheduledReminder = await tx.vaccination.findFirst({
            where: {
              animalId: existingVaccination.animalId,
              vaccineName: existingVaccination.vaccineName,
              status: VaccinationStatus.SCHEDULED,
              vaccinationDate: oldDueDate,
            },
          });

          if (scheduledReminder) {
            if (nextDueDate === null) {
              // Reminder removed
              await tx.vaccination.delete({
                where: { id: scheduledReminder.id },
              });
            } else {
              // Reminder updated
              await tx.vaccination.update({
                where: { id: scheduledReminder.id },
                data: {
                  vaccinationDate: nextDueDate,
                  nextDueDate: nextDueDate,
                  ...(dto.vaccineName && { vaccineName: dto.vaccineName }),
                },
              });
            }
          } else if (nextDueDate !== null) {
            // No reminder existed, but a new due date is set
            await tx.vaccination.create({
              data: {
                animalId: existingVaccination.animalId,
                administeredById: userId,
                vaccineName: updatedVaccination.vaccineName,
                dose: updatedVaccination.dose,
                vaccinationDate: nextDueDate,
                nextDueDate: nextDueDate,
                status: VaccinationStatus.SCHEDULED,
                notes: `Auto-scheduled booster for ${updatedVaccination.vaccineName}`,
              },
            });
          }
        } else if (nextDueDate !== null) {
          // Previously had no due date, now it does
          await tx.vaccination.create({
            data: {
              animalId: existingVaccination.animalId,
              administeredById: userId,
              vaccineName: updatedVaccination.vaccineName,
              dose: updatedVaccination.dose,
              vaccinationDate: nextDueDate,
              nextDueDate: nextDueDate,
              status: VaccinationStatus.SCHEDULED,
              notes: `Auto-scheduled booster for ${updatedVaccination.vaccineName}`,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'VACCINATION_RECORD_UPDATE',
          entityType: 'Vaccination',
          entityId: id,
          newValues: {
            vaccineName: updatedVaccination.vaccineName,
            nextDueDate: updatedVaccination.nextDueDate,
            status: updatedVaccination.status,
          },
        },
      });

      return updatedVaccination;
    });
  }
}
