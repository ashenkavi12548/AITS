import {
  Prisma,
  FarmUserRole,
  Farm,
  FarmUser,
  FarmUserStatus,
} from '@prisma/client';
import { NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { AuditContext } from '../types/farms.types';
import { PrismaService } from '../../database/prisma.service';

const logger = new Logger('FarmsUtils');

/**
 * Helper: Record an immutable audit log entry
 */
export async function createAuditRecord(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null,
  auditContext?: AuditContext,
): Promise<void> {
  try {
    await tx.auditLog.create({
      data: {
        userId,
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
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`Failed to create audit log for ${action}: ${msg}`);
  }
}

export async function verifyFarmAccess(
  prisma: PrismaService,
  userId: string,
  farmId: string,
  requireRole?: FarmUserRole[],
): Promise<{
  farm: Farm;
  membership: FarmUser | null;
  isOwner: boolean;
}> {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId, deletedAt: null },
    include: {
      users: { where: { userId } },
    },
  });

  if (!farm) {
    throw new NotFoundException('Farm facility not found.');
  }

  const isOwner = farm.ownerId === userId;
  const membership = farm.users[0] || null;

  logger.debug(
    `[verifyFarmAccess] userId=${userId}, farmId=${farmId}, ` +
      `ownerId=${farm.ownerId}, isOwner=${isOwner}, ` +
      `membership=${membership ? `role=${membership.role}, status=${membership.status}` : 'null'}, ` +
      `requireRole=${JSON.stringify(requireRole)}`,
  );

  if (!isOwner && !membership) {
    throw new ForbiddenException(
      'Access denied. You do not belong to this farm facility.',
    );
  }

  if (!isOwner && membership?.status !== FarmUserStatus.ACTIVE) {
    throw new ForbiddenException(
      'Access revoked. Your account is inactive in this farm facility.',
    );
  }

  if (requireRole && requireRole.length > 0 && !isOwner) {
    if (!membership || !requireRole.includes(membership.role)) {
      throw new ForbiddenException(
        'Insufficient permissions to perform this operation on the farm facility.',
      );
    }
  }

  return { farm, membership, isOwner };
}
