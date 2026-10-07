import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import {
  DailyActivityType,
  ActivitySession,
  ActivityStatus,
  Prisma,
} from '@prisma/client';
import { CreateDailyActivityDto } from '../dto/create-daily-activity.dto';
import { activityInclude, shapeActivity } from './traceability-shapes';

@Injectable()
export class DailyActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  async getDailyActivities(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      farmId?: string;
      animalId?: string;
      activityType?: DailyActivityType | 'ALL';
      session?: ActivitySession | 'ALL';
      status?: ActivityStatus | 'ALL';
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 50);
    const skip = (page - 1) * limit;

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['traceability:read'],
    );

    const where: Prisma.DailyActivityLogWhereInput = { deletedAt: null };

    if (farmIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    where.farmId =
      filters.farmId && farmIds.includes(filters.farmId)
        ? filters.farmId
        : { in: farmIds };

    if (filters.animalId && filters.animalId !== 'ALL')
      where.animalId = filters.animalId;
    if (filters.activityType && filters.activityType !== 'ALL')
      where.activityType = filters.activityType;
    if (filters.session && filters.session !== 'ALL')
      where.session = filters.session;
    if (filters.status && filters.status !== 'ALL')
      where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.activityDate = {};
      if (filters.startDate)
        where.activityDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.activityDate.lte = new Date(filters.endDate);
    }

    if (filters.search) {
      const q = filters.search;
      where.OR = [
        { animal: { animalNumber: { contains: q, mode: 'insensitive' } } },
        { animal: { name: { contains: q, mode: 'insensitive' } } },
        { notes: { contains: q, mode: 'insensitive' } },
        { recordedBy: { firstName: { contains: q, mode: 'insensitive' } } },
        { recordedBy: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const orderBy: Prisma.DailyActivityLogOrderByWithRelationInput =
      filters.sortBy === 'animalTag'
        ? { animal: { animalNumber: filters.sortOrder ?? 'asc' } }
        : { activityDate: filters.sortOrder ?? 'desc' };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.dailyActivityLog.findMany({
        where,
        include: activityInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.dailyActivityLog.count({ where }),
    ]);

    return {
      data: rows.map(shapeActivity),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async createDailyActivity(userId: string, dto: CreateDailyActivityDto) {
    const row = await this.prisma.dailyActivityLog.create({
      data: {
        animalId: dto.animalId,
        farmId: dto.farmId,
        recordedById: userId,
        activityType: dto.activityType,
        activityDate: new Date(dto.activityDate),
        activityTime: dto.activityTime,
        session: dto.session,
        status: dto.status ?? ActivityStatus.COMPLETED,
        notes: dto.notes,
        feedType: dto.feedType,
        feedName: dto.feedName,
        quantity: dto.quantity,
        unit: dto.unit,
        feedingMethod: dto.feedingMethod,
        weightKg: dto.weightKg,
        observation: dto.observation,
        temperature: dto.temperature,
        healthStatus: dto.healthStatus,
        symptoms: dto.symptoms,
        requiresVet: dto.requiresVet ?? false,
      },
      include: activityInclude,
    });

    return shapeActivity(row);
  }

  async deleteDailyActivity(userId: string, id: string) {
    const row = await this.prisma.dailyActivityLog.findUnique({
      where: { id },
    });
    if (!row || row.deletedAt)
      throw new NotFoundException('The activity log entry could not be found.');
    await this.prisma.dailyActivityLog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
