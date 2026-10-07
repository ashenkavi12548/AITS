import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { MilkingSession, Prisma } from '@prisma/client';
import { parseNotesMetadata } from '../utils/milk-production.utils';

@Injectable()
export class MilkProductionStatsService {
  private readonly logger = new Logger(MilkProductionStatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  /**
   * Fetch KPI summary statistics
   */
  async getSummaryStats(userId: string, targetFarmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:read'],
    );

    const whereBase: Prisma.MilkProductionWhereInput = {};
    if (farmIds.length === 0) {
      return {
        todayTotalLiters: 0,
        morningTotalLiters: 0,
        eveningTotalLiters: 0,
        animalsMilked: 0,
        averagePerAnimal: 0,
        percentageChangeVsYesterday: 0,
      };
    }
    whereBase.farmId =
      targetFarmId && farmIds.includes(targetFarmId)
        ? targetFarmId
        : { in: farmIds };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    const [todayRecords, yesterdayRecords] = await Promise.all([
      this.prisma.milkProduction.findMany({
        where: {
          ...whereBase,
          productionDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        select: {
          animalId: true,
          quantityLiters: true,
          milkingSession: true,
          notes: true,
        },
      }),
      this.prisma.milkProduction.findMany({
        where: {
          ...whereBase,
          productionDate: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
        select: {
          quantityLiters: true,
          notes: true,
        },
      }),
    ]);

    const activeTodayRecords = todayRecords.filter(
      (r) => !parseNotesMetadata(r.notes).meta.isVoided,
    );
    const activeYesterdayRecords = yesterdayRecords.filter(
      (r) => !parseNotesMetadata(r.notes).meta.isVoided,
    );

    const todayTotalLiters = activeTodayRecords.reduce(
      (sum, r) => sum + r.quantityLiters,
      0,
    );
    const morningTotalLiters = activeTodayRecords
      .filter((r) => r.milkingSession === MilkingSession.MORNING)
      .reduce((sum, r) => sum + r.quantityLiters, 0);
    const eveningTotalLiters = activeTodayRecords
      .filter((r) => r.milkingSession === MilkingSession.EVENING)
      .reduce((sum, r) => sum + r.quantityLiters, 0);

    const uniqueAnimalsToday = new Set(
      activeTodayRecords.map((r) => r.animalId),
    ).size;
    const averagePerAnimal =
      uniqueAnimalsToday > 0 ? todayTotalLiters / uniqueAnimalsToday : 0;

    const yesterdayTotal = activeYesterdayRecords.reduce(
      (sum, r) => sum + r.quantityLiters,
      0,
    );
    let percentageChange = 0;
    if (yesterdayTotal > 0) {
      percentageChange =
        ((todayTotalLiters - yesterdayTotal) / yesterdayTotal) * 100;
    } else if (todayTotalLiters > 0) {
      percentageChange = 100;
    }

    return {
      todayTotalLiters: Number(todayTotalLiters.toFixed(1)),
      morningTotalLiters: Number(morningTotalLiters.toFixed(1)),
      eveningTotalLiters: Number(eveningTotalLiters.toFixed(1)),
      animalsMilked: uniqueAnimalsToday,
      averagePerAnimal: Number(averagePerAnimal.toFixed(1)),
      percentageChangeVsYesterday: Number(percentageChange.toFixed(1)),
    };
  }

  /**
   * Fetch Analytics payload for charts
   */
  async getAnalyticsData(userId: string, targetFarmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:read'],
    );

    const whereBase: Prisma.MilkProductionWhereInput = {};
    if (farmIds.length === 0) {
      return {
        dailyTrends: [],
        sessionComparison: [],
        topProducers: [],
        farmShares: [],
      };
    }
    whereBase.farmId =
      targetFarmId && farmIds.includes(targetFarmId)
        ? targetFarmId
        : { in: farmIds };

    // 1. Daily trends for the last 7 days
    const dailyMap = new Map<string, { morning: number; evening: number }>();
    const datesList: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      dailyMap.set(dStr, { morning: 0, evening: 0 });
      datesList.push(dStr);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [recentRecords, allRecords] = await Promise.all([
      this.prisma.milkProduction.findMany({
        where: {
          ...whereBase,
          productionDate: { gte: sevenDaysAgo },
        },
        select: {
          productionDate: true,
          quantityLiters: true,
          milkingSession: true,
          notes: true,
        },
      }),
      this.prisma.milkProduction.findMany({
        where: whereBase,
        select: {
          quantityLiters: true,
          milkingSession: true,
          notes: true,
          farmId: true,
          farm: { select: { name: true } },
          animalId: true,
          animal: {
            select: {
              animalNumber: true,
              name: true,
              farm: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const activeRecentRecords = recentRecords.filter(
      (r) => !parseNotesMetadata(r.notes).meta.isVoided,
    );
    const activeAllRecords = allRecords.filter(
      (r) => !parseNotesMetadata(r.notes).meta.isVoided,
    );

    activeRecentRecords.forEach((r) => {
      const dStr = r.productionDate.toISOString().split('T')[0];
      if (dailyMap.has(dStr)) {
        const item = dailyMap.get(dStr)!;
        if (r.milkingSession === MilkingSession.MORNING) {
          item.morning += r.quantityLiters;
        } else {
          item.evening += r.quantityLiters;
        }
      }
    });

    const dailyTrends = datesList.map((dateStr) => {
      const item = dailyMap.get(dateStr) || { morning: 0, evening: 0 };
      const dateObj = new Date(dateStr);
      const label = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return {
        date: dateStr,
        label,
        morningLiters: Number(item.morning.toFixed(1)),
        eveningLiters: Number(item.evening.toFixed(1)),
        totalLiters: Number((item.morning + item.evening).toFixed(1)),
      };
    });

    // 2. Session breakdown
    const morningSum = activeAllRecords
      .filter((r) => r.milkingSession === MilkingSession.MORNING)
      .reduce((acc, r) => acc + r.quantityLiters, 0);
    const eveningSum = activeAllRecords
      .filter((r) => r.milkingSession === MilkingSession.EVENING)
      .reduce((acc, r) => acc + r.quantityLiters, 0);

    const sessionComparison = [
      {
        session: 'Morning Session',
        liters: Number(morningSum.toFixed(1)),
        color: '#10a37f',
      },
      {
        session: 'Evening Session',
        liters: Number(eveningSum.toFixed(1)),
        color: '#0ea5e9',
      },
    ];

    // 3. Top producing animals
    const animalMap = new Map<
      string,
      { tag: string; name: string; farm: string; total: number; count: number }
    >();

    activeAllRecords.forEach((r) => {
      const existing = animalMap.get(r.animalId) || {
        tag: r.animal?.animalNumber || 'Unknown Tag',
        name: r.animal?.name || r.animal?.animalNumber || 'Unnamed',
        farm: r.animal?.farm?.name || 'Unknown Farm',
        total: 0,
        count: 0,
      };
      existing.total += r.quantityLiters;
      existing.count += 1;
      animalMap.set(r.animalId, existing);
    });

    const topProducers = Array.from(animalMap.entries())
      .map(([id, val]) => ({
        animalId: id,
        animalTag: val.tag,
        animalName: val.name,
        farmName: val.farm,
        totalLiters: Number(val.total.toFixed(1)),
        averagePerSession: Number((val.total / val.count).toFixed(1)),
      }))
      .sort((a, b) => b.totalLiters - a.totalLiters)
      .slice(0, 5);

    // 4. Farm production distribution
    const farmMap = new Map<string, { name: string; liters: number }>();
    let totalLitersAll = 0;

    allRecords.forEach((r) => {
      totalLitersAll += r.quantityLiters;
      const existing = farmMap.get(r.farmId) || {
        name: r.farm?.name || 'Unknown Farm',
        liters: 0,
      };
      existing.liters += r.quantityLiters;
      farmMap.set(r.farmId, existing);
    });

    const palette = ['#10a37f', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899'];
    const farmShares = Array.from(farmMap.entries()).map(
      ([farmId, val], idx) => ({
        farmId,
        farmName: val.name,
        liters: Number(val.liters.toFixed(1)),
        percentage:
          totalLitersAll > 0
            ? Number(((val.liters / totalLitersAll) * 100).toFixed(1))
            : 0,
        color: palette[idx % palette.length],
      }),
    );

    return {
      dailyTrends,
      sessionComparison,
      topProducers,
      farmShares,
    };
  }
}
