import { MilkingSession } from '@prisma/client';

export interface FormattedMilkRecord {
  id: string;
  date: string;
  animalId: string;
  animalTag: string;
  animalName: string;
  species?: string | null;
  imageUrl?: string | null;
  farmId: string;
  farmName: string;
  session: MilkingSession;
  quantityLiters: number;
  qualityStatus: string;
  recordedBy: string;
  notes?: string;
  isVoided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilkNotesMetadata {
  userNotes?: string;
  isVoided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidedById?: string;
}
