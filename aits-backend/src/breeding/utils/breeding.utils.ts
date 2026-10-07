import { NotesMetadata } from '../types/breeding.types';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveAnimal(
  prisma: PrismaService,
  animalIdOrTag: string,
  targetFarmId?: string,
) {
  const trimmed = animalIdOrTag.trim();
  const isUuid = UUID_REGEX.test(trimmed);

  const orConditions: Prisma.AnimalWhereInput[] = [
    { animalNumber: { equals: trimmed, mode: 'insensitive' } },
  ];
  if (isUuid) {
    orConditions.push({ id: trimmed });
  }

  const where: Prisma.AnimalWhereInput = {
    deletedAt: null,
    OR: orConditions,
  };
  if (targetFarmId) {
    where.farmId = targetFarmId;
  }

  const animal = await prisma.animal.findFirst({
    where,
    include: { farm: { select: { id: true, name: true } } },
  });

  if (!animal) {
    throw new NotFoundException(
      `Animal "${animalIdOrTag}" was not found${targetFarmId ? ' on the specified farm facility' : ''}.`,
    );
  }

  return animal;
}

export function parseDateString(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  const clean = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return new Date(`${clean}T12:00:00.000Z`);
  }
  return new Date(clean);
}

export function formatDateString(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Helper to pack/unpack metadata stored inside notes JSON
 */
export function parseNotesMetadata(rawNotes?: string | null): {
  userNotes: string;
  meta: NotesMetadata;
} {
  if (!rawNotes) return { userNotes: '', meta: {} };
  try {
    if (rawNotes.startsWith('{') && rawNotes.endsWith('}')) {
      const parsed = JSON.parse(rawNotes) as NotesMetadata;
      return {
        userNotes: parsed.notes || '',
        meta: parsed,
      };
    }
  } catch {
    // Not JSON, return as plain text
  }
  return { userNotes: rawNotes, meta: {} };
}
