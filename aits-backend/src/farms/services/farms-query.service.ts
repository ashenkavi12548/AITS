import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  Farm,
  FarmUserStatus,
  FarmUserRole,
  AnimalStatus,
  AnimalGender,
  MilkingSession,
  Prisma,
} from '@prisma/client';
import { SanitizedFarmEmployee, PaginatedResult } from '../types/farms.types';
import { verifyFarmAccess } from '../utils/farms.utils';
import { FarmQueryDto } from '../dto';

@Injectable()
export class FarmsQueryService {
  private readonly logger = new Logger(FarmsQueryService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getMyFarm(userId: string) {
    const farm = await this.prisma.farm.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { ownerId: userId },
          { users: { some: { userId, status: FarmUserStatus.ACTIVE } } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            users: true,
            animals: { where: { deletedAt: null } },
            milkProduction: true,
          },
        },
      },
    });

    if (!farm) {
      throw new NotFoundException(
        'No farm facility found for this account. Please register a farm facility.',
      );
    }

    return farm;
  }
  async searchAllFarms(searchQuery?: string): Promise<Partial<Farm>[]> {
    const where: Prisma.FarmWhereInput = {
      deletedAt: null,
      status: 'ACTIVE',
      ...(searchQuery && {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          {
            registrationNumber: { contains: searchQuery, mode: 'insensitive' },
          },
        ],
      }),
    };

    const farms = await this.prisma.farm.findMany({
      where,
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        province: true,
        district: true,
      },
      take: 50,
      orderBy: { name: 'asc' },
    });

    return farms;
  }
  async getFarms(
    userId: string,
    query: FarmQueryDto,
  ): Promise<PaginatedResult<Farm>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FarmWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.province && {
        province: { contains: query.province, mode: 'insensitive' },
      }),
      ...(query.district && {
        district: { contains: query.district, mode: 'insensitive' },
      }),
      ...(query.farmType && {
        farmType: { contains: query.farmType, mode: 'insensitive' },
      }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          {
            registrationNumber: { contains: query.search, mode: 'insensitive' },
          },
          { city: { contains: query.search, mode: 'insensitive' } },
          { address: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...{
        OR: [
          { ownerId: userId },
          { users: { some: { userId, status: FarmUserStatus.ACTIVE } } },
        ],
      },
    };

    const sortOrder: Prisma.SortOrder =
      query.sortOrder === 'asc' ? 'asc' : 'desc';
    const sortBy = query.sortBy || 'createdAt';
    const orderBy: Prisma.FarmOrderByWithRelationInput =
      sortBy === 'name'
        ? { name: sortOrder }
        : sortBy === 'registrationNumber'
          ? { registrationNumber: sortOrder }
          : { createdAt: sortOrder };

    const [farms, total] = await Promise.all([
      this.prisma.farm.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              users: true,
              animals: { where: { deletedAt: null } },
              milkProduction: true,
            },
          },
        },
      }),
      this.prisma.farm.count({ where }),
    ]);

    return {
      data: farms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getFarmById(userId: string, farmId: string) {
    await verifyFarmAccess(this.prisma, userId, farmId);

    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            users: true,
            animals: { where: { deletedAt: null } },
            milkProduction: true,
          },
        },
      },
    });

    if (!farm) {
      throw new NotFoundException('Farm facility not found.');
    }

    return farm;
  }
  async getFarmStats(userId: string, farmId: string) {
    await verifyFarmAccess(this.prisma, userId, farmId);

    const [
      totalAnimals,
      animalsByStatus,
      animalsByGender,
      staffCount,
      staffByRole,
    ] = await Promise.all([
      // 1. Total Animals
      this.prisma.animal.count({
        where: { farmId, deletedAt: null },
      }),

      // 2. Animals by Status
      this.prisma.animal.groupBy({
        by: ['status'],
        where: { farmId, deletedAt: null },
        _count: { status: true },
      }),

      // 3. Animals by Gender
      this.prisma.animal.groupBy({
        by: ['gender'],
        where: { farmId, deletedAt: null },
        _count: { gender: true },
      }),

      // 4. Staff Count
      this.prisma.farmUser.count({
        where: { farmId, status: FarmUserStatus.ACTIVE },
      }),

      // 5. Staff by Role
      this.prisma.farmUser.groupBy({
        by: ['role'],
        where: { farmId, status: FarmUserStatus.ACTIVE },
        _count: { role: true },
      }),
    ]);

    const [milkYieldAggregation, milkSessionAggregation] = await Promise.all([
      // 6. Milk Production Total & Breakdown
      this.prisma.milkProduction.aggregate({
        where: { farmId },
        _sum: {
          quantityLiters: true,
        },
        _count: { id: true },
      }),

      // 7. Milk Production by Session
      this.prisma.milkProduction.groupBy({
        by: ['milkingSession'],
        where: { farmId },
        _sum: { quantityLiters: true },
      }),
    ]);

    const sessionMap: Partial<Record<MilkingSession, number>> = {};
    for (const sessionItem of milkSessionAggregation) {
      if (sessionItem.milkingSession) {
        sessionMap[sessionItem.milkingSession] =
          sessionItem._sum.quantityLiters ?? 0;
      }
    }

    const statusMap: Partial<Record<AnimalStatus, number>> = {};
    for (const statusItem of animalsByStatus) {
      statusMap[statusItem.status] = statusItem._count.status;
    }

    const genderMap: Partial<Record<AnimalGender, number>> = {};
    for (const genderItem of animalsByGender) {
      genderMap[genderItem.gender] = genderItem._count.gender;
    }

    const roleMap: Partial<Record<FarmUserRole, number>> = {};
    for (const roleItem of staffByRole) {
      roleMap[roleItem.role] = roleItem._count.role;
    }

    return {
      totalAnimals,
      animalsByStatus: statusMap,
      animalsByGender: genderMap,
      staffCount,
      staffByRole: roleMap,
      milkProduction: {
        totalRecords: milkYieldAggregation._count.id,
        totalYieldLitres: milkYieldAggregation._sum.quantityLiters ?? 0,
        morningYieldLitres: sessionMap['MORNING'] ?? 0,
        afternoonYieldLitres: sessionMap['AFTERNOON'] ?? 0,
        eveningYieldLitres: sessionMap['EVENING'] ?? 0,
      },
    };
  }

  /**
   * Helper: Get sanitized farm employee by ID
   */
  private async getFarmEmployeeById(
    farmId: string,
    employeeUserId: string,
  ): Promise<SanitizedFarmEmployee> {
    const fu = await this.prisma.farmUser.findFirstOrThrow({
      where: { farmId, userId: employeeUserId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImageUrl: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const permissions = Array.from(
      new Set([
        ...(fu.user.userRoles?.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ) || []),
        ...(fu.permissions || []),
      ]),
    );

    return {
      id: fu.id,
      farmId: fu.farmId,
      userId: fu.userId,
      farmRole: fu.role,
      status: fu.status,
      joinedAt: fu.joinedAt,
      user: {
        id: fu.user.id,
        firstName: fu.user.firstName,
        lastName: fu.user.lastName,
        fullName: `${fu.user.firstName} ${fu.user.lastName}`.trim(),
        email: fu.user.email,
        phone: fu.user.phone,
        profileImageUrl: fu.user.profileImageUrl,
        status: fu.user.status,
        lastLoginAt: fu.user.lastLoginAt,
        createdAt: fu.user.createdAt,
        permissions,
      },
    };
  }
}
