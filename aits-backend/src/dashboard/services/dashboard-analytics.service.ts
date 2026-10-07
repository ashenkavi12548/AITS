import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AnimalStatus,
  Prisma,
  MilkingSession,
  PregnancyStatus,
  BreedingMethod,
  DailyActivityType,
  ActivityStatus,
  FarmTransferStatus,
} from '@prisma/client';
import { ReportFilterDto } from '../dto/report-query.dto';
import { ChartDataPoint, ReportSummaryItem } from '../types/dashboard.types';
import { DashboardHelpersService } from './dashboard-helpers.service';

@Injectable()
export class DashboardAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: DashboardHelpersService,
  ) {}

  // ===========================================================================
  // 1. OVERVIEW ANALYTICS (Executive Operational & Herd Inventory Summary)
  // ===========================================================================
  async getOverviewAnalytics(filters: ReportFilterDto, userId?: string) {
    const { start, end, prevStart, prevEnd, days } =
      this.helpers.parseDateRange(filters.startDate, filters.endDate);
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(
      userId,
      filters.farmId,
      ['dashboard:view', 'reports:read'],
      false, // requireAll
    );
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, filters);

    // 1. Livestock Totals
    const totalAnimals = await this.prisma.animal.count({
      where: animalFilter,
    });
    const activeAnimals = await this.prisma.animal.count({
      where: { ...animalFilter, status: AnimalStatus.ACTIVE },
    });
    const prevTotalAnimals = await this.prisma.animal.count({
      where: { ...animalFilter, createdAt: { lte: prevEnd } },
    });

    // 2. Milk Production within Date Range
    const milkFilter: Prisma.MilkProductionWhereInput = {
      productionDate: { gte: start, lte: end },
      animal: animalFilter,
    };
    const prevMilkFilter: Prisma.MilkProductionWhereInput = {
      productionDate: { gte: prevStart, lte: prevEnd },
      animal: animalFilter,
    };

    const [curMilkAgg, prevMilkAgg] = await Promise.all([
      this.prisma.milkProduction.aggregate({
        _sum: { quantityLiters: true },
        where: milkFilter,
      }),
      this.prisma.milkProduction.aggregate({
        _sum: { quantityLiters: true },
        where: prevMilkFilter,
      }),
    ]);

    const totalMilk = Number((curMilkAgg._sum.quantityLiters ?? 0).toFixed(1));
    const prevMilk = Number((prevMilkAgg._sum.quantityLiters ?? 0).toFixed(1));

    // Average milk per producing cow per day
    const [producingCowsCount, prevProducingCowsCount] = await Promise.all([
      this.prisma.milkProduction
        .groupBy({
          by: ['animalId'],
          where: milkFilter,
        })
        .then((res) => res.length),
      this.prisma.milkProduction
        .groupBy({
          by: ['animalId'],
          where: prevMilkFilter,
        })
        .then((res) => res.length),
    ]);

    const avgMilkPerAnimal =
      producingCowsCount > 0
        ? Number((totalMilk / (producingCowsCount * days)).toFixed(1))
        : 0;

    // 3. Clinical Health Cases (Current animals requiring care)
    const activeHealthCases = await this.prisma.healthCase.count({
      where: {
        animal: animalFilter,
        status: 'OPEN',
      },
    });

    const prevActiveHealthCases = await this.prisma.healthCase.count({
      where: {
        animal: animalFilter,
        status: 'OPEN',
        openedAt: { lte: prevEnd },
      },
    });

    // 4. Confirmed Pregnancies
    const confirmedPregnancies = await this.prisma.pregnancy.count({
      where: {
        animal: animalFilter,
        status: PregnancyStatus.CONFIRMED,
        pregnancyDate: { gte: start, lte: end },
      },
    });

    const prevConfirmedPregnancies = await this.prisma.pregnancy.count({
      where: {
        animal: animalFilter,
        status: PregnancyStatus.CONFIRMED,
        pregnancyDate: { gte: prevStart, lte: prevEnd },
      },
    });

    // 5. Movements & Transfers
    const transferWhere: Prisma.FarmTransferWhereInput = {
      departureDate: { gte: start, lte: end },
      deletedAt: null,
      status: { not: 'CANCELLED' },
      animal: animalFilter,
    };
    const prevTransferWhere: Prisma.FarmTransferWhereInput = {
      departureDate: { gte: prevStart, lte: prevEnd },
      deletedAt: null,
      status: { not: 'CANCELLED' },
      animal: animalFilter,
    };

    const [farmTransfersCount, prevFarmTransfersCount] = await Promise.all([
      this.prisma.farmTransfer.count({ where: transferWhere }),
      this.prisma.farmTransfer.count({ where: prevTransferWhere }),
    ]);

    // 6. Quarantines & Attention Items
    const activeQuarantines = await this.prisma.quarantineRecord.count({
      where: {
        status: 'ACTIVE',
        animal: animalFilter,
      },
    });
    const attentionCount = activeHealthCases + activeQuarantines;

    // Executive Summary Items
    const summary: ReportSummaryItem[] = [
      this.helpers.createSummaryItem({
        id: 'total-animals',
        label: 'Total Registered Livestock',
        value: totalAnimals,
        previousValue: prevTotalAnimals,
        description: 'Livestock registered under tracked facility scope',
        iconName: 'PawPrint',
      }),
      this.helpers.createSummaryItem({
        id: 'active-animals',
        label: 'Active Healthy Animals',
        value: activeAnimals,
        previousValue: prevTotalAnimals,
        description: 'Active, productive livestock in herds',
        iconName: 'Activity',
      }),
      this.helpers.createSummaryItem({
        id: 'total-milk-yield',
        label: 'Total Milk Production',
        value: totalMilk,
        unit: 'L',
        previousValue: prevMilk,
        description: `Aggregate production across ${days} days`,
        iconName: 'Milk',
      }),
      this.helpers.createSummaryItem({
        id: 'avg-milk-animal',
        label: 'Average Milk / Producing Cow',
        value: avgMilkPerAnimal,
        unit: 'L/day',
        previousValue:
          prevMilk > 0 && prevProducingCowsCount > 0
            ? Number((prevMilk / (prevProducingCowsCount * days)).toFixed(1))
            : 0,
        description: 'Mean daily output per lactating cow',
        iconName: 'TrendingUp',
      }),
      this.helpers.createSummaryItem({
        id: 'active-health-cases',
        label: 'Clinical Cases Requiring Care',
        value: activeHealthCases,
        previousValue: prevActiveHealthCases,
        description: 'Animals currently under treatment or observation',
        iconName: 'HeartPulse',
        invertPositive: true,
      }),
      this.helpers.createSummaryItem({
        id: 'confirmed-pregnancies',
        label: 'Confirmed Pregnancies',
        value: confirmedPregnancies,
        previousValue: prevConfirmedPregnancies,
        description: 'Active verified gestations in herds',
        iconName: 'Dna',
      }),
      this.helpers.createSummaryItem({
        id: 'farm-movements',
        label: 'Inter-Farm Transfers',
        value: farmTransfersCount,
        previousValue: prevFarmTransfersCount,
        description: 'Completed and scheduled stock movements',
        iconName: 'Truck',
      }),
      this.helpers.createSummaryItem({
        id: 'attention-items',
        label: 'Attention Alerts',
        value: attentionCount,
        description: 'Active quarantine isolations and open health alerts',
        iconName: 'AlertTriangle',
        invertPositive: true,
      }),
    ];

    // Chart: Animal Status Distribution
    const statusGroups = await this.prisma.animal.groupBy({
      by: ['status'],
      where: animalFilter,
      _count: { id: true },
    });

    const statusColors: Record<string, string> = {
      ACTIVE: '#10B981',
      SICK: '#EF4444',
      QUARANTINED: '#F59E0B',
      TRANSFERRED: '#3B82F6',
      DECEASED: '#6B7280',
      SOLD: '#8B5CF6',
    };

    const animalStatusDistribution: ChartDataPoint[] = statusGroups.map((g) => {
      const cnt = g._count.id;
      const pct =
        totalAnimals > 0 ? Number(((cnt / totalAnimals) * 100).toFixed(1)) : 0;
      return {
        name: g.status,
        label: g.status.replace(/_/g, ' '),
        value: cnt,
        percentage: pct,
        color: statusColors[g.status] || '#10B981',
      };
    });

    // Chart: Real Daily Milk Trend
    const milkRecords = await this.prisma.milkProduction.findMany({
      where: milkFilter,
      select: {
        productionDate: true,
        quantityLiters: true,
      },
      orderBy: { productionDate: 'asc' },
    });

    const prevMilkRecords = await this.prisma.milkProduction.findMany({
      where: prevMilkFilter,
      select: {
        productionDate: true,
        quantityLiters: true,
      },
      orderBy: { productionDate: 'asc' },
    });

    const durationMs = end.getTime() - start.getTime();

    const isWeekly = days > 31;

    function getBucketKey(d: Date): string {
      if (!isWeekly) return d.toISOString().slice(0, 10);
      const weekStart = new Date(d);
      const day = weekStart.getUTCDay();
      const diff = weekStart.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
      weekStart.setUTCDate(diff);
      weekStart.setUTCHours(0, 0, 0, 0);
      return weekStart.toISOString().slice(0, 10);
    }

    const milkByDateMap = new Map<
      string,
      { current: number; previous: number }
    >();

    if (milkRecords.length > 0 || prevMilkRecords.length > 0) {
      if (!isWeekly) {
        // Initialize map with all days in range to ensure continuous axis
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          milkByDateMap.set(d.toISOString().slice(0, 10), {
            current: 0,
            previous: 0,
          });
        }
      } else {
        const iterDate = new Date(getBucketKey(start));
        const endIter = new Date(getBucketKey(end));
        while (iterDate <= endIter) {
          milkByDateMap.set(iterDate.toISOString().slice(0, 10), {
            current: 0,
            previous: 0,
          });
          iterDate.setDate(iterDate.getDate() + 7);
        }
      }
    }

    milkRecords.forEach((r) => {
      const bStr = getBucketKey(r.productionDate);
      if (milkByDateMap.has(bStr)) {
        milkByDateMap.get(bStr)!.current += r.quantityLiters;
      }
    });

    prevMilkRecords.forEach((r) => {
      // Map previous date to current date equivalent
      let equivalentDate: Date;
      if (!isWeekly) {
        equivalentDate = new Date(r.productionDate.getTime() + durationMs);
      } else {
        // Shift exact number of weeks
        const weeksOffset = Math.round(durationMs / (1000 * 60 * 60 * 24 * 7));
        equivalentDate = new Date(r.productionDate);
        equivalentDate.setDate(equivalentDate.getDate() + weeksOffset * 7);
      }

      const bStr = getBucketKey(equivalentDate);
      if (milkByDateMap.has(bStr)) {
        milkByDateMap.get(bStr)!.previous += r.quantityLiters;
      }
    });

    const milkProductionTrend: ChartDataPoint[] = [];
    milkByDateMap.forEach((qty, dateStr) => {
      milkProductionTrend.push({
        name: isWeekly ? `Wk of ${dateStr}` : dateStr,
        date: dateStr,
        value: Number(qty.current.toFixed(1)),
        previousValue: Number(qty.previous.toFixed(1)),
      });
    });

    // Chart: Health Cases by Condition
    const healthCases = await this.prisma.healthCase.findMany({
      where: {
        animal: animalFilter,
        openedAt: { gte: start, lte: end },
        status: 'OPEN',
      },
      select: { title: true },
      take: 200,
    });

    const healthCountMap = new Map<string, number>();
    healthCases.forEach((hc) => {
      const key = hc.title?.trim() || 'General Checkup';
      healthCountMap.set(key, (healthCountMap.get(key) ?? 0) + 1);
    });

    const healthCasesByCategory: ChartDataPoint[] = Array.from(
      healthCountMap.entries(),
    ).map(([cat, count]) => ({
      name: cat,
      category: cat,
      value: count,
    }));

    // Chart: Pregnancy Status Distribution
    const pregnancyGroups = await this.prisma.pregnancy.groupBy({
      by: ['status'],
      where: {
        animal: animalFilter,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      _count: { id: true },
    });

    const pregnancyStatusDistribution: ChartDataPoint[] = pregnancyGroups.map(
      (p) => ({
        name: p.status,
        label: p.status.replace(/_/g, ' '),
        value: p._count.id,
      }),
    );

    // Chart: Real Transfer Trend by Date
    const transfers = await this.prisma.farmTransfer.findMany({
      where: transferWhere,
      select: { departureDate: true },
      orderBy: { departureDate: 'asc' },
    });

    const transferDateMap = new Map<string, number>();

    if (transfers.length > 0) {
      if (!isWeekly) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          transferDateMap.set(d.toISOString().slice(0, 10), 0);
        }
      } else {
        const iterDate = new Date(getBucketKey(start));
        const endIter = new Date(getBucketKey(end));
        while (iterDate <= endIter) {
          transferDateMap.set(iterDate.toISOString().slice(0, 10), 0);
          iterDate.setDate(iterDate.getDate() + 7);
        }
      }
    }

    transfers.forEach((t) => {
      const bStr = getBucketKey(t.departureDate);
      if (transferDateMap.has(bStr)) {
        transferDateMap.set(bStr, transferDateMap.get(bStr)! + 1);
      }
    });

    const farmMovementTrend: ChartDataPoint[] = [];
    transferDateMap.forEach((count, dateStr) => {
      farmMovementTrend.push({
        name: isWeekly ? `Wk of ${dateStr}` : dateStr,
        date: dateStr,
        value: count,
      });
    });

    // Chart: Animals by Farm Facility
    const farms = await this.prisma.farm.findMany({
      where:
        farmIds.length > 0
          ? { id: { in: farmIds }, deletedAt: null }
          : { deletedAt: null },
      include: {
        _count: { select: { animals: { where: { deletedAt: null } } } },
      },
      take: 8,
      orderBy: { name: 'asc' },
    });

    const animalsByFarm: ChartDataPoint[] = farms.map((f) => ({
      name: f.name,
      value: f._count.animals,
    }));

    // Pure Herd Inventory Sample Rows (Concise Executive Summary)
    const activeAnimalsRecords = await this.prisma.animal.findMany({
      where: animalFilter,
      include: { farm: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const overviewSampleRows = activeAnimalsRecords.map((a) => ({
      animalTag: a.animalNumber,
      animalName: a.name || 'Unnamed',
      species: a.species,
      breed: a.breed,
      gender: a.gender,
      status: a.status,
      farmName: a.farm.name,
      registeredDate: a.registrationDate.toISOString().slice(0, 10),
    }));

    return {
      summary,
      animalStatusDistribution,
      milkProductionTrend,
      healthCasesByCategory,
      pregnancyStatusDistribution,
      farmMovementTrend,
      animalsByFarm,
      tableData: {
        data: overviewSampleRows,
        total: totalAnimals,
        page: 1,
        limit: 100,
        totalPages: Math.ceil(totalAnimals / 100) || 1,
      },
      lastUpdated: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  // ===========================================================================
  // 2. MILK PRODUCTION ANALYTICS
  // ===========================================================================
  async getProductionAnalytics(filters: ReportFilterDto, userId?: string) {
    const { start, end, prevStart, prevEnd, days } =
      this.helpers.parseDateRange(filters.startDate, filters.endDate);
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(
      userId,
      filters.farmId,
      ['milk:record', 'reports:read'],
      false, // requireAll
    );
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, filters);

    const milkWhere: Prisma.MilkProductionWhereInput = {
      productionDate: { gte: start, lte: end },
      animal: animalFilter,
    };
    const prevMilkWhere: Prisma.MilkProductionWhereInput = {
      productionDate: { gte: prevStart, lte: prevEnd },
      animal: animalFilter,
    };

    const [currentAgg, prevAgg, totalCowsMilked, totalMilkingRecords] =
      await Promise.all([
        this.prisma.milkProduction.aggregate({
          _sum: { quantityLiters: true },
          _avg: { quantityLiters: true },
          where: milkWhere,
        }),
        this.prisma.milkProduction.aggregate({
          _sum: { quantityLiters: true },
          where: prevMilkWhere,
        }),
        this.prisma.milkProduction
          .groupBy({
            by: ['animalId'],
            where: milkWhere,
          })
          .then((res) => res.length),
        this.prisma.milkProduction.count({ where: milkWhere }),
      ]);

    const totalMilk = Number((currentAgg._sum.quantityLiters ?? 0).toFixed(1));
    const prevMilk = Number((prevAgg._sum.quantityLiters ?? 0).toFixed(1));
    const avgYieldPerCow =
      totalCowsMilked > 0
        ? Number((totalMilk / (totalCowsMilked * days)).toFixed(1))
        : 0;

    // Morning vs Evening breakdown
    const sessionAgg = await this.prisma.milkProduction.groupBy({
      by: ['milkingSession'],
      where: milkWhere,
      _sum: { quantityLiters: true },
    });

    let morningMilk = 0;
    let eveningMilk = 0;
    sessionAgg.forEach((s) => {
      const vol = Number((s._sum.quantityLiters ?? 0).toFixed(1));
      if (s.milkingSession === MilkingSession.MORNING) morningMilk = vol;
      else if (s.milkingSession === MilkingSession.EVENING) eveningMilk = vol;
    });

    // Top Producing Animal
    const topProducingGroup = await this.prisma.milkProduction.groupBy({
      by: ['animalId'],
      where: milkWhere,
      _sum: { quantityLiters: true },
      orderBy: { _sum: { quantityLiters: 'desc' } },
      take: 10,
    });

    let topProducerDisplay = 'N/A';
    if (topProducingGroup.length > 0) {
      const topAnimal = await this.prisma.animal.findUnique({
        where: { id: topProducingGroup[0].animalId },
        select: { animalNumber: true, name: true },
      });
      const topYield = Number(
        (topProducingGroup[0]._sum.quantityLiters ?? 0).toFixed(1),
      );
      topProducerDisplay = topAnimal
        ? `${topAnimal.animalNumber} (${topYield} L)`
        : `${topYield} L`;
    }

    // Real Quality Compliance Rate from database
    const qualityGroups = await this.prisma.milkProduction.groupBy({
      by: ['milkQuality'],
      where: milkWhere,
      _count: { id: true },
      _sum: { quantityLiters: true },
    });

    let compliantCount = 0;
    let totalQualityCount = 0;
    const qualityColors: Record<string, string> = {
      EXCELLENT: '#10B981',
      GOOD: '#3B82F6',
      FAIR: '#F59E0B',
      REJECTED: '#EF4444',
    };

    const qualityDistribution: ChartDataPoint[] = qualityGroups.map((q) => {
      const quality = q.milkQuality || 'GOOD';
      const count = q._count.id;
      totalQualityCount += count;
      if (quality === 'EXCELLENT' || quality === 'GOOD') {
        compliantCount += count;
      }
      return {
        name: quality,
        label: quality.charAt(0).toUpperCase() + quality.slice(1).toLowerCase(),
        value: Number((q._sum.quantityLiters ?? 0).toFixed(1)),
        count,
        color: qualityColors[quality] || '#3B82F6',
      };
    });

    const qualityComplianceRate =
      totalQualityCount > 0
        ? Math.round((compliantCount / totalQualityCount) * 100)
        : 100;

    const summary: ReportSummaryItem[] = [
      this.helpers.createSummaryItem({
        id: 'total-milk-yield',
        label: 'Total Milk Production',
        value: totalMilk,
        unit: 'L',
        previousValue: prevMilk,
        description: 'Cumulative volume produced across date window',
        iconName: 'Milk',
      }),
      this.helpers.createSummaryItem({
        id: 'avg-daily-yield-cow',
        label: 'Average Daily Yield / Cow',
        value: avgYieldPerCow,
        unit: 'L/day',
        description: 'Mean yield per producing cow per day',
        iconName: 'Gauge',
      }),
      this.helpers.createSummaryItem({
        id: 'top-producing-cow',
        label: 'Top Producing Animal',
        value: topProducerDisplay,
        description: 'Peak production volume in period',
        iconName: 'Trophy',
      }),
      this.helpers.createSummaryItem({
        id: 'quality-compliance-rate',
        label: 'Quality Compliance Rate',
        value: qualityComplianceRate,
        unit: '%',
        description: 'Proportion of batches meeting Grade A / Good quality',
        iconName: 'Award',
      }),
      this.helpers.createSummaryItem({
        id: 'active-milking-cows',
        label: 'Active Milking Cows',
        value: totalCowsMilked,
        description: 'Unique cows milked in the period',
        iconName: 'Users',
      }),
      this.helpers.createSummaryItem({
        id: 'total-milking-sessions',
        label: 'Total Sessions Recorded',
        value: totalMilkingRecords,
        description: 'Logged milking shifts',
        iconName: 'CheckCircle',
      }),
    ];

    // Real Daily Yield Trend
    const dailyRecords = await this.prisma.milkProduction.findMany({
      where: milkWhere,
      select: {
        productionDate: true,
        milkingSession: true,
        quantityLiters: true,
      },
      orderBy: { productionDate: 'asc' },
    });

    const dayMap = new Map<string, { morning: number; evening: number }>();
    dailyRecords.forEach((r) => {
      const dStr = r.productionDate.toISOString().slice(0, 10);
      const existing = dayMap.get(dStr) || { morning: 0, evening: 0 };
      if (r.milkingSession === MilkingSession.MORNING) {
        existing.morning += r.quantityLiters;
      } else {
        existing.evening += r.quantityLiters;
      }
      dayMap.set(dStr, existing);
    });

    const dailyTrend: ChartDataPoint[] = [];
    dayMap.forEach((v, dStr) => {
      dailyTrend.push({
        name: dStr,
        date: dStr,
        morning: Number(v.morning.toFixed(1)),
        evening: Number(v.evening.toFixed(1)),
        total: Number((v.morning + v.evening).toFixed(1)),
      });
    });

    // Morning vs Evening Chart
    const morningVsEvening: ChartDataPoint[] = [
      { name: 'Morning', value: morningMilk, color: '#0EA5E9' },
      { name: 'Evening', value: eveningMilk, color: '#3B82F6' },
    ];

    // Top Producing Animals
    const topAnimalsDetails: ChartDataPoint[] = await Promise.all(
      topProducingGroup.map(async (item) => {
        const a = await this.prisma.animal.findUnique({
          where: { id: item.animalId },
          select: { animalNumber: true, name: true },
        });
        return {
          name: a ? `${a.animalNumber} (${a.name || 'Unnamed'})` : 'Animal',
          value: Number((item._sum.quantityLiters ?? 0).toFixed(1)),
        };
      }),
    );

    // Production by Farm
    const farmMilkGroups = await this.prisma.milkProduction.groupBy({
      by: ['farmId'],
      where: milkWhere,
      _sum: { quantityLiters: true },
      orderBy: { _sum: { quantityLiters: 'desc' } },
      take: 6,
    });

    const productionByFarm: ChartDataPoint[] = await Promise.all(
      farmMilkGroups.map(async (g) => {
        const farm = await this.prisma.farm.findUnique({
          where: { id: g.farmId },
          select: { name: true },
        });
        return {
          name: farm?.name || 'Farm',
          value: Number((g._sum.quantityLiters ?? 0).toFixed(1)),
        };
      }),
    );

    // Table Data with Search & Pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(500, filters.limit || 10));
    const skip = (page - 1) * limit;

    const tableWhere: Prisma.MilkProductionWhereInput = { ...milkWhere };

    if (filters.searchQuery) {
      const q = filters.searchQuery.trim();
      tableWhere.OR = [
        { animal: { animalNumber: { contains: q, mode: 'insensitive' } } },
        { animal: { name: { contains: q, mode: 'insensitive' } } },
        { farm: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [tableTotal, tableRecords] = await Promise.all([
      this.prisma.milkProduction.count({ where: tableWhere }),
      this.prisma.milkProduction.findMany({
        where: tableWhere,
        include: {
          animal: { select: { animalNumber: true, name: true } },
          farm: { select: { name: true } },
          recordedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { productionDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const tableRows = tableRecords.map((r) => ({
      id: r.id,
      date: r.productionDate.toISOString().slice(0, 10),
      animalTag: r.animal.animalNumber,
      animalName: r.animal.name || 'Unnamed',
      farmName: r.farm.name,
      morningYield:
        r.milkingSession === MilkingSession.MORNING ? r.quantityLiters : 0,
      eveningYield:
        r.milkingSession === MilkingSession.EVENING ? r.quantityLiters : 0,
      totalYield: r.quantityLiters,
      qualityStatus:
        (r.milkQuality as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REJECTED') || 'GOOD',
      recordedBy: `${r.recordedBy.firstName} ${r.recordedBy.lastName}`,
    }));

    return {
      summary,
      dailyTrend,
      morningVsEvening,
      topProducingAnimals: topAnimalsDetails,
      productionByFarm,
      qualityDistribution,
      tableData: {
        data: tableRows,
        total: tableTotal,
        page,
        limit,
        totalPages: Math.ceil(tableTotal / limit) || 1,
      },
    };
  }

  // ===========================================================================
  // 3. ANIMAL HEALTH & CLINICAL SURVEILLANCE
  // ===========================================================================
  async getHealthAnalytics(filters: ReportFilterDto, userId?: string) {
    const { start, end, prevStart, prevEnd } = this.helpers.parseDateRange(
      filters.startDate,
      filters.endDate,
    );
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(
      userId,
      filters.farmId,
      ['animal:read', 'health:record', 'reports:read'],
      false, // requireAll
    );
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, filters);

    const healthWhere: Prisma.HealthRecordWhereInput = {
      recordDate: { gte: start, lte: end },
      animal: animalFilter,
    };
    if (filters.diagnosis && filters.diagnosis !== 'All Diagnoses') {
      healthWhere.diagnosis = {
        contains: filters.diagnosis,
        mode: 'insensitive',
      };
    }
    const prevHealthWhere: Prisma.HealthRecordWhereInput = {
      recordDate: { gte: prevStart, lte: prevEnd },
      animal: animalFilter,
    };

    const [
      totalCases,
      prevTotalCases,
      activeCases,
      recoveredCases,
      activeTreatments,
      activeQuarantines,
    ] = await Promise.all([
      this.prisma.healthRecord.count({ where: healthWhere }),
      this.prisma.healthRecord.count({ where: prevHealthWhere }),
      this.prisma.healthRecord.count({
        where: {
          ...healthWhere,
          healthStatus: { in: ['SICK', 'UNDER_TREATMENT'] },
        },
      }),
      this.prisma.healthRecord.count({
        where: { ...healthWhere, healthStatus: 'RECOVERED' },
      }),
      this.prisma.treatment.count({
        where: {
          status: 'IN_PROGRESS',
          animal: animalFilter,
        },
      }),
      this.prisma.quarantineRecord.count({
        where: { status: 'ACTIVE', animal: animalFilter },
      }),
    ]);

    const recoveryRate =
      totalCases > 0 ? Math.round((recoveredCases / totalCases) * 100) : 100;

    const summary: ReportSummaryItem[] = [
      this.helpers.createSummaryItem({
        id: 'total-health-cases',
        label: 'Total Clinical Cases',
        value: totalCases,
        previousValue: prevTotalCases,
        description: 'All clinical health interventions documented',
        iconName: 'FileText',
        invertPositive: true,
      }),
      this.helpers.createSummaryItem({
        id: 'active-cases',
        label: 'Active Clinical Cases',
        value: activeCases,
        description: 'Animals currently sick or requiring medical care',
        iconName: 'AlertCircle',
        invertPositive: true,
      }),
      this.helpers.createSummaryItem({
        id: 'recovered-animals',
        label: 'Recovered Cases',
        value: recoveredCases,
        description: 'Resolved cases with full clinical recovery',
        iconName: 'CheckCircle2',
      }),
      this.helpers.createSummaryItem({
        id: 'recovery-rate',
        label: 'Clinical Recovery Rate',
        value: recoveryRate,
        unit: '%',
        description: 'Proportion of documented cases successfully resolved',
        iconName: 'HeartHandshake',
      }),
      this.helpers.createSummaryItem({
        id: 'animals-under-treatment',
        label: 'Animals Under Active Treatment',
        value: activeTreatments,
        description: 'Active antibiotic or pharmaceutical courses',
        iconName: 'Syringe',
        invertPositive: true,
      }),
      this.helpers.createSummaryItem({
        id: 'quarantined-animals',
        label: 'Quarantined Animals',
        value: activeQuarantines,
        description: 'Isolated in designated biosecurity facilities',
        iconName: 'ShieldAlert',
        invertPositive: true,
      }),
    ];

    // Cases Over Time from real database records
    const healthRecords = await this.prisma.healthRecord.findMany({
      where: healthWhere,
      select: {
        recordDate: true,
        diagnosis: true,
        severity: true,
        healthStatus: true,
      },
      orderBy: { recordDate: 'asc' },
    });

    const casesByDateMap = new Map<string, number>();
    healthRecords.forEach((r) => {
      const d = r.recordDate.toISOString().slice(0, 10);
      casesByDateMap.set(d, (casesByDateMap.get(d) ?? 0) + 1);
    });

    const casesOverTime: ChartDataPoint[] = Array.from(
      casesByDateMap.entries(),
    ).map(([date, count]) => ({
      name: date,
      date,
      value: count,
    }));

    // Real Diagnoses Distribution
    const diagnosisMap = new Map<string, number>();
    healthRecords.forEach((r) => {
      const diag = r.diagnosis?.trim() || 'General Clinical Exam';
      diagnosisMap.set(diag, (diagnosisMap.get(diag) ?? 0) + 1);
    });

    const casesByDiagnosis: ChartDataPoint[] = Array.from(
      diagnosisMap.entries(),
    )
      .map(([d, count]) => ({
        name: d,
        value: count,
      }))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      .slice(0, 8);

    // Real Severity Distribution
    const severityMap = new Map<string, number>();
    healthRecords.forEach((r) => {
      const sev = r.severity || 'LOW';
      severityMap.set(sev, (severityMap.get(sev) ?? 0) + 1);
    });

    const severityColors: Record<string, string> = {
      LOW: '#10B981',
      MEDIUM: '#F59E0B',
      HIGH: '#F97316',
      CRITICAL: '#EF4444',
    };

    const treatmentStatusDistribution: ChartDataPoint[] = Array.from(
      severityMap.entries(),
    ).map(([sev, count]) => ({
      name: sev,
      value: count,
      color: severityColors[sev] || '#10B981',
    }));

    // Real Treatment Outcomes from Treatment Table
    const treatmentOutcomeGroups = await this.prisma.treatment.groupBy({
      by: ['status'],
      where: { animal: animalFilter },
      _count: { id: true },
    });

    const outcomeColors: Record<string, string> = {
      COMPLETED: '#10B981',
      IN_PROGRESS: '#3B82F6',
      CANCELLED: '#6B7280',
    };

    const treatmentOutcomes: ChartDataPoint[] = treatmentOutcomeGroups.map(
      (t) => ({
        name: t.status.replace(/_/g, ' '),
        value: t._count.id,
        color: outcomeColors[t.status] || '#10B981',
      }),
    );

    // Table Data
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(500, filters.limit || 10));
    const skip = (page - 1) * limit;

    const tableWhere: Prisma.HealthRecordWhereInput = { ...healthWhere };

    if (filters.searchQuery) {
      const q = filters.searchQuery.trim();
      tableWhere.OR = [
        { animal: { animalNumber: { contains: q, mode: 'insensitive' } } },
        { animal: { name: { contains: q, mode: 'insensitive' } } },
        { diagnosis: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [tableTotal, rawRecords] = await Promise.all([
      this.prisma.healthRecord.count({ where: tableWhere }),
      this.prisma.healthRecord.findMany({
        where: tableWhere,
        include: {
          animal: {
            select: {
              animalNumber: true,
              name: true,
              farm: { select: { name: true } },
            },
          },
          recordedBy: { select: { firstName: true, lastName: true } },
          treatments: {
            select: {
              treatmentName: true,
              status: true,
              startDate: true,
              endDate: true,
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { recordDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const tableRows = rawRecords.map((r) => {
      const activeTreatment = r.treatments?.[0];
      return {
        id: r.id,
        animalTag: r.animal.animalNumber,
        animalName: r.animal.name || 'Unnamed',
        farmName: r.animal.farm?.name || 'Accredited Facility',
        diagnosis: r.diagnosis || 'Clinical Checkup',
        caseDate: r.recordDate.toISOString().slice(0, 10),
        severity:
          (r.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'LOW',
        treatmentStatus:
          r.healthStatus === 'RECOVERED'
            ? ('RECOVERED' as const)
            : ('UNDER_TREATMENT' as const),
        treatment: activeTreatment?.treatmentName || 'Clinical Care',
        treatmentStartDate: activeTreatment?.startDate
          ? activeTreatment.startDate.toISOString().slice(0, 10)
          : undefined,
        treatmentEndDate: activeTreatment?.endDate
          ? activeTreatment.endDate.toISOString().slice(0, 10)
          : undefined,
        veterinarian: `Dr. ${r.recordedBy.firstName} ${r.recordedBy.lastName}`,
        clinicalRemarks: r.notes || r.symptoms || '',
        outcome: r.healthStatus === 'RECOVERED' ? 'Resolved' : 'Under Care',
      };
    });

    return {
      summary,
      casesOverTime,
      casesByDiagnosis,
      treatmentStatusDistribution,
      treatmentOutcomes,
      tableData: {
        data: tableRows,
        total: tableTotal,
        page,
        limit,
        totalPages: Math.ceil(tableTotal / limit) || 1,
      },
    };
  }

  // ===========================================================================
  // 4. FEED UTILIZATION & NUTRITION INTAKE LEDGER (IMPROVED)
  // ===========================================================================
  async getFeedingAnalytics(filters: ReportFilterDto, userId?: string) {
    const { start, end, prevStart, prevEnd, days } =
      this.helpers.parseDateRange(filters.startDate, filters.endDate);
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(
      userId,
      filters.farmId,
      ['feeding:record', 'reports:read'],
      false, // requireAll
    );
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, filters);

    // 1. Query real feeding records from DailyActivityLog (activityType: FEEDING)
    const dailyActivityWhere: Prisma.DailyActivityLogWhereInput = {
      activityType: DailyActivityType.FEEDING,
      activityDate: { gte: start, lte: end },
      deletedAt: null,
      animal: animalFilter,
    };
    const prevDailyActivityWhere: Prisma.DailyActivityLogWhereInput = {
      activityType: DailyActivityType.FEEDING,
      activityDate: { gte: prevStart, lte: prevEnd },
      deletedAt: null,
      animal: animalFilter,
    };

    // 2. Also query FeedingRecord table (if legacy feeding logged)
    const feedingRecordWhere: Prisma.FeedingRecordWhereInput = {
      fedAt: { gte: start, lte: end },
      animal: animalFilter,
    };
    const prevFeedingRecordWhere: Prisma.FeedingRecordWhereInput = {
      fedAt: { gte: prevStart, lte: prevEnd },
      animal: animalFilter,
    };

    const [
      activityFeedingAgg,
      prevActivityFeedingAgg,
      activityCount,
      feedingRecordAgg,
      prevFeedingRecordAgg,
      feedingRecordCount,
      totalAnimals,
    ] = await Promise.all([
      this.prisma.dailyActivityLog.aggregate({
        _sum: { quantity: true },
        where: dailyActivityWhere,
      }),
      this.prisma.dailyActivityLog.aggregate({
        _sum: { quantity: true },
        where: prevDailyActivityWhere,
      }),
      this.prisma.dailyActivityLog.count({ where: dailyActivityWhere }),
      this.prisma.feedingRecord.aggregate({
        _sum: { quantity: true },
        where: feedingRecordWhere,
      }),
      this.prisma.feedingRecord.aggregate({
        _sum: { quantity: true },
        where: prevFeedingRecordWhere,
      }),
      this.prisma.feedingRecord.count({ where: feedingRecordWhere }),
      this.prisma.animal.count({ where: animalFilter }),
    ]);

    const totalFeedKg = Number(
      (
        (activityFeedingAgg._sum.quantity ?? 0) +
        (feedingRecordAgg._sum.quantity ?? 0)
      ).toFixed(1),
    );
    const prevFeedKg = Number(
      (
        (prevActivityFeedingAgg._sum.quantity ?? 0) +
        (prevFeedingRecordAgg._sum.quantity ?? 0)
      ).toFixed(1),
    );
    const totalRecords = activityCount + feedingRecordCount;

    const avgDailyIntake =
      totalAnimals > 0 && days > 0
        ? Number((totalFeedKg / (totalAnimals * days)).toFixed(1))
        : 0;

    // 3. Correlate with Milk Production in the same period to calculate Herd Feed Efficiency
    const milkAgg = await this.prisma.milkProduction.aggregate({
      _sum: { quantityLiters: true },
      where: {
        productionDate: { gte: start, lte: end },
        animal: animalFilter,
      },
    });
    const totalMilkInPeriod = milkAgg._sum.quantityLiters ?? 0;
    const overallFeedEfficiency =
      totalFeedKg > 0 && totalMilkInPeriod > 0
        ? Number((totalMilkInPeriod / totalFeedKg).toFixed(2))
        : null;

    // 4. Session Adherence Rate calculation
    const completedActivities = await this.prisma.dailyActivityLog.count({
      where: {
        ...dailyActivityWhere,
        status: ActivityStatus.COMPLETED,
      },
    });
    const feedingAdherenceRate =
      totalRecords > 0
        ? Math.round(
            ((completedActivities + feedingRecordCount) / totalRecords) * 100,
          )
        : 100;

    const summary: ReportSummaryItem[] = [
      this.helpers.createSummaryItem({
        id: 'total-feed-consumed',
        label: 'Total Feed Consumed',
        value:
          totalFeedKg >= 1000
            ? Number((totalFeedKg / 1000).toFixed(2))
            : totalFeedKg,
        unit: totalFeedKg >= 1000 ? 'Tons' : 'kg',
        previousValue:
          prevFeedKg >= 1000
            ? Number((prevFeedKg / 1000).toFixed(2))
            : prevFeedKg,
        description: 'Aggregate measured feed intake across herds',
        iconName: 'Wheat',
      }),
      this.helpers.createSummaryItem({
        id: 'avg-daily-feed-intake',
        label: 'Average Daily Feed Intake',
        value: avgDailyIntake,
        unit: 'kg/head/day',
        description: 'Mean dry matter & ration consumption per animal',
        iconName: 'Scale',
      }),
      this.helpers.createSummaryItem({
        id: 'feeding-adherence-rate',
        label: 'Feeding Adherence Rate',
        value: feedingAdherenceRate,
        unit: '%',
        description: 'Proportion of planned nutrition shifts completed',
        iconName: 'CheckCircle2',
      }),
      this.helpers.createSummaryItem({
        id: 'feed-efficiency-ratio',
        label: 'Feed Efficiency Ratio',
        value: overallFeedEfficiency !== null ? overallFeedEfficiency : 'N/A',
        unit: overallFeedEfficiency !== null ? 'L milk / kg feed' : '',
        description: 'Lactation yield output generated per unit of feed',
        iconName: 'Gauge',
      }),
      this.helpers.createSummaryItem({
        id: 'total-feeding-sessions',
        label: 'Total Feeding Records Logged',
        value: totalRecords,
        description: 'Verified nutrition disbursements in database',
        iconName: 'ClipboardList',
      }),
      this.helpers.createSummaryItem({
        id: 'tracked-animals-fed',
        label: 'Active Animals Fed',
        value: totalAnimals,
        description: 'Total headcount under nutritional tracking',
        iconName: 'Users',
      }),
    ];

    // Real Daily Feed Consumption Trend
    const dailyActivities = await this.prisma.dailyActivityLog.findMany({
      where: dailyActivityWhere,
      select: {
        activityDate: true,
        quantity: true,
        session: true,
        feedType: true,
      },
      orderBy: { activityDate: 'asc' },
    });

    const dateFeedMap = new Map<string, number>();
    dailyActivities.forEach((a) => {
      const d = a.activityDate.toISOString().slice(0, 10);
      dateFeedMap.set(d, (dateFeedMap.get(d) ?? 0) + (a.quantity ?? 0));
    });

    const dailyFeedConsumption: ChartDataPoint[] = Array.from(
      dateFeedMap.entries(),
    ).map(([date, qty]) => ({
      name: date,
      date,
      value: Number(qty.toFixed(1)),
    }));

    // Real Feed Consumption by Category / Type
    const categoryMap = new Map<string, number>();
    dailyActivities.forEach((a) => {
      const cat = a.feedType?.trim() || 'General Ration';
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + (a.quantity ?? 0));
    });

    const categoryColors = [
      '#10B981',
      '#3B82F6',
      '#F59E0B',
      '#8B5CF6',
      '#EC4899',
    ];
    const feedConsumptionByType: ChartDataPoint[] = Array.from(
      categoryMap.entries(),
    ).map(([cat, qty], idx) => ({
      name: cat,
      value: Number(qty.toFixed(1)),
      color: categoryColors[idx % categoryColors.length],
    }));

    // Real Session Breakdown (Morning, Afternoon, Evening, Night)
    const sessionMap = new Map<string, number>();
    dailyActivities.forEach((a) => {
      const s = a.session || 'MORNING';
      sessionMap.set(s, (sessionMap.get(s) ?? 0) + (a.quantity ?? 0));
    });

    const morningVsEveningFeeding: ChartDataPoint[] = Array.from(
      sessionMap.entries(),
    ).map(([session, qty]) => ({
      name: session.charAt(0) + session.slice(1).toLowerCase(),
      value: Number(qty.toFixed(1)),
    }));

    // Table Data with Search, Pagination & Milk Correlation
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(500, filters.limit || 10));
    const skip = (page - 1) * limit;

    const tableWhere: Prisma.DailyActivityLogWhereInput = {
      ...dailyActivityWhere,
    };

    if (filters.searchQuery) {
      const q = filters.searchQuery.trim();
      tableWhere.OR = [
        { animal: { animalNumber: { contains: q, mode: 'insensitive' } } },
        { animal: { name: { contains: q, mode: 'insensitive' } } },
        { feedName: { contains: q, mode: 'insensitive' } },
        { feedType: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [tableTotal, rawActivities] = await Promise.all([
      this.prisma.dailyActivityLog.count({ where: tableWhere }),
      this.prisma.dailyActivityLog.findMany({
        where: tableWhere,
        include: {
          animal: {
            select: {
              id: true,
              animalNumber: true,
              name: true,
              farm: { select: { name: true } },
            },
          },
          farm: { select: { name: true } },
          recordedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    // Query milk production records for corresponding animals and dates to calculate Feed Efficiency
    const animalIdsInBatch = rawActivities.map((a) => a.animalId);
    const milkRecordsForBatch = await this.prisma.milkProduction.findMany({
      where: {
        animalId: { in: animalIdsInBatch },
        productionDate: { gte: start, lte: end },
      },
      select: {
        animalId: true,
        productionDate: true,
        quantityLiters: true,
      },
    });

    const animalDateMilkMap = new Map<string, number>();
    milkRecordsForBatch.forEach((m) => {
      const key = `${m.animalId}_${m.productionDate.toISOString().slice(0, 10)}`;
      animalDateMilkMap.set(
        key,
        (animalDateMilkMap.get(key) ?? 0) + m.quantityLiters,
      );
    });

    const tableRows = rawActivities.map((a) => {
      const dateStr = a.activityDate.toISOString().slice(0, 10);
      const milkKey = `${a.animalId}_${dateStr}`;
      const milkLiters = animalDateMilkMap.get(milkKey);
      const milkYield =
        milkLiters !== undefined ? Number(milkLiters.toFixed(1)) : null;

      const actualQty = a.quantity ?? 0;
      const feedEfficiency =
        milkYield !== null && actualQty > 0
          ? Number((milkYield / actualQty).toFixed(2))
          : null;

      return {
        id: a.id,
        date: dateStr,
        animalTag: a.animal.animalNumber,
        animalName: a.animal.name || 'Unnamed',
        farmName: a.farm?.name || a.animal.farm?.name || 'Facility Barn',
        feedingSession: a.session,
        feedCategory: a.feedType || 'Concentrates',
        feedType: a.feedName || a.feedType || 'Ration',
        actualQuantity: actualQty,
        unit: a.unit || 'kg',
        milkYield,
        feedEfficiency,
        status: a.status,
        recordedBy: `${a.recordedBy.firstName} ${a.recordedBy.lastName}`,
        remarks: a.notes || '',
        notes: a.notes || '',
      };
    });

    return {
      summary,
      dailyFeedConsumption,
      feedConsumptionByType,
      morningVsEveningFeeding,
      tableData: {
        data: tableRows,
        total: tableTotal,
        page,
        limit,
        totalPages: Math.ceil(tableTotal / limit) || 1,
      },
    };
  }

  // ===========================================================================
  // 5. BREEDING, AI & CALVING LIFECYCLE
  // ===========================================================================
  async getBreedingAnalytics(filters: ReportFilterDto, userId?: string) {
    const { start, end, prevStart, prevEnd } = this.helpers.parseDateRange(
      filters.startDate,
      filters.endDate,
    );
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(
      userId,
      filters.farmId,
      ['breeding:record', 'reports:read'],
      false, // requireAll
    );
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, filters);

    const breedingWhere: Prisma.BreedingRecordWhereInput = {
      breedingDate: { gte: start, lte: end },
      femaleAnimal: animalFilter,
    };
    if (filters.pregnancyStatus && filters.pregnancyStatus !== 'All Statuses') {
      breedingWhere.pregnancies = {
        some: { status: filters.pregnancyStatus as PregnancyStatus },
      };
    }
    const prevBreedingWhere: Prisma.BreedingRecordWhereInput = {
      breedingDate: { gte: prevStart, lte: prevEnd },
      femaleAnimal: animalFilter,
    };

    const [
      totalServices,
      prevTotalServices,
      confirmedPregnancies,
      pendingChecks,
      completedCalvings,
    ] = await Promise.all([
      this.prisma.breedingRecord.count({ where: breedingWhere }),
      this.prisma.breedingRecord.count({ where: prevBreedingWhere }),
      this.prisma.pregnancy.count({
        where: {
          animal: animalFilter,
          status: PregnancyStatus.CONFIRMED,
          pregnancyDate: { gte: start, lte: end },
        },
      }),
      this.prisma.pregnancy.count({
        where: {
          animal: animalFilter,
          status: PregnancyStatus.PENDING,
          pregnancyDate: { gte: start, lte: end },
        },
      }),
      this.prisma.calvingRecord.count({
        where: {
          mother: animalFilter,
          calvingDate: { gte: start, lte: end },
        },
      }),
    ]);

    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    const expectedCalvings = await this.prisma.pregnancy.count({
      where: {
        animal: animalFilter,
        status: PregnancyStatus.CONFIRMED,
        expectedCalvingDate: { gte: new Date(), lte: next30Days },
      },
    });

    const aiSuccessRate =
      totalServices > 0
        ? Math.round((confirmedPregnancies / totalServices) * 100)
        : 0;

    const summary: ReportSummaryItem[] = [
      this.helpers.createSummaryItem({
        id: 'total-breeding-services',
        label: 'Total Inseminations & Services',
        value: totalServices,
        previousValue: prevTotalServices,
        description: 'Breeding services conducted in date range',
        iconName: 'Dna',
      }),
      this.helpers.createSummaryItem({
        id: 'confirmed-pregnancies',
        label: 'Confirmed Pregnancies',
        value: confirmedPregnancies,
        description: 'Verified positive gestations',
        iconName: 'CheckCircle2',
      }),
      this.helpers.createSummaryItem({
        id: 'ai-success-rate',
        label: 'Conception Success Rate',
        value: aiSuccessRate,
        unit: '%',
        description: 'Confirmed conceptions relative to inseminations',
        iconName: 'Award',
      }),
      this.helpers.createSummaryItem({
        id: 'pending-pregnancy-checks',
        label: 'Pending Ultrasound Checks',
        value: pendingChecks,
        description: 'Scheduled for confirmation check',
        iconName: 'Clock',
      }),
      this.helpers.createSummaryItem({
        id: 'expected-calvings',
        label: 'Calvings Expected (30 Days)',
        value: expectedCalvings,
        description: 'Upcoming calving deliveries within 30 days',
        iconName: 'Baby',
      }),
      this.helpers.createSummaryItem({
        id: 'completed-calvings',
        label: 'Completed Deliveries',
        value: completedCalvings,
        description: 'Calvings registered in database',
        iconName: 'HeartHandshake',
      }),
    ];

    // Real AI vs Natural Service breakdown
    const methodGroups = await this.prisma.breedingRecord.groupBy({
      by: ['breedingMethod'],
      where: breedingWhere,
      _count: { id: true },
    });

    const aiVsNatural: ChartDataPoint[] = methodGroups.map((m) => ({
      name:
        m.breedingMethod === BreedingMethod.ARTIFICIAL_INSEMINATION
          ? 'Artificial Insemination (AI)'
          : 'Natural Bull Mating',
      value: m._count.id,
      color:
        m.breedingMethod === BreedingMethod.ARTIFICIAL_INSEMINATION
          ? '#10B981'
          : '#F59E0B',
    }));

    // Real Pregnancy Status Distribution
    const pregnancyGroups = await this.prisma.pregnancy.groupBy({
      by: ['status'],
      where: { animal: animalFilter },
      _count: { id: true },
    });

    const pregColors: Record<string, string> = {
      CONFIRMED: '#10B981',
      PENDING: '#F59E0B',
      FAILED: '#EF4444',
      COMPLETED: '#3B82F6',
    };

    const pregnancyStatusDistribution: ChartDataPoint[] = pregnancyGroups.map(
      (p) => ({
        name: p.status,
        label: p.status.replace(/_/g, ' '),
        value: p._count.id,
        color: pregColors[p.status] || '#10B981',
      }),
    );

    // Table Data
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(500, filters.limit || 10));
    const skip = (page - 1) * limit;

    const tableWhere: Prisma.BreedingRecordWhereInput = { ...breedingWhere };

    if (filters.searchQuery) {
      const q = filters.searchQuery.trim();
      tableWhere.OR = [
        {
          femaleAnimal: { animalNumber: { contains: q, mode: 'insensitive' } },
        },
        { femaleAnimal: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [tableTotal, rawRecords] = await Promise.all([
      this.prisma.breedingRecord.count({ where: tableWhere }),
      this.prisma.breedingRecord.findMany({
        where: tableWhere,
        include: {
          femaleAnimal: {
            select: {
              animalNumber: true,
              name: true,
              farm: { select: { name: true } },
            },
          },
          maleAnimal: {
            select: { animalNumber: true, name: true, breed: true },
          },
          technician: { select: { firstName: true, lastName: true } },
          pregnancies: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { calvingRecords: { take: 1 } },
          },
        },
        orderBy: { breedingDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const tableRows = rawRecords.map((r) => {
      const preg = r.pregnancies[0];
      const calving = preg?.calvingRecords?.[0];
      let calvingStatus: 'NOT_DUE' | 'EXPECTED_SOON' | 'COMPLETED' | 'FAILED' =
        'NOT_DUE';
      if (calving) {
        calvingStatus = 'COMPLETED';
      } else if (preg?.status === 'CONFIRMED') {
        const now = new Date();
        if (
          preg.expectedCalvingDate &&
          preg.expectedCalvingDate <= next30Days &&
          preg.expectedCalvingDate >= now
        ) {
          calvingStatus = 'EXPECTED_SOON';
        }
      } else if (preg?.status === 'FAILED') {
        calvingStatus = 'FAILED';
      }

      const sireInfo = r.maleAnimal
        ? `${r.maleAnimal.animalNumber} (${r.maleAnimal.breed})`
        : 'Straw Batch AI';

      return {
        id: r.id,
        animalTag: r.femaleAnimal.animalNumber,
        animalName: r.femaleAnimal.name || 'Unnamed',
        farmName: r.femaleAnimal.farm?.name || 'Breeding Station',
        serviceDate: r.breedingDate.toISOString().slice(0, 10),
        breedingMethod: r.breedingMethod,
        technician: `${r.technician.firstName} ${r.technician.lastName}`,
        sireInfo,
        pregnancyStatus: (preg?.status || 'PENDING') as
          'CONFIRMED' | 'PENDING' | 'NEGATIVE' | 'UNKNOWN',
        expectedCalvingDate: preg?.expectedCalvingDate
          ? preg.expectedCalvingDate.toISOString().slice(0, 10)
          : undefined,
        calvingStatus,
        calvingOutcome: calving?.calvingType || calvingStatus,
        notes: r.notes || '',
      };
    });

    return {
      summary,
      aiVsNatural,
      pregnancyStatusDistribution,
      tableData: {
        data: tableRows,
        total: tableTotal,
        page,
        limit,
        totalPages: Math.ceil(tableTotal / limit) || 1,
      },
    };
  }

  // ===========================================================================
  // 6. NATIONAL TRACEABILITY & MOVEMENT MANIFEST (IMPROVED DUAL-SECTION)
  // ===========================================================================
  async getTraceabilityAnalytics(filters: ReportFilterDto, userId?: string) {
    const { start, end, prevStart, prevEnd } = this.helpers.parseDateRange(
      filters.startDate,
      filters.endDate,
    );
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(
      userId,
      filters.farmId,
      ['traceability:read', 'reports:read'],
      false, // requireAll
    );
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, filters);

    // 1. Query Real FarmTransfer Records (Primary Movement Manifest)
    const transferWhere: Prisma.FarmTransferWhereInput = {
      departureDate: { gte: start, lte: end },
      deletedAt: null,
      animal: animalFilter,
    };
    const prevTransferWhere: Prisma.FarmTransferWhereInput = {
      departureDate: { gte: prevStart, lte: prevEnd },
      deletedAt: null,
      animal: animalFilter,
    };

    const [
      totalTransfers,
      prevTotalTransfers,
      inTransitCount,
      completedTransfers,
      scheduledTransfers,
      totalAuditActivities,
    ] = await Promise.all([
      this.prisma.farmTransfer.count({ where: transferWhere }),
      this.prisma.farmTransfer.count({ where: prevTransferWhere }),
      this.prisma.farmTransfer.count({
        where: { ...transferWhere, status: FarmTransferStatus.IN_TRANSIT },
      }),
      this.prisma.farmTransfer.count({
        where: {
          ...transferWhere,
          status: {
            in: [FarmTransferStatus.COMPLETED, FarmTransferStatus.ARRIVED],
          },
        },
      }),
      this.prisma.farmTransfer.count({
        where: { ...transferWhere, status: FarmTransferStatus.SCHEDULED },
      }),
      this.prisma.dailyActivityLog.count({
        where: {
          activityDate: { gte: start, lte: end },
          deletedAt: null,
          animal: animalFilter,
        },
      }),
    ]);

    const summary: ReportSummaryItem[] = [
      this.helpers.createSummaryItem({
        id: 'total-farm-movements',
        label: 'Inter-Farm Transfers Logged',
        value: totalTransfers,
        previousValue: prevTotalTransfers,
        description: 'Verified stock transfers with departure permits',
        iconName: 'Truck',
      }),
      this.helpers.createSummaryItem({
        id: 'in-transit-animals',
        label: 'Live Shipments In-Transit',
        value: inTransitCount,
        description: 'Livestock dispatched currently en-route',
        iconName: 'Navigation',
        invertPositive: inTransitCount > 0,
      }),
      this.helpers.createSummaryItem({
        id: 'completed-arrivals',
        label: 'Verified Arrivals',
        value: completedTransfers,
        description: 'Arrived and checked-in at destination facility',
        iconName: 'CheckCircle',
      }),
      this.helpers.createSummaryItem({
        id: 'scheduled-transfers',
        label: 'Pending Dispatches Scheduled',
        value: scheduledTransfers,
        description: 'Permitted movements awaiting transport dispatch',
        iconName: 'Clock',
      }),
      this.helpers.createSummaryItem({
        id: 'traceability-audit-events',
        label: 'Total Audit Trail Logs',
        value: totalAuditActivities + totalTransfers,
        description: 'Complete verified custody events in timeline',
        iconName: 'ListChecks',
      }),
    ];

    // Real Transfers by Reason
    const reasonGroups = await this.prisma.farmTransfer.groupBy({
      by: ['reason'],
      where: transferWhere,
      _count: { id: true },
    });

    const reasonColors = [
      '#10B981',
      '#3B82F6',
      '#F59E0B',
      '#8B5CF6',
      '#EC4899',
      '#6366F1',
    ];
    const movementReasons: ChartDataPoint[] = reasonGroups.map((r, idx) => ({
      name: r.reason.replace(/_/g, ' '),
      value: r._count.id,
      color: reasonColors[idx % reasonColors.length],
    }));

    // Real Transfer Status Distribution
    const statusGroups = await this.prisma.farmTransfer.groupBy({
      by: ['status'],
      where: transferWhere,
      _count: { id: true },
    });

    const statusColors: Record<string, string> = {
      COMPLETED: '#10B981',
      ARRIVED: '#10B981',
      IN_TRANSIT: '#F59E0B',
      SCHEDULED: '#3B82F6',
      CANCELLED: '#EF4444',
    };

    const statusDistribution: ChartDataPoint[] = statusGroups.map((s) => ({
      name: s.status.replace(/_/g, ' '),
      value: s._count.id,
      color: statusColors[s.status] || '#3B82F6',
    }));

    // Query Movement Manifest Rows
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(500, filters.limit || 10));
    const skip = (page - 1) * limit;

    const [manifestTotal, manifestRecords] = await Promise.all([
      this.prisma.farmTransfer.count({ where: transferWhere }),
      this.prisma.farmTransfer.findMany({
        where: transferWhere,
        include: {
          animal: {
            select: {
              animalNumber: true,
              name: true,
            },
          },
          fromFarm: { select: { name: true } },
          toFarm: { select: { name: true } },
          recordedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { departureDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const manifestRows = manifestRecords.map((m) => {
      const departure =
        `${m.departureDate.toISOString().slice(0, 10)} ${m.departureTime || ''}`.trim();
      let arrival = 'In Transit';
      if (m.actualArrivalDate) {
        arrival =
          `${m.actualArrivalDate.toISOString().slice(0, 10)} ${m.actualArrivalTime || ''}`.trim();
      } else if (m.expectedArrivalDate) {
        arrival = `Est: ${m.expectedArrivalDate.toISOString().slice(0, 10)}`;
      }

      const transport =
        [
          m.vehicleNumber ? `Veh: ${m.vehicleNumber}` : null,
          m.driverName ? `Driver: ${m.driverName}` : null,
        ]
          .filter(Boolean)
          .join(' • ') || 'Standard Livestock Hauler';

      return {
        id: m.id,
        animalTag: m.animal.animalNumber,
        animalName: m.animal.name || 'Unnamed',
        originFarm: m.fromFarm.name,
        destinationFarm: m.toFarm.name,
        departureDateTime: departure,
        arrivalDateTime: arrival,
        movementReason: m.reason.replace(/_/g, ' '),
        transportInfo: transport,
        movementStatus: m.status,
        authorizedBy: `${m.recordedBy.firstName} ${m.recordedBy.lastName}`,
      };
    });

    return {
      summary,
      movementReasons,
      statusDistribution,
      tableData: {
        data: manifestRows,
        total: manifestTotal,
        page,
        limit,
        totalPages: Math.ceil(manifestTotal / limit) || 1,
      },
    };
  }
}
