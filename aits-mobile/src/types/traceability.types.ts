export type ActivityType =
  | 'FEEDING'
  | 'WEIGHT_CHECK'
  | 'HEALTH_CHECK'
  | 'GENERAL_OBSERVATION';

export type ActivitySession = 'MORNING' | 'EVENING' | 'AFTERNOON' | 'NIGHT';

export type ActivityStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';

export interface DailyActivity {
  id: string;
  animalId: string;
  animalTag: string;
  animalName: string;
  farmId: string;
  farmName: string;
  activityType: ActivityType;
  activityDate: string; // YYYY-MM-DD
  activityTime: string; // HH:mm
  session: ActivitySession;
  status: ActivityStatus;
  notes?: string;
  recordedBy: string;
  createdAt: string;

  // Feeding fields
  feedType?: string;
  feedName?: string;
  quantity?: number;
  unit?: string;
  feedingMethod?: string;

  // Weight check field
  weightKg?: number;

  // Health check fields
  observation?: string;
  temperature?: number;
  healthStatus?: string;
  symptoms?: string;
  requiresVet?: boolean;
}


export type TimelineCategory =
  | 'IDENTITY'
  | 'FARM'
  | 'FEEDING'
  | 'MILK_PRODUCTION'
  | 'HEALTH'
  | 'BREEDING'
  | 'PREGNANCY'
  | 'CALVING'
  | 'DOCUMENTS';

export interface LifetimeTimelineEvent {
  id: string;
  animalId: string;
  dateTime: string;
  category: TimelineCategory;
  title: string;
  resultOrQuantity?: string;
  farmName: string;
  recordedBy: string;
  status: 'COMPLETED' | 'SCHEDULED' | 'CANCELLED' | 'IN_TRANSIT';
  originalRecordUrl?: string;
  notes?: string;
}

export type MovementStatus =
  | 'SCHEDULED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type MovementReason =
  | 'PERMANENT_TRANSFER'
  | 'TEMPORARY_TRANSFER'
  | 'VETERINARY_VISIT'
  | 'BREEDING_PURPOSE'
  | 'GRAZING'
  | 'SALE_OR_MARKET'
  | 'RETURN_TO_ORIGINAL_FARM'
  | 'OTHER';

export interface FarmMovement {
  id: string;
  animalId: string;
  animalTag: string;
  animalName: string;
  animalHealthStatus?: string;
  animalIsDeceased?: boolean;
  animalIsQuarantined?: boolean;
  fromFarmId: string;
  fromFarmName: string;
  toFarmId: string;
  toFarmName: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  expectedArrivalDate: string;
  expectedArrivalTime: string;
  actualArrivalDate?: string;
  actualArrivalTime?: string;
  reason: MovementReason;
  status: MovementStatus;
  vehicleNumber?: string;
  driverName?: string;
  driverContact?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface TraceabilityOverviewStats {
  activitiesRecordedToday: number;
  animalsFedToday: number;
  animalsMilkedToday: number;
  totalMorningMilkLitres: number;
  totalEveningMilkLitres: number;
  animalsMovedThisMonth: number;
  activitiesRequiringAttention: number;
}

export interface DailyActivityFilters {
  search?: string;
  farmId?: string;
  animalId?: string;
  startDate?: string;
  endDate?: string;
  activityType?: ActivityType | 'ALL';
  session?: ActivitySession | 'ALL';
  status?: ActivityStatus | 'ALL';
  staffName?: string;
  sortBy?: 'activityDate' | 'createdAt' | 'animalTag';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FarmMovementFilters {
  search?: string;
  animalId?: string;
  fromFarmId?: string;
  toFarmId?: string;
  status?: MovementStatus | 'ALL';
  reason?: MovementReason | 'ALL';
  startDate?: string;
  endDate?: string;
  sortBy?: 'departureDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LifetimeFilters {
  category?: TimelineCategory | 'ALL';
  startDate?: string;
  endDate?: string;
  sortOrder?: 'newest' | 'oldest';
}
