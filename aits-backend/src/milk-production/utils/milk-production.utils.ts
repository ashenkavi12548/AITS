import { MilkingSession } from '@prisma/client';
import {
  FormattedMilkRecord,
  MilkNotesMetadata,
} from '../types/milk-production.types';

/** UUID v4 regex — used to guard UUID-column lookups from non-UUID strings. */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Helper to pack/unpack metadata stored inside notes JSON
 */
export function parseNotesMetadata(rawNotes?: string | null): {
  userNotes: string;
  meta: MilkNotesMetadata;
} {
  if (!rawNotes) return { userNotes: '', meta: {} };
  try {
    if (rawNotes.startsWith('{') && rawNotes.endsWith('}')) {
      const parsed = JSON.parse(rawNotes) as MilkNotesMetadata;
      return {
        userNotes: parsed.userNotes || '',
        meta: parsed,
      };
    }
  } catch {
    // Not JSON, return as plain text
  }
  return { userNotes: rawNotes, meta: {} };
}

export function serializeNotesMetadata(data: MilkNotesMetadata): string {
  return JSON.stringify(data);
}

/**
 * Helper: Parse date string into UTC midday Date to avoid timezone-shift issues
 */
export function parseDateString(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  const clean = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return new Date(`${clean}T12:00:00.000Z`);
  }
  return new Date(clean);
}

/** Input shape for the formatRecord function — matches the Prisma include used by queries. */
export interface MilkProductionRecordInput {
  id: string;
  productionDate: Date;
  quantityLiters: number;
  milkingSession: MilkingSession;
  milkQuality: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  animal: {
    id: string;
    animalNumber: string;
    name: string | null;
    species?: string | null;
    imageUrl?: string | null;
  };
  farm: { id: string; name: string };
  recordedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Format Prisma record into the frontend contract
 */
export function formatRecord(
  r: MilkProductionRecordInput,
): FormattedMilkRecord {
  const recordedByName =
    `${r.recordedBy.firstName} ${r.recordedBy.lastName}`.trim();
  const yyyy = r.productionDate.getUTCFullYear();
  const mm = String(r.productionDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(r.productionDate.getUTCDate()).padStart(2, '0');
  const dateFormatted = `${yyyy}-${mm}-${dd}`;

  const { userNotes, meta } = parseNotesMetadata(r.notes);

  return {
    id: r.id,
    date: dateFormatted,
    animalId: r.animal.id,
    animalTag: r.animal.animalNumber,
    animalName: r.animal.name || r.animal.animalNumber,
    species: r.animal.species,
    imageUrl: r.animal.imageUrl,
    farmId: r.farm.id,
    farmName: r.farm.name,
    session: r.milkingSession,
    quantityLiters: Number(r.quantityLiters),
    qualityStatus: r.milkQuality || 'ACCEPTED',
    recordedBy: recordedByName || r.recordedBy.email,
    notes: userNotes,
    isVoided: !!meta.isVoided,
    voidReason: meta.voidReason,
    voidedAt: meta.voidedAt,
    voidedBy: meta.voidedBy,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
