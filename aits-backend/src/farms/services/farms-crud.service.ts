import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmStatus, FarmUserRole, FarmUserStatus } from '@prisma/client';
import { AuditContext } from '../types/farms.types';
import { createAuditRecord, verifyFarmAccess } from '../utils/farms.utils';
import { CreateFarmDto, UpdateFarmDto } from '../dto';

@Injectable()
export class FarmsCrudService {
  private readonly logger = new Logger(FarmsCrudService.name);
  constructor(private readonly prisma: PrismaService) {}

  async createFarm(
    userId: string,
    dto: CreateFarmDto,
    auditContext?: AuditContext,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const regNumber =
      dto.registrationNumber || `LK-FARM-${Date.now().toString().slice(-6)}`;

    // Ensure registration number uniqueness
    const existingReg = await this.prisma.farm.findUnique({
      where: { registrationNumber: regNumber },
    });

    if (existingReg) {
      throw new ConflictException(
        `A farm with registration number ${regNumber} already exists.`,
      );
    }

    const createdFarm = await this.prisma.$transaction(async (tx) => {
      const farm = await tx.farm.create({
        data: {
          ownerId: userId,
          name: dto.name,
          registrationNumber: regNumber,
          farmType: dto.farmType,
          address: dto.address,
          province: dto.province,
          district: dto.district,
          city: dto.city,
          contactNumber: dto.contactNumber,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          status: dto.status || FarmStatus.ACTIVE,
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
              animals: true,
              milkProduction: true,
            },
          },
        },
      });

      // Link creator as OWNER in FarmUser
      await tx.farmUser.create({
        data: {
          farmId: farm.id,
          userId,
          role: FarmUserRole.OWNER,
          status: FarmUserStatus.ACTIVE,
        },
      });

      // Append-only audit record
      await createAuditRecord(
        tx,
        userId,
        'CREATE_FARM',
        'Farm',
        farm.id,
        null,
        {
          name: farm.name,
          registrationNumber: farm.registrationNumber,
          farmType: farm.farmType,
        },
        auditContext,
      );

      return farm;
    });

    return createdFarm;
  }
  async updateFarm(
    userId: string,
    farmId: string,
    dto: UpdateFarmDto,
    auditContext?: AuditContext,
  ) {
    const { farm } = await verifyFarmAccess(this.prisma, userId, farmId, [
      FarmUserRole.OWNER,
      FarmUserRole.MANAGER,
    ]);

    const updated = await this.prisma.$transaction(async (tx) => {
      const oldValues: Record<string, unknown> = {
        name: farm.name,
        farmType: farm.farmType,
        address: farm.address,
        province: farm.province,
        district: farm.district,
        city: farm.city,
        contactNumber: farm.contactNumber,
        status: farm.status,
      };

      const updatedFarm = await tx.farm.update({
        where: { id: farmId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.farmType !== undefined && { farmType: dto.farmType }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.province !== undefined && { province: dto.province }),
          ...(dto.district !== undefined && { district: dto.district }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.contactNumber !== undefined && {
            contactNumber: dto.contactNumber,
          }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
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

      const auditPayload: Record<string, unknown> = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.farmType !== undefined && { farmType: dto.farmType }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.province !== undefined && { province: dto.province }),
        ...(dto.district !== undefined && { district: dto.district }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.contactNumber !== undefined && {
          contactNumber: dto.contactNumber,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      };

      await createAuditRecord(
        tx,
        userId,
        'UPDATE_FARM',
        'Farm',
        farmId,
        oldValues,
        auditPayload,
        auditContext,
      );

      return updatedFarm;
    });

    return updated;
  }
  async deactivateFarm(
    userId: string,
    farmId: string,
    auditContext?: AuditContext,
  ) {
    const { farm } = await verifyFarmAccess(this.prisma, userId, farmId, [
      FarmUserRole.OWNER,
    ]);

    await this.prisma.$transaction(async (tx) => {
      await tx.farm.update({
        where: { id: farmId },
        data: {
          status: FarmStatus.INACTIVE,
          deletedAt: new Date(),
        },
      });

      await createAuditRecord(
        tx,
        userId,
        'DEACTIVATE_FARM',
        'Farm',
        farmId,
        { status: farm.status },
        { status: FarmStatus.INACTIVE },
        auditContext,
      );
    });

    return {
      success: true,
      message:
        'Farm facility deactivated successfully. Historical records preserved.',
    };
  }
}
