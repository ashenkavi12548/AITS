import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { UpdateFeedingRecordDto } from './dto/update-feeding-record.dto';

@Injectable()
export class FeedingService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeedTypes() {
    let feedTypes = await this.prisma.feedType.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    if (feedTypes.length === 0) {
      await this.prisma.feedType.createMany({
        data: [
          { name: 'Grass', description: 'Fresh pasture grass', unit: 'kg' },
          { name: 'Hay', description: 'Dried grass/legume', unit: 'kg' },
          { name: 'Silage', description: 'Fermented forage', unit: 'kg' },
          {
            name: 'Grain Concentrate',
            description: 'Energy dense grain mix',
            unit: 'kg',
          },
          {
            name: 'Mineral Supplement',
            description: 'Essential minerals and vitamins',
            unit: 'g',
          },
        ],
      });
      feedTypes = await this.prisma.feedType.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      });
    }

    return feedTypes;
  }

  async getAllFeedingRecords(userId: string) {
    const userFarms = await this.prisma.farmUser.findMany({
      where: { userId },
      select: { farmId: true },
    });

    const farmIds = userFarms.map((f) => f.farmId);

    return this.prisma.feedingRecord.findMany({
      where: { animal: { farmId: { in: farmIds } } },
      include: {
        feedType: true,
        animal: { select: { id: true, name: true, animalNumber: true } },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { fedAt: 'desc' },
      take: 100,
    });
  }

  async getFeedingRecordsForAnimal(animalId: string, userId?: string) {
    // Validate animal and farm access
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal) {
      throw new NotFoundException('The requested animal could not be found.');
    }

    if (userId) {
      const userFarmAccess = await this.prisma.farmUser.findFirst({
        where: { farmId: animal.farmId, userId },
      });
      if (!userFarmAccess) {
        throw new ForbiddenException('You do not have access to this farm');
      }
    }

    return this.prisma.feedingRecord.findMany({
      where: { animalId },
      include: {
        feedType: true,
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { fedAt: 'desc' },
    });
  }

  async createFeedingRecord(dto: CreateFeedingRecordDto, userId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
    });

    if (!animal) {
      throw new NotFoundException('The requested animal could not be found.');
    }

    const userFarmAccess = await this.prisma.farmUser.findFirst({
      where: { farmId: animal.farmId, userId },
    });

    if (!userFarmAccess) {
      throw new ForbiddenException('You do not have access to this farm');
    }

    const feedType = await this.prisma.feedType.findUnique({
      where: { id: dto.feedTypeId },
    });

    if (!feedType || feedType.deletedAt) {
      throw new NotFoundException('Feed type not found');
    }

    return this.prisma.feedingRecord.create({
      data: {
        animalId: dto.animalId,
        feedTypeId: dto.feedTypeId,
        quantity: dto.quantity,
        unit: dto.unit,
        fedAt: dto.fedAt ? new Date(dto.fedAt) : new Date(),
        notes: dto.notes,
        recordedById: userId,
      },
      include: {
        feedType: true,
      },
    });
  }

  async updateFeedingRecord(
    id: string,
    dto: UpdateFeedingRecordDto,
    userId: string,
  ) {
    const record = await this.prisma.feedingRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!record) {
      throw new NotFoundException('Feeding record not found');
    }

    const userFarmAccess = await this.prisma.farmUser.findFirst({
      where: { farmId: record.animal.farmId, userId },
    });

    if (!userFarmAccess) {
      throw new ForbiddenException('You do not have access to this farm');
    }

    return this.prisma.feedingRecord.update({
      where: { id },
      data: {
        feedTypeId: dto.feedTypeId,
        quantity: dto.quantity,
        unit: dto.unit,
        fedAt: dto.fedAt ? new Date(dto.fedAt) : undefined,
        notes: dto.notes,
      },
      include: {
        feedType: true,
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async deleteFeedingRecord(id: string, userId: string) {
    const record = await this.prisma.feedingRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!record) {
      throw new NotFoundException('Feeding record not found');
    }

    const userFarmAccess = await this.prisma.farmUser.findFirst({
      where: { farmId: record.animal.farmId, userId },
    });

    if (!userFarmAccess) {
      throw new ForbiddenException('You do not have access to this farm');
    }

    await this.prisma.feedingRecord.delete({
      where: { id },
    });

    return { success: true };
  }
}
