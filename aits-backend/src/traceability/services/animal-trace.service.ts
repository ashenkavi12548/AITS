import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  DailyActivityType,
  ActivityStatus,
  MilkingSession,
  Prisma,
} from '@prisma/client';
import { animalSelect } from './traceability-shapes';

@Injectable()
export class AnimalTraceService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveFarms(userId: string) {
    // Return farms accessible to the user
    const farmUsers = await this.prisma.farmUser.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
            province: true,
            status: true,
          },
        },
      },
    });
    const farms = farmUsers
      .map((fu) => fu.farm)
      .filter((f) => f.status === 'ACTIVE');

    // Admin / government officers get all active farms
    if (farms.length === 0) {
      return this.prisma.farm.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        select: {
          id: true,
          name: true,
          registrationNumber: true,
          province: true,
        },
        orderBy: { name: 'asc' },
      });
    }
    return farms;
  }

  async getEligibleAnimals(userId: string, farmId?: string) {
    const where: Prisma.AnimalWhereInput = {
      status: { not: 'DECEASED' },
      deletedAt: null,
    };
    if (farmId) {
      where.farmId = farmId;
    } else {
      const farms = await this.getActiveFarms(userId);
      const farmIds = farms.map((f) => f.id);
      if (farmIds.length === 0) return [];
      where.farmId = { in: farmIds };
    }

    const animals = await this.prisma.animal.findMany({
      where,
      select: animalSelect,
      orderBy: { animalNumber: 'asc' },
      take: 200,
    });

    return animals.map((a) => {
      const primaryTag =
        a.identifiers.find((i) => i.isPrimary)?.identifierValue ??
        a.animalNumber;
      const ageMs = Date.now() - a.dateOfBirth.getTime();
      const ageYears = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
      const ageMonths = Math.floor(
        (ageMs % (1000 * 60 * 60 * 24 * 365.25)) /
          (1000 * 60 * 60 * 24 * 30.44),
      );
      return {
        id: a.id,
        tagNumber: primaryTag,
        name: a.name ?? a.animalNumber,
        gender: a.gender,
        breed: a.breed,
        dob: a.dateOfBirth.toISOString().split('T')[0],
        ageYears,
        ageMonths,
        farmId: a.farmId,
        farmName: a.farm.name,
        status: a.status,
        isDeceased: a.status === 'DECEASED',
        isQuarantined: a.status === 'QUARANTINED',
        photoUrl: a.imageUrl,
      };
    });
  }

  async getTraceabilityOverview(
    userId: string,
    farmId?: string,
    date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      1,
    );
    const monthEnd = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      67,
    );

    const farmFilter: Prisma.DailyActivityLogWhereInput = farmId
      ? { farmId }
      : {};
    const movFarmFilter: Prisma.FarmTransferWhereInput = farmId
      ? { OR: [{ fromFarmId: farmId }, { toFarmId: farmId }] }
      : {};

    const [
      activitiesToday,
      feedingToday,
      milkingToday,
      morningMilk,
      eveningMilk,
      movedThisMonth,
      attentionCount,
    ] = await this.prisma.$transaction([
      this.prisma.dailyActivityLog.count({
        where: {
          ...farmFilter,
          activityDate: { gte: dayStart, lte: dayEnd },
          deletedAt: null,
        },
      }),
      this.prisma.dailyActivityLog.findMany({
        where: {
          ...farmFilter,
          activityType: DailyActivityType.FEEDING,
          activityDate: { gte: dayStart, lte: dayEnd },
          deletedAt: null,
        },
        distinct: ['animalId'],
        select: { animalId: true },
      }),
      this.prisma.milkProduction.findMany({
        where: {
          ...(farmId ? { farmId } : {}),
          productionDate: { gte: dayStart, lte: dayEnd },
        },
        distinct: ['animalId'],
        select: { animalId: true },
      }),
      this.prisma.milkProduction.aggregate({
        where: {
          ...(farmId ? { farmId } : {}),
          milkingSession: MilkingSession.MORNING,
          productionDate: { gte: dayStart, lte: dayEnd },
        },
        _sum: { quantityLiters: true },
      }),
      this.prisma.milkProduction.aggregate({
        where: {
          ...(farmId ? { farmId } : {}),
          milkingSession: MilkingSession.EVENING,
          productionDate: { gte: dayStart, lte: dayEnd },
        },
        _sum: { quantityLiters: true },
      }),
      this.prisma.farmTransfer.count({
        where: {
          ...movFarmFilter,
          departureDate: { gte: monthStart, lte: monthEnd },
          deletedAt: null,
        },
      }),
      this.prisma.dailyActivityLog.count({
        where: {
          ...farmFilter,
          activityDate: { gte: dayStart, lte: dayEnd },
          requiresVet: true,
          status: ActivityStatus.PENDING,
          deletedAt: null,
        },
      }),
    ]);

    return {
      activitiesRecordedToday: activitiesToday,
      animalsFedToday: feedingToday.length,
      animalsMilkedToday: milkingToday.length,
      totalMorningMilkLitres: morningMilk._sum.quantityLiters ?? 0,
      totalEveningMilkLitres: eveningMilk._sum.quantityLiters ?? 0,
      animalsMovedThisMonth: movedThisMonth,
      activitiesRequiringAttention: attentionCount,
    };
  }

  async getAnimalLifetimeTrace(
    userId: string,
    animalId: string,
    filters: {
      category?: string;
      startDate?: string;
      endDate?: string;
      sortOrder?: 'newest' | 'oldest';
    } = {},
  ) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      select: {
        ...animalSelect,
        identifiers: {
          select: {
            identifierValue: true,
            isPrimary: true,
            identifierType: true,
          },
        },
      },
    });
    if (!animal)
      throw new NotFoundException('The requested animal could not be found.');

    const primaryTag =
      animal.identifiers.find((i) => i.isPrimary)?.identifierValue ??
      animal.animalNumber;

    // Aggregate all event types from all domain tables
    const events: Array<{
      id: string;
      animalId: string;
      dateTime: string;
      category: string;
      title: string;
      resultOrQuantity?: string;
      farmName: string;
      recordedBy: string;
      status: string;
      notes?: string;
    }> = [];

    // 1. Identity events (identifiers)
    events.push({
      id: `identity-${animal.id}`,
      animalId: animal.id,
      dateTime: animal.createdAt.toISOString(),
      category: 'IDENTITY',
      title: `Animal Registered — Tag: ${primaryTag}`,
      resultOrQuantity: primaryTag,
      farmName: animal.farm.name,
      recordedBy: 'System',
      status: 'COMPLETED',
    });

    // 2. Feeding records (traceability daily activities)
    const activities = await this.prisma.dailyActivityLog.findMany({
      where: { animalId, deletedAt: null },
      include: {
        farm: { select: { name: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { activityDate: 'desc' },
    });

    for (const act of activities) {
      let category = 'FEEDING';
      let title = 'Feeding';
      let resultOrQuantity: string | undefined;

      if (act.activityType === DailyActivityType.FEEDING) {
        category = 'FEEDING';
        title = act.feedName ? `Feeding: ${act.feedName}` : 'Feeding';
        resultOrQuantity = act.quantity
          ? `${act.quantity} ${act.unit ?? ''}`.trim()
          : (act.feedType ?? undefined);
      } else if (act.activityType === DailyActivityType.WEIGHT_CHECK) {
        category = 'HEALTH';
        title = 'Weight Check';
        resultOrQuantity = act.weightKg ? `${act.weightKg} kg` : undefined;
      } else if (act.activityType === DailyActivityType.HEALTH_CHECK) {
        category = 'HEALTH';
        title = 'Field Health Check';
        resultOrQuantity = act.temperature
          ? `${act.temperature} °C`
          : (act.healthStatus ?? undefined);
      } else if (act.activityType === DailyActivityType.GENERAL_OBSERVATION) {
        category = 'HEALTH';
        title = 'Field Observation';
        resultOrQuantity = act.observation ?? undefined;
      }

      events.push({
        id: act.id,
        animalId: act.animalId,
        dateTime: `${act.activityDate.toISOString().split('T')[0]} ${act.activityTime}`,
        category,
        title,
        resultOrQuantity,
        farmName: act.farm.name,
        recordedBy: `${act.recordedBy.firstName} ${act.recordedBy.lastName}`,
        status: act.status,
        notes: act.notes ?? undefined,
      });
    }

    // 2b. Production Module: Milk Records
    const milkRecords = await this.prisma.milkProduction.findMany({
      where: { animalId },
      include: {
        farm: { select: { name: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { productionDate: 'desc' },
    });
    for (const m of milkRecords) {
      events.push({
        id: m.id,
        animalId,
        dateTime: m.productionDate.toISOString(),
        category: 'MILK_PRODUCTION',
        title: `${m.milkingSession} Milking`,
        resultOrQuantity: `${m.quantityLiters} L`,
        farmName: m.farm.name,
        recordedBy: `${m.recordedBy.firstName} ${m.recordedBy.lastName}`,
        status: 'COMPLETED',
        notes: m.notes ?? undefined,
      });
    }

    // 3. Vaccinations
    const vaccinations = await this.prisma.vaccination.findMany({
      where: { animalId },
      include: {
        administeredBy: { select: { firstName: true, lastName: true } },
      },
    });
    for (const v of vaccinations) {
      events.push({
        id: v.id,
        animalId,
        dateTime: v.vaccinationDate.toISOString(),
        category: 'HEALTH',
        title: `Vaccination: ${v.vaccineName}`,
        resultOrQuantity: v.batchNumber ? `Batch ${v.batchNumber}` : undefined,
        farmName: animal.farm.name,
        recordedBy: `${v.administeredBy.firstName} ${v.administeredBy.lastName}`,
        status: v.status,
        notes: v.notes ?? undefined,
      });
    }

    // 3b. Treatments
    const treatments = await this.prisma.treatment.findMany({
      where: { animalId },
      include: {
        veterinarian: { select: { firstName: true, lastName: true } },
      },
    });
    for (const t of treatments) {
      events.push({
        id: t.id,
        animalId,
        dateTime: t.startDate.toISOString(),
        category: 'HEALTH',
        title: `Treatment: ${t.treatmentName}`,
        resultOrQuantity: t.dose ?? undefined,
        farmName: animal.farm.name,
        recordedBy: `${t.veterinarian.firstName} ${t.veterinarian.lastName}`,
        status: 'COMPLETED',
        notes: t.instructions ?? undefined,
      });
    }

    // 3c. Health Cases
    const healthCases = await this.prisma.healthCase.findMany({
      where: { animalId },
      include: {
        veterinarian: { select: { firstName: true, lastName: true } },
      },
    });
    for (const hc of healthCases) {
      events.push({
        id: hc.id,
        animalId,
        dateTime: hc.openedAt.toISOString(),
        category: 'HEALTH',
        title: `Health Case: ${hc.title}`,
        resultOrQuantity: hc.status,
        farmName: animal.farm.name,
        recordedBy: `${hc.veterinarian.firstName} ${hc.veterinarian.lastName}`,
        status: hc.status,
        notes: hc.chiefComplaint ?? undefined,
      });
    }

    // 4. Breeding records
    const breedings = await this.prisma.breedingRecord.findMany({
      where: { femaleAnimalId: animalId },
      include: { technician: { select: { firstName: true, lastName: true } } },
    });
    for (const b of breedings) {
      events.push({
        id: b.id,
        animalId,
        dateTime: b.breedingDate.toISOString(),
        category: 'BREEDING',
        title: `${b.breedingMethod === 'ARTIFICIAL_INSEMINATION' ? 'AI Service' : 'Natural Service'}`,
        resultOrQuantity: b.status,
        farmName: animal.farm.name,
        recordedBy: `${b.technician.firstName} ${b.technician.lastName}`,
        status: b.status,
        notes: b.notes ?? undefined,
      });
    }

    // 5. Pregnancies
    const pregnancies = await this.prisma.pregnancy.findMany({
      where: { animalId },
    });
    for (const p of pregnancies) {
      events.push({
        id: p.id,
        animalId,
        dateTime: p.pregnancyDate.toISOString(),
        category: 'PREGNANCY',
        title: 'Pregnancy Confirmed',
        resultOrQuantity: `Expected ${p.expectedCalvingDate.toISOString().split('T')[0]}`,
        farmName: animal.farm.name,
        recordedBy: 'Veterinary Officer',
        status: p.status,
        notes: p.notes ?? undefined,
      });
    }

    // 6. Calvings
    const calvings = await this.prisma.calvingRecord.findMany({
      where: { motherId: animalId },
    });
    for (const c of calvings) {
      events.push({
        id: c.id,
        animalId,
        dateTime: c.calvingDate.toISOString(),
        category: 'CALVING',
        title: `Calving — ${c.calvingType}`,
        resultOrQuantity: `${c.calfCount} calf/calves`,
        farmName: animal.farm.name,
        recordedBy: 'Veterinary Officer',
        status: 'COMPLETED',
        notes: c.notes ?? undefined,
      });
    }

    // 7. Farm transfers
    const transfers = await this.prisma.farmTransfer.findMany({
      where: { animalId, deletedAt: null },
      include: {
        fromFarm: { select: { name: true } },
        toFarm: { select: { name: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
    });
    for (const t of transfers) {
      events.push({
        id: t.id,
        animalId,
        dateTime: `${t.departureDate.toISOString().split('T')[0]} ${t.departureTime}`,
        category: 'FARM',
        title: `Farm Transfer: ${t.fromFarm.name} → ${t.toFarm.name}`,
        resultOrQuantity: `Reason: ${t.reason.replace(/_/g, ' ')}`,
        farmName: t.fromFarm.name,
        recordedBy: `${t.recordedBy.firstName} ${t.recordedBy.lastName}`,
        status: t.status,
        notes: t.notes ?? undefined,
      });
    }

    // 8. Documents
    const documents = await this.prisma.document.findMany({
      where: { animalId, deletedAt: null },
      include: { documentType: { select: { name: true } } },
    });
    for (const d of documents) {
      events.push({
        id: d.id,
        animalId,
        dateTime: d.createdAt.toISOString(),
        category: 'DOCUMENTS',
        title: `Document: ${d.documentType.name}`,
        resultOrQuantity: d.fileName,
        farmName: animal.farm.name,
        recordedBy: 'Document Officer',
        status: d.status,
      });
    }

    // Apply filters
    let filtered = events;
    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter((e) => e.category === filters.category);
    }
    if (filters.startDate) {
      filtered = filtered.filter((e) => e.dateTime >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((e) => e.dateTime <= filters.endDate!);
    }

    // Sort
    if (filters.sortOrder === 'oldest') {
      filtered.sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
      );
    }

    return {
      animal: {
        id: animal.id,
        tagNumber: primaryTag,
        name: animal.name ?? animal.animalNumber,
        gender: animal.gender,
        breed: animal.breed,
        dob: animal.dateOfBirth.toISOString().split('T')[0],
        farmId: animal.farmId,
        farmName: animal.farm.name,
        status: animal.status,
        photoUrl: animal.imageUrl,
      },
      events: filtered,
    };
  }
}
