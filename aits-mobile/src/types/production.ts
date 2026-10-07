export type MilkingSession = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type MilkQualityStatus = 'ACCEPTED' | 'REJECTED' | 'PENDING';

export interface ProductionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  animalId: string;
  animalTag: string;
  animalName: string;
  farmId: string;
  farmName: string;
  session: MilkingSession;
  quantityLiters: number;
  qualityStatus: MilkQualityStatus;
  recordedBy: string;
  notes?: string;
  isVoided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoidProductionInput {
  id: string;
  reason: string;
}

export interface ProductionQueryParams {
  search?: string;
  farmId?: string;
  animalId?: string;
  startDate?: string;
  endDate?: string;
  session?: MilkingSession | '';
  qualityStatus?: MilkQualityStatus | '';
  sortBy?: 'date' | 'quantityLiters' | 'animalTag' | 'farmName' | 'qualityStatus';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductionSummaryStats {
  todayTotalLiters: number;
  morningTotalLiters: number;
  eveningTotalLiters: number;
  animalsMilked: number;
  averagePerAnimal: number;
  percentageChangeVsYesterday: number;
}

export interface DailyProductionTrend {
  date: string;
  label: string;
  morningLiters: number;
  eveningLiters: number;
  totalLiters: number;
}

export interface SessionComparison {
  session: string;
  liters: number;
  color: string;
}

export interface TopAnimalProducer {
  animalId: string;
  animalTag: string;
  animalName: string;
  farmName: string;
  totalLiters: number;
  averagePerSession: number;
}

export interface FarmProductionShare {
  farmId: string;
  farmName: string;
  liters: number;
  percentage: number;
  color: string;
}

export interface ProductionAnalyticsData {
  dailyTrends: DailyProductionTrend[];
  sessionComparison: SessionComparison[];
  topProducers: TopAnimalProducer[];
  farmShares: FarmProductionShare[];
}

export interface CreateProductionInput {
  date: string;
  animalId: string;
  farmId: string;
  session: MilkingSession;
  quantityLiters: number;
  qualityStatus: MilkQualityStatus;
  notes?: string;
  recordedBy?: string;
}

export interface UpdateProductionInput extends Partial<CreateProductionInput> {
  id: string;
}

export interface PaginatedProductionResponse {
  data: ProductionRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FarmOption {
  id: string;
  name: string;
}

export interface AnimalOption {
  id: string;
  tag: string;
  name: string;
  farmId: string;
  farmName: string;
}
