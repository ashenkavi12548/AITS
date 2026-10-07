/**
 * Shared Animal domain types.
 * These are consumed by services, hooks, and components across the animals feature.
 */

export type AnimalStatus =
  | 'ACTIVE'
  | 'SOLD'
  | 'TRANSFERRED'
  | 'DECEASED'
  | 'MISSING'
  | 'QUARANTINED';

export type AnimalGender = 'MALE' | 'FEMALE';

export type IdentifierType = 'QR' | 'RFID' | 'EAR_TAG' | 'NATIONAL_ID' | 'OTHER';

export type QrCodeStatus = 'ACTIVE' | 'INACTIVE' | 'REVOKED' | 'REPLACED';

export interface AnimalFarm {
  id: string;
  name: string;
  registrationNumber: string;
  city?: string;
  district?: string;
  province?: string;
}

export interface AnimalActiveQr {
  id: string;
  qrValue: string;
  qrImageUrl: string;
  status?: string;
}

export interface AnimalPrimaryIdentifier {
  id: string;
  identifierType: string;
  identifierValue: string;
}

export interface AnimalItem {
  id: string;
  farmId: string;
  animalNumber: string;
  name?: string | null;
  species: string;
  breed: string;
  gender: AnimalGender;
  dateOfBirth: string;
  color?: string | null;
  weight?: number | null;
  imageUrl?: string | null;
  status: AnimalStatus;
  registrationDate: string;
  farm?: AnimalFarm;
  activeQr?: AnimalActiveQr | null;
  primaryIdentifier?: AnimalPrimaryIdentifier | null;
}

export interface AnimalIdentifierItem {
  id: string;
  animalId: string;
  identifierType: IdentifierType;
  identifierValue: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface QRCodeItem {
  id: string;
  animalId: string;
  qrValue: string;
  qrImageUrl: string;
  status: QrCodeStatus;
  generatedAt: string;
  activatedAt?: string | null;
  createdAt: string;
}

export interface AnimalParentRef {
  id: string;
  animalNumber: string;
  name?: string | null;
  breed: string;
  status: string;
}

export interface AnimalModuleCounts {
  healthRecords: number;
  milkProduction: number;
  femaleBreedingRecords: number;
  maleBreedingRecords: number;
  movements: number;
  documents: number;
}

export interface AnimalDetailResponse extends AnimalItem {
  createdAt: string;
  mother?: AnimalParentRef | null;
  father?: AnimalParentRef | null;
  offspringCount: number;
  identifiers: AnimalIdentifierItem[];
  qrHistory: QRCodeItem[];
  moduleCounts: AnimalModuleCounts;
}

export interface HerdStatsResponse {
  totalAnimals: number;
  activeAnimals: number;
  quarantinedAnimals: number;
  deceasedAnimals: number;
  transferredAnimals: number;
  soldAnimals: number;
  missingAnimals: number;
  maleCount: number;
  femaleCount: number;
}

export interface AnimalHistoryItem {
  id: string;
  action: string;
  entityType: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface AnimalsListResponse {
  data: AnimalItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AnimalQrResponse {
  animalId: string;
  animalNumber: string;
  name?: string | null;
  breed: string;
  qrValue: string;
  qrImageUrl: string;
  activeQr: QRCodeItem;
  qrHistory: QRCodeItem[];
}

export interface CreateAnimalInput {
  animalNumber: string;
  name?: string;
  species?: string;
  breed?: string;
  gender?: AnimalGender;
  dateOfBirth?: string;
  color?: string;
  weight?: number;
  imageUrl?: string;
  farmId?: string;
  motherId?: string;
  fatherId?: string;
  motherTagOrId?: string;
  fatherTagOrId?: string;
  rfidNumber?: string;
  registrationSource?: string;
  status?: string;
  notes?: string;
}

export interface CreateAnimalResponse {
  success: boolean;
  message: string;
  animal: AnimalItem & {
    qrCode?: {
      id: string;
      qrValue: string;
      qrImageUrl: string;
    };
  };
}

export interface UpdateAnimalStatusInput {
  status: AnimalStatus;
  reason: string;
  notes?: string;
}

export interface CreateIdentifierInput {
  identifierType: IdentifierType;
  identifierValue: string;
  isPrimary?: boolean;
}

export interface ReplaceQrInput {
  reason: string;
  notes?: string;
}

export interface AnimalQueryParams {
  search?: string;
  farmId?: string;
  species?: string;
  breed?: string;
  gender?: string;
  status?: string;
  excludeStatus?: string;
  identifierType?: string;
  sortBy?: 'animalNumber' | 'name' | 'dateOfBirth' | 'createdAt' | 'weight';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  hasEligibleDiagnosis?: boolean;
}
