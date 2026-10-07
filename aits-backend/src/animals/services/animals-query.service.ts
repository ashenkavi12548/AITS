import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AnimalStatus,
  Prisma,
  AnimalGender,
  QRCodeStatus,
} from '@prisma/client';
import { PaginatedResult } from '../types/animals.types';
import { verifyAnimalAccess } from '../utils/animals.utils';
import { AnimalQueryDto } from '../dto';
import { FarmAccessService } from '../../auth/services/farm-access.service';

@Injectable()
export class AnimalsQueryService {
  private readonly logger = new Logger(AnimalsQueryService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  async findAll(
    query: AnimalQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<unknown>> {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['animal:read'],
    );

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AnimalWhereInput = {
      deletedAt: null,
    };

    // Scoped farm access
    if (farmIds !== undefined) {
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
    } else if (query.farmId) {
      where.farmId = query.farmId;
    }

    // Specific filters
    if (query.species?.trim()) {
      where.species = { equals: query.species.trim(), mode: 'insensitive' };
    }
    if (query.breed?.trim()) {
      where.breed = { equals: query.breed.trim(), mode: 'insensitive' };
    }
    if (query.gender) {
      where.gender = query.gender;
    }
    if (query.status) {
      where.status = query.status;
    } else if (query.excludeStatus) {
      where.status = { not: query.excludeStatus };
    }
    if (query.identifierType) {
      where.identifiers = {
        some: { identifierType: query.identifierType },
      };
    }
    if (query.hasEligibleDiagnosis) {
      where.healthCases = {
        some: {
          status: {
            in: ['DIAGNOSED', 'UNDER_TREATMENT', 'OPEN', 'UNDER_INVESTIGATION'],
          },
        },
      };
    }

    // Unified Search across Ear Tag, Name, Breed, Color, RFID, and QR
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { animalNumber: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { breed: { contains: q, mode: 'insensitive' } },
        { color: { contains: q, mode: 'insensitive' } },
        {
          identifiers: {
            some: { identifierValue: { contains: q, mode: 'insensitive' } },
          },
        },
        {
          qrCodes: {
            some: { qrValue: { contains: q, mode: 'insensitive' } },
          },
        },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [animals, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: {
            select: {
              id: true,
              name: true,
              registrationNumber: true,
              city: true,
              district: true,
              province: true,
            },
          },
          identifiers: {
            where: { isPrimary: true },
            take: 1,
          },
          qrCodes: {
            where: { status: QRCodeStatus.ACTIVE },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.animal.count({ where }),
    ]);

    const formatted = animals.map((a) => ({
      id: a.id,
      farmId: a.farmId,
      animalNumber: a.animalNumber,
      name: a.name,
      species: a.species,
      breed: a.breed,
      gender: a.gender,
      dateOfBirth: a.dateOfBirth.toISOString(),
      color: a.color,
      weight: a.weight,
      imageUrl: a.imageUrl,
      status: a.status,
      registrationDate: a.registrationDate.toISOString(),
      farm: a.farm,
      primaryIdentifier: a.identifiers[0] || null,
      activeQr: a.qrCodes[0] || null,
    }));

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
  async getHerdStats(userId?: string, farmId?: string) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['animal:read'],
    );

    const where: Prisma.AnimalWhereInput = {
      deletedAt: null,
    };

    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return {
          totalAnimals: 0,
          activeAnimals: 0,
          quarantinedAnimals: 0,
          deceasedAnimals: 0,
          transferredAnimals: 0,
          soldAnimals: 0,
          missingAnimals: 0,
          maleCount: 0,
          femaleCount: 0,
        };
      }
      where.farmId =
        farmId && farmIds.includes(farmId) ? farmId : { in: farmIds };
    } else if (farmId) {
      where.farmId = farmId;
    }

