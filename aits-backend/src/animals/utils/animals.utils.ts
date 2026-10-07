import { Prisma } from '@prisma/client';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { AuditContext } from '../types/animals.types';
import { PrismaService } from '../../database/prisma.service';

const logger = new Logger('AnimalsUtils');

export async function verifyAnimalAccess(
  prisma: PrismaService,
  farmAccessService: FarmAccessService,
  animalId: string,
  userId?: string,
  requiredPermissions: string[] = [],
) {
  const animal = await prisma.animal.findUnique({
    where: { id: animalId, deletedAt: null },
    include: {
      farm: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          registrationNumber: true,
          city: true,
          district: true,
          province: true,
          farmType: true,
        },
      },
      identifiers: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      },
      qrCodes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!animal) {
    throw new NotFoundException(
      `The requested animal profile could not be found.`,
    );
  }

  if (userId) {
    const { farmIds } = await farmAccessService.resolveUserAccessibleFarms(
      userId,
      requiredPermissions,
    );
    if (!farmIds.includes(animal.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to access animals from this farm facility.',
      );
    }
  }

  return animal;
}
export async function createAuditRecord(
  tx: Prisma.TransactionClient,
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  oldValues: unknown = null,
  newValues: unknown = null,
  auditContext?: AuditContext,
) {
  try {
    await tx.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId,
        oldValues: oldValues
          ? (oldValues as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        newValues: newValues
          ? (newValues as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ipAddress: auditContext?.ipAddress || null,
        userAgent: auditContext?.userAgent || null,
      },
    });
  } catch (err: unknown) {
    logger.warn(`Failed to create audit log for ${action}: ${String(err)}`);
  }
}
