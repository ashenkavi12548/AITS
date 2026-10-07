import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QRCodeStatus } from '@prisma/client';

@Injectable()
export class QrService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Activates a QR code for an animal, ensuring ONLY ONE active QR code exists.
   * Runs inside a Prisma transaction to prevent race conditions.
   */
  async activateQrCode(animalId: string, qrValue: string, qrImageUrl: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Mark existing ACTIVE QR codes for this animal as REPLACED
      await tx.qRCode.updateMany({
        where: {
          animalId,
          status: QRCodeStatus.ACTIVE,
        },
        data: {
          status: QRCodeStatus.REPLACED,
        },
      });

      // 2. Create and activate the new QR code record
      const newQrCode = await tx.qRCode.create({
        data: {
          animalId,
          qrValue,
          qrImageUrl,
          status: QRCodeStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });

      return newQrCode;
    });
  }

  /**
   * Retrieves QR code history for an animal.
   */
  async getAnimalQrHistory(animalId: string) {
    return this.prisma.qRCode.findMany({
      where: { animalId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
