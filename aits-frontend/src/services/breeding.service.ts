import api from './api';
import {
  BreedingRecord,
  PregnancyCheck,
  CalvingRecord,
  BreedingQueryParams,
  PregnancyQueryParams,
  CalvingQueryParams,
  BreedingSummaryStats,
  PregnancySummaryStats,
  CalvingSummaryStats,
  BreedingAnalyticsData,
  UpcomingActivityItem,
  CreateBreedingInput,
  UpdateBreedingInput,
  CreatePregnancyCheckInput,
  CreateCalvingInput,
  FemaleAnimalOption,
  BullOption,
  SemenStrawOption,
} from '@/types/breeding';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class BreedingService {
  /**
   * Fetch breeding dashboard summary statistics
   */
  async getBreedingSummary(farmId?: string): Promise<BreedingSummaryStats> {
    const response = await api.get<BreedingSummaryStats>('/api/v1/breeding/stats', {
      params: farmId ? { farmId } : undefined,
    });
    return response.data;
  }

  /**
   * Fetch paginated and filtered breeding services
   */
  async getBreedingRecords(
    params: BreedingQueryParams = {},
  ): Promise<PaginatedResponse<BreedingRecord>> {
    const cleanParams: Record<string, string | number> = {};

    if (params.search?.trim()) cleanParams.search = params.search.trim();
    if (params.farmId) cleanParams.farmId = params.farmId;
    if (params.method) cleanParams.method = params.method;
    if (params.status) cleanParams.status = params.status;
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.sortBy) cleanParams.sortBy = params.sortBy;
    if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;

    const response = await api.get<PaginatedResponse<BreedingRecord>>(
      '/api/v1/breeding',
      { params: cleanParams },
    );
    return response.data;
  }

  async getBreedingRecordById(id: string): Promise<BreedingRecord> {
    const response = await api.get<BreedingRecord>(`/api/v1/breeding/${id}`);
    return response.data;
  }

  async createBreedingRecord(input: CreateBreedingInput): Promise<BreedingRecord> {
    const response = await api.post<BreedingRecord>('/api/v1/breeding', input);
    return response.data;
  }

  async updateBreedingRecord(
    id: string,
    input: UpdateBreedingInput,
  ): Promise<BreedingRecord> {
    const response = await api.patch<BreedingRecord>(
      `/api/v1/breeding/${id}`,
      input,
    );
    return response.data;
  }

  async deleteBreedingRecord(id: string): Promise<boolean> {
    await api.delete(`/api/v1/breeding/${id}`);
    return true;
  }

  /**
   * Pregnancy Tracking APIs
   */
  async getPregnancySummary(farmId?: string): Promise<PregnancySummaryStats> {
    const response = await api.get<PregnancySummaryStats>(
      '/api/v1/breeding/pregnancies/stats',
      { params: farmId ? { farmId } : undefined },
    );
    return response.data;
  }

  async getPregnancyChecks(
    params: PregnancyQueryParams = {},
  ): Promise<PaginatedResponse<PregnancyCheck>> {
    const cleanParams: Record<string, string | number> = {};

    if (params.search?.trim()) cleanParams.search = params.search.trim();
    if (params.farmId) cleanParams.farmId = params.farmId;
    if (params.checkType) cleanParams.checkType = params.checkType;
    if (params.pregnancyStatus) cleanParams.pregnancyStatus = params.pregnancyStatus;
    if (params.dueDateFrom) cleanParams.dueDateFrom = params.dueDateFrom;
    if (params.dueDateTo) cleanParams.dueDateTo = params.dueDateTo;
    if (params.sortBy) cleanParams.sortBy = params.sortBy;
    if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;

    const response = await api.get<PaginatedResponse<PregnancyCheck>>(
      '/api/v1/breeding/pregnancies',
      { params: cleanParams },
    );
    return response.data;
  }

  async createPregnancyCheck(
    input: CreatePregnancyCheckInput,
  ): Promise<PregnancyCheck> {
    const response = await api.post<PregnancyCheck>(
      '/api/v1/breeding/pregnancies',
      input,
    );
    return response.data;
  }

  /**
   * Calving Management APIs
   */
  async getCalvingSummary(farmId?: string): Promise<CalvingSummaryStats> {
    const response = await api.get<CalvingSummaryStats>(
      '/api/v1/breeding/calvings/stats',
      { params: farmId ? { farmId } : undefined },
    );
    return response.data;
  }

  async getCalvingRecords(
    params: CalvingQueryParams = {},
  ): Promise<PaginatedResponse<CalvingRecord>> {
    const cleanParams: Record<string, string | number> = {};

    if (params.search?.trim()) cleanParams.search = params.search.trim();
    if (params.farmId) cleanParams.farmId = params.farmId;
    if (params.calvingStatus) cleanParams.calvingStatus = params.calvingStatus;
    if (params.expectedDateFrom) cleanParams.expectedDateFrom = params.expectedDateFrom;
    if (params.expectedDateTo) cleanParams.expectedDateTo = params.expectedDateTo;
    if (params.sortBy) cleanParams.sortBy = params.sortBy;
    if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;

    const response = await api.get<PaginatedResponse<CalvingRecord>>(
      '/api/v1/breeding/calvings',
      { params: cleanParams },
    );
    return response.data;
  }

  async createCalvingRecord(input: CreateCalvingInput): Promise<CalvingRecord> {
    const response = await api.post<CalvingRecord>(
      '/api/v1/breeding/calvings',
      input,
    );
    return response.data;
  }

  /**
   * Helper dropdown getters
   */
  async getEligibleFemaleAnimals(farmId?: string): Promise<FemaleAnimalOption[]> {
    const response = await api.get<FemaleAnimalOption[]>(
      '/api/v1/breeding/options/females',
      { params: farmId ? { farmId } : undefined },
    );
    return response.data;
  }

  async getAvailableBulls(farmId?: string): Promise<BullOption[]> {
    const response = await api.get<BullOption[]>(
      '/api/v1/breeding/options/bulls',
      { params: farmId ? { farmId } : undefined },
    );
    return response.data;
  }

  async getSemenInventory(farmId?: string): Promise<SemenStrawOption[]> {
    const response = await api.get<SemenStrawOption[]>(
      '/api/v1/breeding/options/semen-straws',
      { params: farmId ? { farmId } : undefined },
    );
    return response.data;
  }

  async getUpcomingActivities(): Promise<UpcomingActivityItem[]> {
    const response = await api.get<UpcomingActivityItem[]>(
      '/api/v1/breeding/upcoming',
    );
    return response.data;
  }

  async getAnalyticsData(): Promise<BreedingAnalyticsData> {
    const response = await api.get<BreedingAnalyticsData>(
      '/api/v1/breeding/analytics',
    );
    return response.data;
  }

  exportCsv(records: BreedingRecord[]): void {
    if (!records || records.length === 0) return;

    const headers = [
      'Service Date',
      'Female Tag',
      'Female Name',
      'Farm',
      'Method',
      'Bull / Semen',
      'Attempt #',
      'Technician',
      'Status',
      'Estimated Calving',
    ];
    const rows = records.map((r) => [
      r.serviceDate,
      `"${r.femaleAnimalTag}"`,
      `"${r.femaleAnimalName}"`,
      `"${r.farmName}"`,
      r.serviceMethod,
      `"${r.bullName || r.semenStrawId || 'N/A'}"`,
      r.attemptNumber,
      `"${r.technician}"`,
      r.status,
      r.estimatedCalvingDate,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `breeding_records_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const breedingService = new BreedingService();
