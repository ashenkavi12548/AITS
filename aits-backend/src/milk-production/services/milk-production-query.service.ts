import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { MilkingSession, Prisma } from '@prisma/client';
import { MilkProductionQueryDto } from '../dto';
import { FormattedMilkRecord } from '../types/milk-production.types';
import { formatRecord } from '../utils/milk-production.utils';

@Injectable()
export class MilkProductionQueryService {
  private readonly logger = new Logger(MilkProductionQueryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  /**
   * List paginated and filtered production records
   */
  async getRecords(userId: string, query: MilkProductionQueryDto) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:read'],
    );

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.MilkProductionWhereInput = {};

    // Farm scoping
    if (farmIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }
    where.farmId =
      query.farmId && farmIds.includes(query.farmId)
        ? query.farmId
        : { in: farmIds };

    // Animal filtering
    if (query.animalId) {
      where.animalId = query.animalId;
    }

    // Session filtering
    if (query.session) {
      const upper = query.session.toUpperCase() as MilkingSession;
      if (Object.values(MilkingSession).includes(upper)) {
        where.milkingSession = upper;
      }
    }

    // Quality filtering
    if (query.qualityStatus) {
      where.milkQuality = { equals: query.qualityStatus, mode: 'insensitive' };
    }

    // Date range filtering
    if (query.startDate || query.endDate) {
      where.productionDate = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        where.productionDate.gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.productionDate.lte = end;
      }
    }

    // Search filter (animal tag, animal name, farm name, recorded by name)
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { animal: { animalNumber: { contains: term, mode: 'insensitive' } } },
        { animal: { name: { contains: term, mode: 'insensitive' } } },
        { farm: { name: { contains: term, mode: 'insensitive' } } },
        { recordedBy: { firstName: { contains: term, mode: 'insensitive' } } },
        { recordedBy: { lastName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    // Sorting
    const sortOrder: Prisma.SortOrder =
      query.sortOrder === 'asc' ? 'asc' : 'desc';
    let orderBy: Prisma.MilkProductionOrderByWithRelationInput = {
      productionDate: sortOrder,
    };

    if (query.sortBy === 'quantityLiters') {
      orderBy = { quantityLiters: sortOrder };
    } else if (query.sortBy === 'animalTag') {
      orderBy = { animal: { animalNumber: sortOrder } };
    } else if (query.sortBy === 'farmName') {
      orderBy = { farm: { name: sortOrder } };
    } else if (query.sortBy === 'qualityStatus') {
      orderBy = { milkQuality: sortOrder };
    }

    const [total, records] = await Promise.all([
      this.prisma.milkProduction.count({ where }),
      this.prisma.milkProduction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          animal: {
            select: {
              id: true,
              animalNumber: true,
              name: true,
              imageUrl: true,
              species: true,
            },
          },
          farm: {
            select: { id: true, name: true },
          },
          recordedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const formatted = records.map((r) => formatRecord(r));

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get single milk production record by ID
   */
  async getRecordById(
    userId: string,
    id: string,
  ): Promise<FormattedMilkRecord> {
    const record = await this.prisma.milkProduction.findUnique({
      where: { id },
      include: {
        animal: {
          select: {
            id: true,
            animalNumber: true,
            name: true,
            imageUrl: true,
            species: true,
          },
        },
        farm: { select: { id: true, name: true } },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(
        `Milk production record "${id}" was not found.`,
      );
    }

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:read'],
    );
    if (!farmIds.includes(record.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to view records from this farm facility.',
      );
    }

    return formatRecord(record);
  }

  /**
   * Dropdown helper: Returns list of farms accessible to user
   */
  async getFarms(userId: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:read'],
    );

    const where: Prisma.FarmWhereInput = { deletedAt: null };
    if (farmIds.length === 0) return [];
    where.id = { in: farmIds };

    const farms = await this.prisma.farm.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return farms;
  }

  /**
   * Dropdown helper: Returns list of animals accessible to user (and active)
   */
  async getAnimals(userId: string, targetFarmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:read'],
    );

    const where: Prisma.AnimalWhereInput = {
      deletedAt: null,
      status: 'ACTIVE',
      gender: 'FEMALE',
    };

    if (farmIds.length === 0) return [];
    where.farmId =
      targetFarmId && farmIds.includes(targetFarmId)
        ? targetFarmId
        : { in: farmIds };

    const animals = await this.prisma.animal.findMany({
      where,
      select: {
        id: true,
        animalNumber: true,
        name: true,
        farmId: true,
        farm: { select: { name: true } },
      },
      orderBy: { animalNumber: 'asc' },
      take: 200,
    });

    return animals.map((a) => ({
      id: a.id,
      tag: a.animalNumber,
      name: a.name || a.animalNumber,
      farmId: a.farmId,
      farmName: a.farm.name,
    }));
  }
}
