import api from './api';
import {
  ProductionRecord,
  ProductionQueryParams,
  ProductionSummaryStats,
  ProductionAnalyticsData,
  CreateProductionInput,
  UpdateProductionInput,
  PaginatedProductionResponse,
  FarmOption,
  AnimalOption,
} from '@/types/production';

export class ProductionService {
  /**
   * Fetch paginated and filtered production records from the server
   */
  async getRecords(params: ProductionQueryParams = {}): Promise<PaginatedProductionResponse> {
    const cleanParams: Record<string, string | number> = {};

    if (params.search?.trim()) cleanParams.search = params.search.trim();
    if (params.farmId) cleanParams.farmId = params.farmId;
    if (params.animalId) cleanParams.animalId = params.animalId;
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.session) cleanParams.session = params.session;
    if (params.qualityStatus) cleanParams.qualityStatus = params.qualityStatus;
    if (params.sortBy) cleanParams.sortBy = params.sortBy;
    if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;

    const response = await api.get<PaginatedProductionResponse>('/api/v1/milk-production', {
      params: cleanParams,
    });
    return response.data;
  }

  /**
   * Fetch live KPI summary statistics
   */
  async getSummaryStats(farmId?: string): Promise<ProductionSummaryStats> {
    const response = await api.get<ProductionSummaryStats>('/api/v1/milk-production/stats', {
      params: farmId ? { farmId } : undefined,
    });
    return response.data;
  }

  /**
   * Fetch Analytics payload for charts
   */
  async getAnalyticsData(farmId?: string): Promise<ProductionAnalyticsData> {
    const response = await api.get<ProductionAnalyticsData>('/api/v1/milk-production/analytics', {
      params: farmId ? { farmId } : undefined,
    });
    return response.data;
  }

  /**
   * Fetch available farms dropdown list
   */
  async getFarms(): Promise<FarmOption[]> {
    const response = await api.get<FarmOption[]>('/api/v1/milk-production/farms');
    return response.data;
  }

  /**
   * Fetch available animals dropdown list (optionally filtered by farm)
   */
  async getAnimals(farmId?: string): Promise<AnimalOption[]> {
    const response = await api.get<AnimalOption[]>('/api/v1/milk-production/animals', {
      params: farmId ? { farmId } : undefined,
    });
    return response.data;
  }

  /**
   * Fetch single milk production record by ID
   */
  async getRecordById(id: string): Promise<ProductionRecord> {
    const response = await api.get<ProductionRecord>(`/api/v1/milk-production/${id}`);
    return response.data;
  }

  /**
   * Create a new milk production record
   */
  async createRecord(input: CreateProductionInput): Promise<ProductionRecord> {
    // NOTE: recordedBy is intentionally NOT sent — the backend resolves it from
    // the authenticated JWT token via @CurrentUser('id'). Sending unknown fields
    // causes a 400 because the backend uses forbidNonWhitelisted: true.
    const payload: Record<string, unknown> = {
      animalId: input.animalId,
      farmId: input.farmId,
      productionDate: input.date,
      milkingSession: input.session,
      quantityLiters: Number(input.quantityLiters),
      milkQuality: input.qualityStatus || 'ACCEPTED',
    };

    if (input.notes) payload.notes = input.notes;

    const response = await api.post<ProductionRecord>('/api/v1/milk-production', payload);
    return response.data;
  }

  /**
   * Update an existing milk production record
   */
  async updateRecord(input: UpdateProductionInput): Promise<ProductionRecord> {
    const payload: Record<string, unknown> = {};
    if (input.animalId) payload.animalId = input.animalId;
    if (input.farmId) payload.farmId = input.farmId;
    if (input.date) payload.productionDate = input.date;
    if (input.session) payload.milkingSession = input.session;
    if (input.quantityLiters !== undefined) payload.quantityLiters = Number(input.quantityLiters);
    if (input.qualityStatus) payload.milkQuality = input.qualityStatus;
    if (input.notes !== undefined) payload.notes = input.notes;

    const response = await api.patch<ProductionRecord>(`/api/v1/milk-production/${input.id}`, payload);
    return response.data;
  }

  /**
   * Void / Cancel a milk production record with mandatory audit reason (non-destructive traceability)
   */
  async voidRecord(id: string, reason: string): Promise<boolean> {
    await api.post(`/api/v1/milk-production/${id}/void`, { reason });
    return true;
  }

  /**
   * Delete or void a milk production record by ID
   */
  async deleteRecord(id: string, reason = 'Record voided via user action'): Promise<boolean> {
    await api.post(`/api/v1/milk-production/${id}/void`, { reason });
    return true;
  }

  /**
   * Permanently delete a milk production record by ID
   */
  async deleteRecordPermanent(id: string): Promise<boolean> {
    await api.delete(`/api/v1/milk-production/${id}`);
    return true;
  }

  /**
   * Export current production records as a CSV download
   */
  exportCsv(records: ProductionRecord[]): void {
    if (!records || records.length === 0) return;

    const headers = [
      'Date',
      'Animal Tag',
      'Animal Name',
      'Farm',
      'Session',
      'Quantity (Liters)',
      'Quality Status',
      'Recorded By',
      'Notes',
    ];
    const rows = records.map((r) => [
      r.date,
      `"${r.animalTag}"`,
      `"${r.animalName}"`,
      `"${r.farmName}"`,
      r.session,
      r.quantityLiters,
      r.qualityStatus,
      `"${r.recordedBy}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `milk_production_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const productionService = new ProductionService();
