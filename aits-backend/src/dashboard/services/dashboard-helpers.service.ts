import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { AnimalStatus, Prisma } from '@prisma/client';
import { ReportFilterDto } from '../dto/report-query.dto';
import { ReportSummaryItem } from '../types/dashboard.types';

@Injectable()
export class DashboardHelpersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helper: Date Range & Comparison Periods
  // ---------------------------------------------------------------------------
  parseDateRange(startDate?: string, endDate?: string) {
    let end = endDate ? new Date(endDate) : new Date();
    if (isNaN(end.getTime())) end = new Date();
    end.setHours(23, 59, 59, 999);

    let start = startDate ? new Date(startDate) : new Date();
    if (isNaN(start.getTime()) || !startDate) {
      start = new Date(end.getTime());
      start.setDate(end.getDate() - 30);
    }
    start.setHours(0, 0, 0, 0);

    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const durationMs = Math.max(1, end.getTime() - start.getTime());
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const days = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));

    return { start, end, prevStart, prevEnd, days };
  }

  // ---------------------------------------------------------------------------
  // Helper: Authorization & Farm Scoping
  // ---------------------------------------------------------------------------
  async resolveAuthorizedFarms(
    userId?: string,
    requestedFarmId?: string,
    requiredPermissions: string[] = ['dashboard:view'],
    requireAll: boolean = false,
  ): Promise<{ farmIds: string[] }> {
    if (!userId) {
      return { farmIds: [] };
    }

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      requiredPermissions,
      requireAll,
    );

    if (requestedFarmId && requestedFarmId !== 'ALL') {
      if (farmIds.includes(requestedFarmId)) {
        return { farmIds: [requestedFarmId] };
      }
      return { farmIds: [] };
    }

    return { farmIds };
  }

  // ---------------------------------------------------------------------------
  // Helper: Format Summary Item with % Delta
  // ---------------------------------------------------------------------------
  createSummaryItem(params: {
    id: string;
    label: string;
    value: number | string;
    unit?: string;
    previousValue?: number | string;
    description: string;
    iconName?: string;
    invertPositive?: boolean;
  }): ReportSummaryItem {
    const curVal = typeof params.value === 'number' ? params.value : 0;
    const prevVal =
      typeof params.previousValue === 'number' ? params.previousValue : 0;

    let changePercentage: number | null = null;
    let changeDirection: 'increase' | 'decrease' | 'neutral' = 'neutral';

    if (params.previousValue !== undefined) {
      if (prevVal > 0) {
        changePercentage = Number(
          (((curVal - prevVal) / prevVal) * 100).toFixed(1),
        );
      } else if (curVal > 0) {
        changePercentage = 100;
      } else {
        changePercentage = 0;
      }

      if (curVal > prevVal) changeDirection = 'increase';
      else if (curVal < prevVal) changeDirection = 'decrease';
      else changeDirection = 'neutral';
    }

    const isPositive = params.invertPositive
      ? changeDirection === 'decrease'
      : changeDirection === 'increase';

    return {
      id: params.id,
      label: params.label,
      value: params.value,
      unit: params.unit,
      previousValue: params.previousValue,
      changePercentage,
      changeDirection,
      isPositive,
      description: params.description,
      iconName: params.iconName,
    };
  }

  // ---------------------------------------------------------------------------
  // Helper: Animal Query Scoper
  // ---------------------------------------------------------------------------
  buildAnimalFilter(
    authorizedFarmIds: string[],
    filters: ReportFilterDto,
  ): Prisma.AnimalWhereInput {
    const where: Prisma.AnimalWhereInput = {
      deletedAt: null,
    };

    if (authorizedFarmIds.length > 0) {
      where.farmId = { in: authorizedFarmIds };
    }

    if (
      filters.breed &&
      filters.breed !== 'All Breeds' &&
      filters.breed !== 'ALL'
    ) {
      where.breed = { contains: filters.breed, mode: 'insensitive' };
    }

    if (
      filters.gender &&
      filters.gender !== 'All' &&
      filters.gender !== 'ALL'
    ) {
      const g = filters.gender.toUpperCase();
      if (g === 'MALE' || g === 'FEMALE') {
        where.gender = g;
      }
    }

    if (
      filters.animalStatus &&
      filters.animalStatus !== 'All Statuses' &&
      filters.animalStatus !== 'ALL'
    ) {
      where.status = filters.animalStatus as AnimalStatus;
    }

    if (filters.animalId) {
      where.id = filters.animalId;
    }

    return where;
  }
}
