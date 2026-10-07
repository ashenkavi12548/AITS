export type BreedingMethod = 'ARTIFICIAL_INSEMINATION' | 'NATURAL';

export type BreedingStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'PREGNANCY_CHECK_PENDING'
  | 'SUCCESSFUL'
  | 'UNSUCCESSFUL'
  | 'CANCELLED';

export type PregnancyCheckType = '60_DAY_CHECK' | '90_DAY_CHECK' | 'ADDITIONAL_CHECK';

export type PregnancyStatus =
  | 'NOT_CHECKED'
  | 'CONFIRMED'
  | 'NOT_PREGNANT'
  | 'RECHECK_REQUIRED'
  | 'PREGNANCY_LOST';

export type CalvingStatus =
  | 'EXPECTED'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'COMPLICATED'
  | 'ABORTED'
  | 'STILLBIRTH';

export interface BreedingRecord {
  id: string;
  serviceDate: string; // YYYY-MM-DD
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
  serviceMethod: BreedingMethod;
  attemptNumber: number;
  technician: string;
  status: BreedingStatus;
  notes?: string;

  // Artificial Insemination specific fields
  semenStrawId?: string;
  semenBatchNumber?: string;
  semenSupplier?: string;
  inseminationMethod?: string;

  // Natural Breeding specific fields
  bullId?: string;
  bullTag?: string;
  bullName?: string;
  bullBreed?: string;
  bullOwnerSource?: string;

  // Automated date calculations
  firstPregnancyCheckDate: string; // serviceDate + 60 days
  secondPregnancyCheckDate: string; // serviceDate + 90 days
  estimatedCalvingDate: string; // serviceDate + 283 days

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PregnancyCheck {
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
  checkType: PregnancyCheckType;
  checkMethod: string;
  pregnancyStatus: PregnancyStatus;
  pregnancyStageDays?: number;
  estimatedCalvingDate: string;
  technicianOrVet: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalvingRecord {
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
  calvingStatus: CalvingStatus;
  numberOfCalves: number;
  calfGender?: 'MALE' | 'FEMALE' | 'TWINS_MIXED';
  calfBirthWeightKg?: number;
  calfStatus?: 'HEALTHY' | 'WEAK' | 'STILLBORN';
  birthDifficulty?: 'EASY' | 'MODERATE' | 'SEVERE_DYSTOCIA';
  assistanceRequired: boolean;
  complications?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BreedingQueryParams {
  search?: string;
  farmId?: string;
  method?: BreedingMethod | '';
  status?: BreedingStatus | '';
  technician?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'serviceDate' | 'femaleAnimalTag' | 'farmName' | 'attemptNumber' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PregnancyQueryParams {
  search?: string;
  farmId?: string;
  checkType?: PregnancyCheckType | '';
  pregnancyStatus?: PregnancyStatus | '';
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?: 'checkDueDate' | 'femaleAnimalTag' | 'farmName' | 'pregnancyStatus';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CalvingQueryParams {
  search?: string;
  farmId?: string;
  calvingStatus?: CalvingStatus | '';
  expectedDateFrom?: string;
  expectedDateTo?: string;
  sortBy?: 'expectedCalvingDate' | 'actualCalvingDate' | 'motherAnimalTag' | 'calvingStatus';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BreedingSummaryStats {
  totalBreedingServices: number;
  pregnancyChecksPending: number;
  confirmedPregnancies: number;
  expectedCalvings: number;
  overdueActivities: number;
  breedingSuccessRate: number;
}

export interface PregnancySummaryStats {
  checksDueToday: number;
  checksDueThisWeek: number;
  confirmedPregnancies: number;
  rechecksRequired: number;
  overdueChecks: number;
}

export interface CalvingSummaryStats {
  expectedThisWeek: number;
  expectedThisMonth: number;
  completedCalvings: number;
  overdueCalvings: number;
  complicatedCalvings: number;
}

export interface UpcomingActivityItem {
  id: string;
  type: 'PREGNANCY_CHECK' | 'EXPECTED_CALVING' | 'OVERDUE_CHECK' | 'BREEDING_FOLLOWUP';
  title: string;
  animalTag: string;
  animalName: string;
  farmName: string;
  dueDate: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  details: string;
}

export interface MonthlyBreedingTrend {
  month: string;
  totalServices: number;
  aiServices: number;
  naturalServices: number;
}

export interface MethodComparison {
  method: string;
  count: number;
  color: string;
}

export interface PregnancyStatusDistribution {
  status: string;
  count: number;
  color: string;
}

export interface ExpectedCalvingByMonth {
  month: string;
  expectedCount: number;
}

export interface BreedingAnalyticsData {
  monthlyTrends: MonthlyBreedingTrend[];
  methodComparison: MethodComparison[];
  pregnancyDistribution: PregnancyStatusDistribution[];
  expectedCalvingsByMonth: ExpectedCalvingByMonth[];
}

export interface CreateBreedingInput {
  femaleAnimalId: string;
  farmId: string;
  serviceDate: string;
  serviceMethod: BreedingMethod;
  attemptNumber: number;
  technician: string;
  notes?: string;

  // AI fields
  semenStrawId?: string;
  semenBatchNumber?: string;
  bullId?: string;
  bullName?: string;
  bullBreed?: string;
  semenSupplier?: string;
  inseminationMethod?: string;

  // Natural Breeding fields
  bullTag?: string;
  bullOwnerSource?: string;

  // Dates
  firstPregnancyCheckDate?: string;
  secondPregnancyCheckDate?: string;
  estimatedCalvingDate?: string;
}

export interface UpdateBreedingInput extends Partial<CreateBreedingInput> {
  id: string;
  status?: BreedingStatus;
}

export interface CreatePregnancyCheckInput {
  breedingServiceId?: string;
  femaleAnimalId: string;
  farmId: string;
  checkDate: string;
  checkType: PregnancyCheckType;
  checkMethod: string;
  pregnancyStatus: PregnancyStatus;
  pregnancyStageDays?: number;
  technicianOrVet: string;
  estimatedCalvingDate?: string;
  notes?: string;
}

export interface CreateCalvingInput {
  pregnancyCheckId?: string;
  motherAnimalId: string;
  farmId: string;
  expectedCalvingDate: string;
  actualCalvingDate?: string;
  calvingStatus: CalvingStatus;
  numberOfCalves: number;
  calfGender?: 'MALE' | 'FEMALE' | 'TWINS_MIXED';
  calfBirthWeightKg?: number;
  calfStatus?: 'HEALTHY' | 'WEAK' | 'STILLBORN';
  birthDifficulty?: 'EASY' | 'MODERATE' | 'SEVERE_DYSTOCIA';
  assistanceRequired: boolean;
  complications?: string;
  recordedBy?: string;
  notes?: string;
}

export interface FemaleAnimalOption {
  id: string;
  tag: string;
  name: string;
  breed: string;
  dob: string;
  farmId: string;
  farmName: string;
  reproductiveStatus: string;
}

export interface BullOption {
  id: string;
  tag: string;
  name: string;
  breed: string;
  farmId: string;
  farmName: string;
  source: string;
}

export interface SemenStrawOption {
  id: string;
  strawId: string;
  batchNumber: string;
  bullName: string;
  bullBreed: string;
  supplier: string;
  quantityAvailable: number;
}
