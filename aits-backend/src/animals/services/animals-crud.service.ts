import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AnimalStatus,
  Prisma,
  AnimalGender,
  QRCodeStatus,
  NotificationType,
  NotificationPriority,
  IdentifierType,
} from '@prisma/client';
import { AuditContext } from '../types/animals.types';
import { createAuditRecord, verifyAnimalAccess } from '../utils/animals.utils';
import {
  CreateAnimalDto,
  UpdateAnimalDto,
  AnimalQueryDto,
  UpdateAnimalStatusDto,
} from '../dto';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { NotificationsService } from '../../notifications/notifications.service';
import * as QRCode from 'qrcode';

@Injectable()
export class AnimalsCrudService {
  private readonly frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly logger = new Logger(AnimalsCrudService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createAnimal(
    dto: CreateAnimalDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    const rawTag = (dto.animalNumber || '').trim().toUpperCase();
    if (!rawTag) {
      throw new BadRequestException(
        'Official ear tag / animal number is required.',
      );
    }

    // 1. Resolve and verify farm
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['animal:create'],
    );
    let targetFarmId = dto.farmId;

    if (!targetFarmId) {
      if (farmIds.length > 0) {
        targetFarmId = farmIds[0];
      } else {
        const firstFarm = await this.prisma.farm.findFirst({
          where: { deletedAt: null },
        });
        if (!firstFarm) {
          throw new BadRequestException(
            'No active farm facility exists in the system to assign animal.',
          );
        }
        targetFarmId = firstFarm.id;
      }
    }

    if (!farmIds.includes(targetFarmId)) {
      throw new ForbiddenException(
        'You do not have permission to register animals for this farm facility.',
      );
    }

    // 2. Check duplicate Official Ear Tag
    const existingAnimal = await this.prisma.animal.findFirst({
      where: {
        animalNumber: { equals: rawTag, mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (existingAnimal) {
      throw new ConflictException(
        `An animal with official ear tag "${rawTag}" is already registered.`,
      );
    }

    // Check duplicate in AnimalIdentifier table
    const existingTagId = await this.prisma.animalIdentifier.findFirst({
      where: {
        identifierValue: { equals: rawTag, mode: 'insensitive' },
      },
    });
    if (existingTagId) {
      throw new ConflictException(
        `Identifier "${rawTag}" is already registered to an animal record.`,
      );
    }

    // Check duplicate RFID if provided
    const rfidClean = dto.rfidNumber?.trim().toUpperCase();
    if (rfidClean) {
      const existingRfid = await this.prisma.animalIdentifier.findFirst({
        where: {
          identifierValue: { equals: rfidClean, mode: 'insensitive' },
        },
      });
      if (existingRfid) {
        throw new ConflictException(
          `RFID identifier "${rfidClean}" is already registered to another animal.`,
        );
      }
    }

    // 3. Resolve & Validate Parent Animals
    let resolvedMotherId: string | null = null;
    let resolvedFatherId: string | null = null;

    const motherRef = dto.motherTagOrId?.trim() || dto.motherId?.trim();
    if (motherRef) {
      const motherAnimal = await this.prisma.animal.findFirst({
        where: {
          OR: [
            { id: motherRef.length === 36 ? motherRef : undefined },
            { animalNumber: { equals: motherRef, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });

      if (!motherAnimal) {
        throw new BadRequestException(
          `Mother/Dam reference "${motherRef}" was not found in the animal registry.`,
        );
      }
      if (motherAnimal.gender !== AnimalGender.FEMALE) {
        throw new BadRequestException(
          `Specified Mother/Dam "${motherAnimal.animalNumber}" is registered as MALE. Mother must be FEMALE.`,
        );
      }
      resolvedMotherId = motherAnimal.id;
    }

    const fatherRef = dto.fatherTagOrId?.trim() || dto.fatherId?.trim();
    if (fatherRef) {
      const fatherAnimal = await this.prisma.animal.findFirst({
        where: {
          OR: [
            { id: fatherRef.length === 36 ? fatherRef : undefined },
            { animalNumber: { equals: fatherRef, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });

      if (!fatherAnimal) {
        throw new BadRequestException(
          `Father/Sire reference "${fatherRef}" was not found in the animal registry.`,
        );
      }
      if (fatherAnimal.gender !== AnimalGender.MALE) {
        throw new BadRequestException(
          `Specified Father/Sire "${fatherAnimal.animalNumber}" is registered as FEMALE. Father must be MALE.`,
        );
      }
      resolvedFatherId = fatherAnimal.id;
    }

    // 4. Validate Dates & Gender
    let gender: AnimalGender = AnimalGender.FEMALE;
    if (dto.gender) {
      const gStr = String(dto.gender).toUpperCase();
      if (gStr === 'MALE' || gStr === 'BULL') {
        gender = AnimalGender.MALE;
      }
    }

    let parsedDob = new Date();
    if (dto.dateOfBirth) {
      const d = new Date(dto.dateOfBirth);
      if (!isNaN(d.getTime())) {
        if (d.getTime() > Date.now()) {
          throw new BadRequestException(
            'Date of birth cannot be in the future.',
          );
        }
        parsedDob = d;
      }
    }

    // 5. Cloudinary image upload
    let finalImageUrl: string | null = dto.imageUrl?.trim() || null;
    if (finalImageUrl && !finalImageUrl.startsWith('http')) {
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(
          finalImageUrl,
          'aits/animals',
        );
        if (uploadResult?.secureUrl) {
          finalImageUrl = uploadResult.secureUrl;
        }
      } catch (err: unknown) {
        this.logger.warn(`Photo upload warning: ${String(err)}`);
      }
    }

    // 6. Transactional Creation
    return await this.prisma.$transaction(async (tx) => {
      // Step A: Create Animal Record
      const created = await tx.animal.create({
        data: {
          farmId: targetFarmId,
          animalNumber: rawTag,
          name: dto.name?.trim() || rawTag,
          species: dto.species?.trim() || 'Cattle',
          breed: dto.breed?.trim() || 'Holstein-Friesian',
          gender,
          dateOfBirth: parsedDob,
          color: dto.color?.trim() || 'Standard',
          weight: dto.weight ? Number(dto.weight) : null,
          imageUrl: finalImageUrl,
          motherId: resolvedMotherId,
          fatherId: resolvedFatherId,
          status: dto.status || AnimalStatus.ACTIVE,
        },
        include: {
          farm: {
            select: {
              id: true,
              name: true,
              registrationNumber: true,
              city: true,
            },
          },
        },
      });

      // Step B: Create Primary Ear Tag Identifier
      await tx.animalIdentifier.create({
        data: {
          animalId: created.id,
          identifierType: IdentifierType.EAR_TAG,
          identifierValue: rawTag,
          isPrimary: true,
        },
      });

      // Step C: Create Secondary RFID Identifier if provided
      if (rfidClean) {
        await tx.animalIdentifier.create({
          data: {
            animalId: created.id,
            identifierType: IdentifierType.RFID,
            identifierValue: rfidClean,
            isPrimary: false,
          },
        });
      }

      // Step D: Generate Cryptographic QR payload & High-Resolution Image
      const qrPayloadUrl = `${this.frontendUrl}/animals/${created.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrPayloadUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 512,
        color: { dark: '#065f46', light: '#ffffff' },
      });

      // Step E: Create Active QRCode record
      const qrRecord = await tx.qRCode.create({
        data: {
          animalId: created.id,
          qrValue: qrPayloadUrl,
          qrImageUrl: qrDataUrl,
          status: QRCodeStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });

      // Step F: Record Audit Log
      await createAuditRecord(
        tx,
        userId,
        'REGISTER_ANIMAL',
        'Animal',
        created.id,
        null,
        {
          animalNumber: rawTag,
          farmId: targetFarmId,
          gender,
          breed: created.breed,
          rfidNumber: rfidClean || null,
        },
        auditContext,
      );

      // Notify farm users of newly registered animal
      this.notificationsService
        .notifyFarmUsers(targetFarmId, {
          title: 'New Animal Registered',
          message: `${rawTag} successfully verified with digital QR badge`,
          notificationType: NotificationType.SYSTEM,
          category: 'SYSTEM',
          priority: NotificationPriority.NORMAL,
          referenceType: 'Animal',
          referenceId: created.id,
          actionUrl: `/animals/${created.id}`,
          dedupKey: `animal:create:${created.id}`,
        })
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch registration notification: ${String(err)}`,
          ),
        );

      return {
        success: true,
        message: `Animal with ear tag #${rawTag} registered successfully.`,
        animal: {
          ...created,
          qrCode: {
            id: qrRecord.id,
            qrValue: qrRecord.qrValue,
            qrImageUrl: qrRecord.qrImageUrl,
          },
        },
      };
    });
  }
  async updateAnimal(
    id: string,
    dto: UpdateAnimalDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    if (dto.dateOfBirth) {
      const d = new Date(dto.dateOfBirth);
      if (!isNaN(d.getTime())) {
        if (d.getTime() > Date.now()) {
          throw new BadRequestException(
            'Date of birth cannot be in the future.',
          );
        }
      }
    }

    const existing = await verifyAnimalAccess(
      this.prisma,
      this.farmAccessService,
      id,
      userId,
      ['animal:update'],
    );

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.animal.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name?.trim() || null }),
          ...(dto.species !== undefined && { species: dto.species?.trim() }),
          ...(dto.breed !== undefined && { breed: dto.breed?.trim() }),
          ...(dto.gender !== undefined && { gender: dto.gender }),
          ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
          ...(dto.color !== undefined && { color: dto.color?.trim() || null }),
          ...(dto.weight !== undefined && {
            weight: dto.weight ? Number(dto.weight) : null,
          }),
          ...(dto.imageUrl !== undefined && {
            imageUrl: dto.imageUrl?.trim() || null,
          }),
        },
        include: {
          farm: {
            select: { id: true, name: true, registrationNumber: true },
          },
        },
      });

      await createAuditRecord(
        tx,
        userId,
        'UPDATE_ANIMAL',
        'Animal',
        id,
        {
          name: existing.name,
          species: existing.species,
          breed: existing.breed,
          weight: existing.weight,
        },
        {
          name: updated.name,
          species: updated.species,
          breed: updated.breed,
          weight: updated.weight,
        },
        auditContext,
      );

      return {
        success: true,
        message: `Animal details for #${updated.animalNumber} updated successfully.`,
        animal: updated,
      };
    });
  }
  async updateAnimalStatus(
    id: string,
    dto: UpdateAnimalStatusDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    const existing = await verifyAnimalAccess(
      this.prisma,
      this.farmAccessService,
      id,
      userId,
      ['animal:update'],
    );

    if (existing.status === dto.status) {
      return {
        success: true,
        message: `Animal status is already ${dto.status}.`,
        animal: existing,
      };
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.animal.update({
        where: { id },
        data: { status: dto.status },
      });

      await createAuditRecord(
        tx,
        userId,
        'CHANGE_ANIMAL_STATUS',
        'Animal',
        id,
        { status: existing.status },
        {
          status: dto.status,
          reason: dto.reason,
          notes: dto.notes || null,
        },
        auditContext,
      );

      return {
        success: true,
        message: `Animal #${existing.animalNumber} status changed from ${existing.status} to ${dto.status}.`,
        animal: updated,
      };
    });
  }
  async deleteAnimal(id: string, userId?: string, auditContext?: AuditContext) {
    const animal = await verifyAnimalAccess(
      this.prisma,
      this.farmAccessService,
      id,
      userId,
      ['animal:delete'],
    );

    return await this.prisma.$transaction(async (tx) => {
      await tx.animal.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await createAuditRecord(
        tx,
        userId,
        'SOFT_DELETE_ANIMAL',
        'Animal',
        id,
        { status: animal.status, deletedAt: null },
        { deletedAt: new Date() },
        auditContext,
      );

      return {
        success: true,
        message: `Animal #${animal.animalNumber} has been archived.`,
      };
    });
  }
  async exportAnimalsCsv(
    query: AnimalQueryDto,
    userId?: string,
  ): Promise<string> {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['animal:read'],
    );

    const where: Prisma.AnimalWhereInput = {
      deletedAt: null,
    };

    if (farmIds !== undefined) {
      if (farmIds.length === 0) {
        return 'Animal ID,Official Ear Tag,Name,Species,Breed,Gender,Date of Birth,Weight (kg),Color,Status,Farm Name,Primary Identifier,Active QR,Registration Date\n';
      }
      where.farmId =
        query.farmId && farmIds.includes(query.farmId)
          ? query.farmId
          : { in: farmIds };
    } else if (query.farmId) {
      where.farmId = query.farmId;
    }

    if (query.species?.trim()) {
      where.species = { equals: query.species.trim(), mode: 'insensitive' };
    }
    if (query.breed?.trim()) {
      where.breed = { equals: query.breed.trim(), mode: 'insensitive' };
    }
    if (query.gender) where.gender = query.gender;
    if (query.status) where.status = query.status;

    const animals = await this.prisma.animal.findMany({
      where,
      take: 5000,
      orderBy: { createdAt: 'desc' },
      include: {
        farm: { select: { name: true, registrationNumber: true } },
        identifiers: { where: { isPrimary: true }, take: 1 },
        qrCodes: { where: { status: QRCodeStatus.ACTIVE }, take: 1 },
      },
    });

    const headers = [
      'Animal ID',
      'Official Ear Tag',
      'Name',
      'Species',
      'Breed',
      'Gender',
      'Date of Birth',
      'Weight (kg)',
      'Color',
      'Status',
      'Farm Name',
      'Primary Identifier',
      'Active QR Code',
      'Registration Date',
    ];

    const rows = animals.map((a) => [
      `"${a.id}"`,
      `"${a.animalNumber}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.species}"`,
      `"${a.breed}"`,
      `"${a.gender}"`,
      `"${a.dateOfBirth.toISOString().split('T')[0]}"`,
      a.weight ?? '',
      `"${(a.color || '').replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${(a.farm?.name || '').replace(/"/g, '""')}"`,
      `"${a.identifiers[0]?.identifierValue || a.animalNumber}"`,
      `"${a.qrCodes[0]?.qrValue || ''}"`,
      `"${a.registrationDate.toISOString().split('T')[0]}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
