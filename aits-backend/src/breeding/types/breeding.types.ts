export interface NotesMetadata {
  notes?: string;
  attemptNumber?: number;
  status?: string;
  semenStrawId?: string;
  semenBatchNumber?: string;
  semenSupplier?: string;
  inseminationMethod?: string;
  bullId?: string;
  bullTag?: string;
  bullName?: string;
  bullBreed?: string;
  bullOwnerSource?: string;
  firstPregnancyCheckDate?: string;
  secondPregnancyCheckDate?: string;
  estimatedCalvingDate?: string;
  checkType?: string;
  checkMethod?: string;
  pregnancyStageDays?: number;
  technicianOrVet?: string;
  pregnancyStatus?: string;
  calvingStatus?: string;
  calfGender?: string;
  calfBirthWeightKg?: number;
  calfStatus?: string;
  birthDifficulty?: string;
  assistanceRequired?: boolean;
  recordedBy?: string;
}

export interface FormattedBreedingRecord {
  id: string;
  serviceDate: string;
  femaleAnimalId: string;
  femaleAnimalTag: string;
  femaleAnimalName: string;
  species?: string | null;
  imageUrl?: string | null;
  femaleBreed: string;
  femaleDob: string;
  reproductiveStatus: string;
  farmId: string;
  farmName: string;
  serviceMethod: string;
  attemptNumber: number;
  technician: string;
  status: string;
  notes?: string;
  semenStrawId?: string;
  semenBatchNumber?: string;
  semenSupplier?: string;
  inseminationMethod?: string;
  bullId?: string;
  bullTag?: string;
  bullName?: string;
  bullBreed?: string;
  bullOwnerSource?: string;
  firstPregnancyCheckDate: string;
  secondPregnancyCheckDate: string;
  estimatedCalvingDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedPregnancyCheck {
  id: string;
  breedingServiceId: string;
  femaleAnimalId: string;
  femaleAnimalTag: string;
  femaleAnimalName: string;
  species?: string | null;
  imageUrl?: string | null;
  farmId: string;
  farmName: string;
  lastServiceDate: string;
  checkDate: string;
  checkType: string;
  checkMethod: string;
  pregnancyStatus: string;
  pregnancyStageDays?: number;
  estimatedCalvingDate: string;
  technicianOrVet: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedCalvingRecord {
  id: string;
  pregnancyCheckId?: string;
  motherAnimalId: string;
  motherAnimalTag: string;
  motherAnimalName: string;
  species?: string | null;
  imageUrl?: string | null;
  farmId: string;
  farmName: string;
  expectedCalvingDate: string;
  actualCalvingDate?: string;
  calvingStatus: string;
  numberOfCalves: number;
  calfGender?: string;
  calfBirthWeightKg?: number;
  calfStatus?: string;
  birthDifficulty?: string;
  assistanceRequired: boolean;
  complications?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
