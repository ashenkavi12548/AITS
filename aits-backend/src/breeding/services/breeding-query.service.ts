import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { AnimalBusinessRulesService } from '../../common/business-rules/animal-business-rules.service';
import { Prisma } from '@prisma/client';

import { formatDateString, parseNotesMetadata } from '../utils/breeding.utils';
@Injectable()
export class BreedingQueryService {
  private readonly logger = new Logger(BreedingQueryService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
  ) {}

  async getBreedingSummary(userId: string, targetFarmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const whereBase: Prisma.BreedingRecordWhereInput = {};

    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return {
          totalBreedingServices: 0,
          pregnancyChecksPending: 0,
          confirmedPregnancies: 0,
          expectedCalvings: 0,
          overdueActivities: 0,
          breedingSuccessRate: 0,
        };
      }
      whereBase.femaleAnimal = {
        farmId:
          targetFarmId && farmIds.includes(targetFarmId)
            ? targetFarmId
            : { in: farmIds },
      };
    } else if (targetFarmId) {
      whereBase.femaleAnimal = { farmId: targetFarmId };
    }

    const [totalServices, allRecords, allPregnancies] = await Promise.all([
      this.prisma.breedingRecord.count({ where: whereBase }),
      this.prisma.breedingRecord.findMany({
        where: whereBase,
        select: { status: true, notes: true },
      }),
      this.prisma.pregnancy.findMany({
        where: whereBase.femaleAnimal
          ? { animal: { farmId: whereBase.femaleAnimal.farmId } }
          : {},
        select: { status: true, expectedCalvingDate: true },
      }),
    ]);

    let successfulCount = allPregnancies.filter(
      (p) => String(p.status) === 'CONFIRMED',
    ).length;
    let pendingChecks = 0;

    allRecords.forEach((r) => {
      const { meta } = parseNotesMetadata(r.notes);
      if (meta.status === 'SUCCESSFUL') successfulCount++;
      if (
        meta.status === 'PREGNANCY_CHECK_PENDING' ||
        meta.status === 'COMPLETED'
      )
        pendingChecks++;
    });

    const expectedCalvings = allPregnancies.filter(
      (p) =>
        String(p.status) === 'CONFIRMED' && p.expectedCalvingDate >= new Date(),
    ).length;
    const successRate =
      totalServices > 0 ? (successfulCount / totalServices) * 100 : 0;

    return {
      totalBreedingServices: totalServices,
      pregnancyChecksPending: pendingChecks,
      confirmedPregnancies: successfulCount,
      expectedCalvings,
      overdueActivities: 0,
      breedingSuccessRate: Number(successRate.toFixed(1)),
    };
  }
  async getUpcomingActivities(userId: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const where: Prisma.BreedingRecordWhereInput = {};
    if (farmIds !== undefined) {
      if (farmIds.length === 0) return [];
      where.femaleAnimal = { farmId: { in: farmIds } };
    }

    const records = await this.prisma.breedingRecord.findMany({
      where,
      take: 6,
      orderBy: { breedingDate: 'desc' },
      include: {
        femaleAnimal: { include: { farm: { select: { name: true } } } },
      },
    });

    return records.map((r, i) => {
      const { meta } = parseNotesMetadata(r.notes);
      const isConfirmed = meta.status === 'SUCCESSFUL';
      const d = new Date(r.breedingDate);

      if (isConfirmed) {
        d.setDate(d.getDate() + 283);
        return {
          id: `act-${r.id}`,
          type: 'EXPECTED_CALVING',
          title: `Expected Calving - ${r.femaleAnimal.name || r.femaleAnimal.animalNumber}`,
          animalTag: r.femaleAnimal.animalNumber,
          animalName: r.femaleAnimal.name || r.femaleAnimal.animalNumber,
          farmName: r.femaleAnimal.farm.name,
          dueDate: formatDateString(d),
          urgency: 'HIGH',
          details: 'Prepare maternity stall and monitor pre-calving symptoms.',
        };
      } else {
        d.setDate(d.getDate() + (i % 2 === 0 ? 60 : 90));
        return {
          id: `act-${r.id}`,
          type: 'PREGNANCY_CHECK',
          title: `Pregnancy Diagnosis Due - ${r.femaleAnimal.name || r.femaleAnimal.animalNumber}`,
          animalTag: r.femaleAnimal.animalNumber,
          animalName: r.femaleAnimal.name || r.femaleAnimal.animalNumber,
          farmName: r.femaleAnimal.farm.name,
          dueDate: formatDateString(d),
          urgency: 'MEDIUM',
          details: 'Ultrasonography or rectal palpation scheduled.',
        };
      }
    });
  }
  async getAnalyticsData(userId: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const where: Prisma.BreedingRecordWhereInput = {};
    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return {
          monthlyTrends: [],
          methodComparison: [],
          pregnancyDistribution: [],
          expectedCalvingsByMonth: [],
        };
      }
      where.femaleAnimal = { farmId: { in: farmIds } };
    }

    const [records, pregnancies] = await Promise.all([
      this.prisma.breedingRecord.findMany({
        where,
        select: { breedingDate: true, breedingMethod: true, notes: true },
      }),
      this.prisma.pregnancy.findMany({
        where: where.femaleAnimal
          ? { animal: { farmId: where.femaleAnimal.farmId } }
          : {},
        select: { status: true, expectedCalvingDate: true, notes: true },
      }),
    ]);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const now = new Date();
    const monthlyTrends: Array<{
      month: string;
      totalServices: number;
      aiServices: number;
      naturalServices: number;
    }> = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const month = d.getMonth();

      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      const inMonth = records.filter(
        (r) => r.breedingDate >= start && r.breedingDate <= end,
      );
      const aiInMonth = inMonth.filter(
        (r) => String(r.breedingMethod) === 'ARTIFICIAL_INSEMINATION',
      ).length;
      const naturalInMonth = inMonth.length - aiInMonth;

      monthlyTrends.push({
        month: mLabel,
        totalServices: inMonth.length,
        aiServices: aiInMonth,
        naturalServices: naturalInMonth,
      });
    }

    const aiCount = records.filter(
      (r) => String(r.breedingMethod) === 'ARTIFICIAL_INSEMINATION',
    ).length;
    const naturalCount = records.length - aiCount;

    const methodComparison = [
      {
        method: 'Artificial Insemination (AI)',
        count: aiCount,
        color: '#10a37f',
      },
      {
        method: 'Natural Paddock Breeding',
        count: naturalCount,
        color: '#0ea5e9',
      },
    ];

    const confirmedCount = pregnancies.filter(
      (p) => String(p.status) === 'CONFIRMED',
    ).length;
    const pendingCount = pregnancies.filter(
      (p) => String(p.status) === 'PENDING',
    ).length;
    const recheckCount = pregnancies.filter((p) => {
      const { meta } = parseNotesMetadata(p.notes);
      return meta.pregnancyStatus === 'RECHECK_REQUIRED';
    }).length;
    const openCount = pregnancies.filter((p) => {
      const { meta } = parseNotesMetadata(p.notes);
      return (
        meta.pregnancyStatus === 'NOT_PREGNANT' ||
        meta.pregnancyStatus === 'PREGNANCY_LOST' ||
        String(p.status) === 'FAILED'
      );
    }).length;

    const pregnancyDistribution = [
      {
        status: 'Confirmed Pregnant',
        count: confirmedCount,
        color: '#10a37f',
      },
      {
        status: 'Pending PD Check',
        count: pendingCount,
        color: '#f59e0b',
      },
      { status: 'Recheck Required', count: recheckCount, color: '#8b5cf6' },
      { status: 'Open / Not Pregnant', count: openCount, color: '#dc2626' },
    ];

    const expectedCalvingsByMonth: Array<{
      month: string;
      expectedCount: number;
    }> = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mLabel = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const month = d.getMonth();

      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      const countInMonth = pregnancies.filter(
        (p) =>
          String(p.status) === 'CONFIRMED' &&
          p.expectedCalvingDate >= start &&
          p.expectedCalvingDate <= end,
      ).length;

      expectedCalvingsByMonth.push({
        month: mLabel,
        expectedCount: countInMonth,
      });
    }

    return {
      monthlyTrends,
      methodComparison,
      pregnancyDistribution,
      expectedCalvingsByMonth,
    };
  }
  async getEligibleFemaleAnimals(userId: string, targetFarmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const where: Prisma.AnimalWhereInput = {
      gender: 'FEMALE',
      deletedAt: null,
      status: 'ACTIVE',
    };

    if (farmIds !== undefined) {
      if (farmIds.length === 0) return [];
      where.farmId =
        targetFarmId && farmIds.includes(targetFarmId)
          ? targetFarmId
          : { in: farmIds };
    } else if (targetFarmId) {
      where.farmId = targetFarmId;
    }

    const animals = await this.prisma.animal.findMany({
      where,
      select: {
        id: true,
        animalNumber: true,
        name: true,
        breed: true,
        dateOfBirth: true,
        farmId: true,
        farm: { select: { name: true } },
      },
      orderBy: { animalNumber: 'asc' },
      take: 100,
    });

    return animals.map((a) => ({
      id: a.id,
      tag: a.animalNumber,
      name: a.name || a.animalNumber,
      breed: a.breed || 'Friesian / Jersey',
      dob: a.dateOfBirth ? formatDateString(a.dateOfBirth) : '2021-01-01',
      farmId: a.farmId,
      farmName: a.farm.name,
      reproductiveStatus: 'Eligible for Service',
    }));
  }
  async getAvailableBulls(userId: string, targetFarmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      [],
    );
    const where: Prisma.AnimalWhereInput = {
      gender: 'MALE',
      deletedAt: null,
      status: 'ACTIVE',
    };

    if (farmIds !== undefined) {
      if (farmIds.length === 0) return [];
      where.farmId =
        targetFarmId && farmIds.includes(targetFarmId)
          ? targetFarmId
          : { in: farmIds };
    } else if (targetFarmId) {
      where.farmId = targetFarmId;
    }

    const bulls = await this.prisma.animal.findMany({
      where,
      select: {
        id: true,
        animalNumber: true,
        name: true,
        breed: true,
        farmId: true,
        farm: { select: { name: true } },
      },
      take: 50,
    });

    if (bulls.length === 0) {
      return [];
    }

    return bulls.map((b) => ({
      id: b.id,
      tag: b.animalNumber,
      name: b.name || b.animalNumber,
      breed: b.breed || 'Sire Bull',
      farmId: b.farmId,
      farmName: b.farm.name,
      source: 'On-Farm / Registered Sire',
    }));
  }

  getSemenInventory() {
    return [];
  }
}
