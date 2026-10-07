import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QRCodeStatus } from '@prisma/client';
import { AuditContext } from '../types/animals.types';
import { createAuditRecord, verifyAnimalAccess } from '../utils/animals.utils';
import { CreateIdentifierDto, ReplaceQrDto, DeactivateQrDto } from '../dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import * as QRCode from 'qrcode';

@Injectable()
export class AnimalsIdentifiersService {
  private readonly frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly logger = new Logger(AnimalsIdentifiersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getAnimalIdentifiers(id: string, userId?: string) {
    await verifyAnimalAccess(this.prisma, this.farmAccessService, id, userId, [
      'animal:read',
    ]);
    return await this.prisma.animalIdentifier.findMany({
      where: { animalId: id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }
  async addIdentifier(
    id: string,
    dto: CreateIdentifierDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    const animal = await verifyAnimalAccess(
      this.prisma,
      this.farmAccessService,
      id,
      userId,
      ['animal:update'],
    );
    const cleanVal = dto.identifierValue.trim().toUpperCase();

    // Check uniqueness
    const existing = await this.prisma.animalIdentifier.findFirst({
      where: { identifierValue: { equals: cleanVal, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(
        `Identifier "${cleanVal}" is already registered.`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.animalIdentifier.updateMany({
          where: { animalId: id, identifierType: dto.identifierType },
          data: { isPrimary: false },
        });
      }

      const identifier = await tx.animalIdentifier.create({
        data: {
          animalId: id,
          identifierType: dto.identifierType,
          identifierValue: cleanVal,
          isPrimary: Boolean(dto.isPrimary),
        },
      });

      await createAuditRecord(
        tx,
        userId,
        'ADD_ANIMAL_IDENTIFIER',
        'AnimalIdentifier',
        identifier.id,
        null,
        {
          animalId: id,
          animalNumber: animal.animalNumber,
          type: dto.identifierType,
          value: cleanVal,
          isPrimary: dto.isPrimary,
        },
        auditContext,
      );

      return {
        success: true,
        message: `Identifier (${dto.identifierType}: ${cleanVal}) added successfully.`,
        identifier,
      };
    });
  }
  async getAnimalQr(id: string, userId?: string) {
    const animal = await verifyAnimalAccess(
      this.prisma,
      this.farmAccessService,
      id,
      userId,
      ['animal:read'],
    );

    let activeQr = animal.qrCodes.find(
      (qr) => qr.status === QRCodeStatus.ACTIVE,
    );

    // If missing active QR, auto-generate and activate
    if (!activeQr) {
      const qrPayloadUrl = `${this.frontendUrl}/animals/${animal.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrPayloadUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 512,
        color: { dark: '#065f46', light: '#ffffff' },
      });

      activeQr = await this.prisma.qRCode.create({
        data: {
          animalId: animal.id,
          qrValue: qrPayloadUrl,
          qrImageUrl: qrDataUrl,
          status: QRCodeStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });
    }

    return {
      animalId: animal.id,
      animalNumber: animal.animalNumber,
      name: animal.name,
      breed: animal.breed,
      qrValue: activeQr.qrValue,
      qrImageUrl: activeQr.qrImageUrl,
      activeQr,
      qrHistory: animal.qrCodes,
    };
  }
  async replaceQrCode(
    id: string,
    dto: ReplaceQrDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    const animal = await verifyAnimalAccess(
      this.prisma,
      this.farmAccessService,
      id,
      userId,
      ['animal:update'],
    );

    // Generate new distinct payload token
    const newQrPayloadUrl = `${this.frontendUrl}/animals/${animal.id}?t=${Date.now()}`;
    const newQrDataUrl = await QRCode.toDataURL(newQrPayloadUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      color: { dark: '#065f46', light: '#ffffff' },
    });

    return await this.prisma.$transaction(async (tx) => {
      // Mark existing active QRs as REPLACED
      const currentActive = await tx.qRCode.findFirst({
        where: { animalId: id, status: QRCodeStatus.ACTIVE },
      });

      if (currentActive) {
        await tx.qRCode.update({
          where: { id: currentActive.id },
          data: { status: QRCodeStatus.REPLACED },
        });
      }

      // Create new ACTIVE QRCode
      const newQr = await tx.qRCode.create({
        data: {
          animalId: id,
          qrValue: newQrPayloadUrl,
          qrImageUrl: newQrDataUrl,
          status: QRCodeStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });

      // Record Audit Log
      await createAuditRecord(
        tx,
        userId,
        'REPLACE_QR_CODE',
        'QRCode',
        newQr.id,
        { previousQrId: currentActive?.id || null, status: 'REPLACED' },
        {
          newQrId: newQr.id,
          reason: dto.reason,
          notes: dto.notes || null,
        },
        auditContext,
      );

      return {
        success: true,
        message: `QR code for animal #${animal.animalNumber} has been successfully replaced.`,
        activeQr: newQr,
      };
    });
  }
  async deactivateQrCode(
    id: string,
    qrId: string,
    dto: DeactivateQrDto,
    userId?: string,
    auditContext?: AuditContext,
  ) {
    await verifyAnimalAccess(this.prisma, this.farmAccessService, id, userId, [
      'animal:update',
    ]);

    return await this.prisma.$transaction(async (tx) => {
      const qr = await tx.qRCode.findFirstOrThrow({
        where: { id: qrId, animalId: id },
      });

      const updated = await tx.qRCode.update({
        where: { id: qrId },
        data: { status: QRCodeStatus.REVOKED },
      });

      await createAuditRecord(
        tx,
        userId,
        'DEACTIVATE_QR_CODE',
        'QRCode',
        qrId,
        { status: qr.status },
        {
          status: QRCodeStatus.REVOKED,
          reason: dto.reason,
          notes: dto.notes || null,
        },
        auditContext,
      );

      return {
        success: true,
        message: 'QR code deactivated.',
        qr: updated,
      };
    });
  }
  async uploadAnimalPhoto(fileOrBase64: unknown) {
    if (!fileOrBase64) {
      throw new BadRequestException('No image file or image data provided.');
    }
    if (
      typeof fileOrBase64 !== 'string' &&
      !(
        typeof fileOrBase64 === 'object' &&
        fileOrBase64 !== null &&
        'buffer' in fileOrBase64
      )
    ) {
      throw new BadRequestException(
        'Invalid image data: expected a file upload or a base64 string.',
      );
    }

    const input =
      typeof fileOrBase64 === 'object' &&
      fileOrBase64 !== null &&
      'buffer' in fileOrBase64
        ? (fileOrBase64 as { buffer: Buffer }).buffer
        : fileOrBase64;

    const uploadRes = await this.cloudinaryService.uploadImage(
      input,
      'aits/animals',
    );
    return {
      success: true,
      imageUrl: uploadRes.secureUrl,
      publicId: uploadRes.publicId,
    };
  }
}
