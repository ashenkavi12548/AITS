export type ReportType =
  | 'OVERVIEW'
  | 'PRODUCTION'
  | 'HEALTH'
  | 'FEEDING'
  | 'BREEDING'
  | 'TRACEABILITY'
  | 'ANIMAL_LIFETIME';

export type ReportFileFormat = 'PDF' | 'CSV' | 'PRINT';

export type ReportTab =
  | 'overview'
  | 'production'
  | 'health'
  | 'feeding'
  | 'breeding'
  | 'traceability';

export interface ReportFilters {
  farmId: string;
  startDate: string;
  endDate: string;
  animalId?: string;
  breed?: string;
  gender?: string;
  animalStatus?: string;
  reportStatus?: string;
  diagnosis?: string;
  pregnancyStatus?: string;
  compareWithPrevious: boolean;
  searchQuery?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportSummaryItem {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  previousValue?: number | string;
  changePercentage?: number | null;
  changeDirection?: 'increase' | 'decrease' | 'neutral';
  isPositive?: boolean;
  description: string;
  iconName?: string;
}

export interface ChartDataPoint {
  name: string;
  label?: string;
  date?: string;
  category?: string;
  value?: number;
  previousValue?: number;
  morning?: number;
  evening?: number;
  total?: number;
  count?: number;
  percentage?: number;
  color?: string;
  [key: string]: string | number | undefined;
}

export interface ReportTableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ----------------------------------------------------
// Specific Analytics Responses
// ----------------------------------------------------

export interface ReportsOverviewResponse {
  summary: ReportSummaryItem[];
  animalStatusDistribution: ChartDataPoint[];
  milkProductionTrend: ChartDataPoint[];
  healthCasesByCategory: ChartDataPoint[];
  pregnancyStatusDistribution: ChartDataPoint[];
  farmMovementTrend: ChartDataPoint[];
  animalsByFarm: ChartDataPoint[];
  lastUpdated: string;
}

export interface ProductionRecordRow {
  id: string;
  date: string;
  animalTag: string;
  animalName: string;
  farmName: string;
  morningYield: number;
  eveningYield: number;
  totalYield: number;
  qualityStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REJECTED';
  recordedBy: string;
}

export interface ProductionAnalyticsResponse {
  summary: ReportSummaryItem[];
  dailyTrend: ChartDataPoint[];
  weeklyTrend: ChartDataPoint[];
  morningVsEvening: ChartDataPoint[];
  productionByFarm: ChartDataPoint[];
  topProducingAnimals: ChartDataPoint[];
  qualityDistribution: ChartDataPoint[];
  currentVsPreviousPeriod: ChartDataPoint[];
  tableData: PaginatedResponse<ProductionRecordRow>;
}

export interface HealthRecordRow {
  id: string;
  animalTag: string;
  animalName: string;
  farmName: string;
  diagnosis: string;
  caseDate: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  treatmentStatus: 'UNDER_TREATMENT' | 'RECOVERED' | 'MONITORING' | 'CLOSED';
  treatment?: string;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
  veterinarian: string;
  clinicalRemarks?: string;
  outcome: string;
}

export interface HealthAnalyticsResponse {
  summary: ReportSummaryItem[];
  casesOverTime: ChartDataPoint[];
  casesByDiagnosis: ChartDataPoint[];
  casesByFarm: ChartDataPoint[];
  treatmentStatusDistribution: ChartDataPoint[];
  vaccinationCompliance: ChartDataPoint[];
  quarantineStatusDistribution: ChartDataPoint[];
  treatmentOutcomes: ChartDataPoint[];
  tableData: PaginatedResponse<HealthRecordRow>;
}

export interface FeedingRecordRow {
  id: string;
  date: string;
  animalTag: string;
  animalName: string;
  farmName: string;
  feedingSession: string;
  feedCategory?: string;
  feedType: string;
  quantity?: number;
  actualQuantity?: number;
  unit: string;
  milkYield?: number | null;
  feedEfficiency?: number | null;
  status: string;
  recordedBy: string;
  remarks?: string;
  notes?: string;
}

export interface FeedingAnalyticsResponse {
  summary: ReportSummaryItem[];
  dailyFeedConsumption: ChartDataPoint[];
  feedConsumptionByType: ChartDataPoint[];
  morningVsEveningFeeding: ChartDataPoint[];
  feedUsageByFarm: ChartDataPoint[];
  feedUsageByAnimal: ChartDataPoint[];
  feedVsMilkComparison: ChartDataPoint[];
  tableData: PaginatedResponse<FeedingRecordRow>;
}

export interface BreedingRecordRow {
  id: string;
  animalTag: string;
  animalName: string;
  farmName: string;
  serviceDate: string;
  breedingMethod: 'ARTIFICIAL_INSEMINATION' | 'NATURAL' | 'NATURAL_MATING';
  technician: string;
  sireInfo?: string;
  pregnancyStatus: 'CONFIRMED' | 'PENDING' | 'NEGATIVE' | 'UNKNOWN';
  expectedCalvingDate?: string;
  calvingStatus?: 'NOT_DUE' | 'EXPECTED_SOON' | 'COMPLETED' | 'FAILED';
  calvingOutcome?: string;
  notes?: string;
}

export interface BreedingAnalyticsResponse {
  summary: ReportSummaryItem[];
  monthlyServices: ChartDataPoint[];
  aiVsNatural: ChartDataPoint[];
  pregnancyStatusDistribution: ChartDataPoint[];
  breedingSuccessRate: ChartDataPoint[];
  expectedCalvingsByMonth: ChartDataPoint[];
  resultsByFarm: ChartDataPoint[];
  tableData: PaginatedResponse<BreedingRecordRow>;
}

export interface TraceabilityRecordRow {
  id: string;
  dateTime: string;
  animalTag: string;
  animalName: string;
  farmName: string;
  eventType?: string;
  eventDescription?: string;
  movementStatus?: string;
  recordedBy: string;
  // Movement Manifest fields
  originFarm?: string;
  destinationFarm?: string;
  departureDateTime?: string;
  arrivalDateTime?: string;
  movementReason?: string;
  transportInfo?: string;
  authorizedBy?: string;
}

export interface TraceabilityAnalyticsResponse {
  summary: ReportSummaryItem[];
  dailyActivitiesByType: ChartDataPoint[];
  morningVsEveningActivities: ChartDataPoint[];
  activitiesOverTime: ChartDataPoint[];
  monthlyFarmMovements: ChartDataPoint[];
  movementReasons: ChartDataPoint[];
  sourceVsDestinationFarms: ChartDataPoint[];
  tableData: PaginatedResponse<TraceabilityRecordRow>;
}

export interface AnimalLifetimeReportResponse {
  animalId: string;
  tagNumber: string;
  name: string;
  breed: string;
  gender: string;
  dateOfBirth: string;
  currentFarm: string;
  healthRecordsCount: number;
  totalMilkProduced: number;
  movementsCount: number;
  breedingServicesCount: number;
  timeline: {
    id: string;
    date: string;
    category: 'HEALTH' | 'PRODUCTION' | 'BREEDING' | 'MOVEMENT' | 'GENERAL';
    title: string;
    description: string;
    actor: string;
  }[];
}

export interface ReportDownloadRequest {
  reportType: ReportType;
  reportId?: string;
  farmId: string;
  animalId?: string;
  startDate: string;
  endDate: string;
  status?: string;
  fileFormat: ReportFileFormat;
  pageOrientation?: 'AUTOMATIC' | 'PORTRAIT' | 'LANDSCAPE';
  includeSummaryCards?: boolean;
  includeCharts?: boolean;
  includeDetailedTable?: boolean;
  includeConfidentialLabel?: boolean;
  isExport?: boolean;
}

export interface ReportPreviewData {
  title: string;
  systemName: string;
  farmName: string;
  animalName?: string;
  dateRange: string;
  generatedAt: string;
  generatedBy: string;
  referenceNumber?: string;
  appliedFilters: Record<string, string>;
  summaryItems: ReportSummaryItem[];
  chartSummary: { title: string; dataPointsCount: number }[];
  recordsCount: number;
  sampleRows: Record<string, unknown>[];
}

export interface FiltersMetaResponse {
  farms: { id: string; name: string }[];
  breeds: string[];
  statuses: string[];
  diagnoses: string[];
  pregnancyStatuses: string[];
}