    const [totalAnimals, statusGroups, genderGroups] = await Promise.all([
      this.prisma.animal.count({ where }),
      this.prisma.animal.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.animal.groupBy({
        by: ['gender'],
        where,
        _count: { gender: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const sg of statusGroups) {
      statusMap[sg.status] = sg._count.status;
    }

    const genderMap: Record<string, number> = {};
    for (const gg of genderGroups) {
      genderMap[gg.gender] = gg._count.gender;
    }

    return {
      totalAnimals,
      activeAnimals: statusMap[AnimalStatus.ACTIVE] || 0,
      quarantinedAnimals: statusMap[AnimalStatus.QUARANTINED] || 0,
      deceasedAnimals: statusMap[AnimalStatus.DECEASED] || 0,
      transferredAnimals: statusMap[AnimalStatus.TRANSFERRED] || 0,
      soldAnimals: statusMap[AnimalStatus.SOLD] || 0,
      missingAnimals: statusMap[AnimalStatus.MISSING] || 0,
      maleCount: genderMap[AnimalGender.MALE] || 0,
      femaleCount: genderMap[AnimalGender.FEMALE] || 0,
    };
  }
  async findOne(id: string, userId?: string) {
    const animal = await verifyAnimalAccess(
      this.prisma,
      this.farmAccessService,
      id,
      userId,
      ['animal:read'],
    );

    // Fetch parent records if linked
    const [mother, father, offspringCount, counts] = await Promise.all([
      animal.motherId
        ? this.prisma.animal.findUnique({
            where: { id: animal.motherId },
            select: {
              id: true,
              animalNumber: true,
              name: true,
              breed: true,
              status: true,
            },
          })
        : null,
      animal.fatherId
        ? this.prisma.animal.findUnique({
            where: { id: animal.fatherId },
            select: {
              id: true,
              animalNumber: true,
              name: true,
              breed: true,
              status: true,
            },
          })
        : null,
      this.prisma.animal.count({
        where: {
          OR: [{ motherId: id }, { fatherId: id }],
          deletedAt: null,
        },
      }),
      this.prisma.animal.findUnique({
        where: { id },
        select: {
          _count: {
            select: {
              healthRecords: true,
              milkProduction: true,
              femaleBreedingRecords: true,
              maleBreedingRecords: true,
              movements: true,
              documents: true,
            },
          },
        },
      }),
    ]);

    const activeQr =
      animal.qrCodes.find((qr) => qr.status === QRCodeStatus.ACTIVE) || null;
    const primaryIdentifier =
      animal.identifiers.find((i) => i.isPrimary) ||
      animal.identifiers[0] ||
      null;

    return {
      id: animal.id,
      farmId: animal.farmId,
      animalNumber: animal.animalNumber,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      gender: animal.gender,
      dateOfBirth: animal.dateOfBirth.toISOString(),
      color: animal.color,
      weight: animal.weight,
      imageUrl: animal.imageUrl,
      status: animal.status,
      registrationDate: animal.registrationDate.toISOString(),
      createdAt: animal.createdAt.toISOString(),
      farm: animal.farm,
      mother,
      father,
      offspringCount,
      primaryIdentifier,
      identifiers: animal.identifiers,
      activeQr,
      qrHistory: animal.qrCodes,
      moduleCounts: counts?._count || {
        healthRecords: 0,
        milkProduction: 0,
        femaleBreedingRecords: 0,
        maleBreedingRecords: 0,
        movements: 0,
        documents: 0,
      },
    };
  }
  async getAnimalHistory(id: string, userId?: string) {
    await verifyAnimalAccess(this.prisma, this.farmAccessService, id, userId, [
      'animal:read',
    ]);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      oldValues: l.oldValues,
      newValues: l.newValues,
      createdAt: l.createdAt.toISOString(),
      user: l.user
        ? {
            id: l.user.id,
            name: `${l.user.firstName} ${l.user.lastName}`.trim(),
            email: l.user.email,
          }
        : null,
    }));
  }
}
