import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IdentifierType } from '@prisma/client';

@Injectable()
export class IdentifiersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers or updates an AnimalIdentifier.
   * If isPrimary is true, resets all other identifiers for this animal to isPrimary = false.
   */
  async registerIdentifier(
    animalId: string,
    identifierType: IdentifierType,
    identifierValue: string,
    isPrimary: boolean = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        // Demote all existing identifiers to secondary
        await tx.animalIdentifier.updateMany({
          where: { animalId },
          data: { isPrimary: false },
        });
      }

      // Create new identifier
      const identifier = await tx.animalIdentifier.create({
        data: {
          animalId,
          identifierType,
          identifierValue,
          isPrimary,
        },
      });

      return identifier;
    });
  }

  /**
   * Sets a specific identifier as primary for an animal.
   */
  async setPrimaryIdentifier(animalId: string, identifierId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.animalIdentifier.updateMany({
        where: { animalId },
        data: { isPrimary: false },
      });

      return tx.animalIdentifier.update({
        where: { id: identifierId },
        data: { isPrimary: true },
      });
    });
  }
}
