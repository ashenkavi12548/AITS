import { ReportType, ReportFileFormat } from '../dto/report-query.dto';

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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportCatalogItem {
  id: string;
  title: string;
  description: string;
  category: ReportType;
  availableFormats: ReportFileFormat[];
  lastGenerated?: string;
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
  chartSummary: Array<{ title: string; dataPointsCount: number }>;
  recordsCount: number;
  sampleRows: Record<string, unknown>[];
}
