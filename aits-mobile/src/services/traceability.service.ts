import api from './api';
import {
  DailyActivity,
  DailyActivityFilters,
  FarmMovement,
  FarmMovementFilters,
  LifetimeFilters,
} from '@/types/traceability.types';

const BASE = '/api/v1/traceability';

// ─── Shape helpers (API response → frontend type) ─────────────────────────────

function toFarmMovement(raw: Record<string, unknown>): FarmMovement {
  return raw as unknown as FarmMovement;
}

function toDailyActivity(raw: Record<string, unknown>): DailyActivity {
  return raw as unknown as DailyActivity;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const traceabilityService = {
  // ─── Farms & Animals ─────────────────────────────────────────────────────

  async getActiveFarms(): Promise<{ id: string; name: string; registrationNumber?: string; province?: string }[]> {
    const { data } = await api.get(`${BASE}/farms`);
    return data;
  },

  async getEligibleAnimals(farmId?: string): Promise<{
    id: string;
    tagNumber: string;
    name: string;
    gender: string;
    breed: string;
    dob: string;
    ageYears: number;
    ageMonths: number;
    farmId: string;
    farmName: string;
    status: string;
    isDeceased: boolean;
    isQuarantined: boolean;
    photoUrl?: string | null;
  }[]> {
    const params: Record<string, string> = {};
    if (farmId && farmId !== 'ALL') params.farmId = farmId;
    const { data } = await api.get(`${BASE}/animals`, { params });
    return data;
  },

  // ─── Overview ─────────────────────────────────────────────────────────────

  async getTraceabilityOverview(filters?: { farmId?: string; date?: string }) {
    const params: Record<string, string> = {};
    if (filters?.farmId && filters.farmId !== 'ALL') params.farmId = filters.farmId;
    if (filters?.date) params.date = filters.date;
    const { data } = await api.get(`${BASE}/overview`, { params });
    return data;
  },

  // ─── Daily Activities ─────────────────────────────────────────────────────

  async getDailyActivities(filters: DailyActivityFilters = {}): Promise<{
    data: DailyActivity[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params: Record<string, string> = {};
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);
    if (filters.search) params.search = filters.search;
    if (filters.farmId && filters.farmId !== 'ALL') params.farmId = filters.farmId;
    if (filters.animalId && filters.animalId !== 'ALL') params.animalId = filters.animalId;
    if (filters.activityType && filters.activityType !== 'ALL') params.activityType = filters.activityType;
    if (filters.session && filters.session !== 'ALL') params.session = filters.session;
    if (filters.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const { data } = await api.get(`${BASE}/daily-activities`, { params });
    return {
      data: (data.data ?? []).map(toDailyActivity),
      meta: data.meta,
    };
  },

  async getDailyActivityById(id: string): Promise<DailyActivity> {
    const { data } = await api.get(`${BASE}/daily-activities/${id}`);
    return toDailyActivity(data);
  },

  async createDailyActivity(payload: Partial<DailyActivity>): Promise<DailyActivity> {
    const { data } = await api.post(`${BASE}/daily-activities`, payload);
    return toDailyActivity(data);
  },

  async updateDailyActivity(id: string, payload: Partial<DailyActivity>): Promise<DailyActivity> {
    const { data } = await api.patch(`${BASE}/daily-activities/${id}`, payload);
    return toDailyActivity(data);
  },

  async deleteDailyActivity(id: string): Promise<boolean> {
    await api.delete(`${BASE}/daily-activities/${id}`);
    return true;
  },

  // ─── Lifetime Trace ───────────────────────────────────────────────────────

  async getAnimalLifetimeTrace(animalId: string, filters: LifetimeFilters = {}) {
    const params: Record<string, string> = {};
    if (filters.category && filters.category !== 'ALL') params.category = filters.category;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const { data } = await api.get(`${BASE}/lifetime/${animalId}`, { params });
    return data;
  },

  // ─── Farm Movements ───────────────────────────────────────────────────────

  async getFarmMovements(filters: FarmMovementFilters = {}): Promise<{
    data: FarmMovement[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params: Record<string, string> = {};
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);
    if (filters.search) params.search = filters.search;
    if (filters.animalId && filters.animalId !== 'ALL') params.animalId = filters.animalId;
    if (filters.fromFarmId && filters.fromFarmId !== 'ALL') params.fromFarmId = filters.fromFarmId;
    if (filters.toFarmId && filters.toFarmId !== 'ALL') params.toFarmId = filters.toFarmId;
    if (filters.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters.reason && filters.reason !== 'ALL') params.reason = filters.reason;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const { data } = await api.get(`${BASE}/farm-transfers`, { params });
    return {
      data: (data.data ?? []).map(toFarmMovement),
      meta: data.meta,
    };
  },

  async getFarmMovementById(id: string): Promise<FarmMovement> {
    const { data } = await api.get(`${BASE}/farm-transfers/${id}`);
    return toFarmMovement(data);
  },

  async createFarmMovement(payload: Partial<FarmMovement>): Promise<FarmMovement> {
    const { data } = await api.post(`${BASE}/farm-transfers`, payload);
    return toFarmMovement(data);
  },

  async markMovementInTransit(id: string): Promise<FarmMovement> {
    const { data } = await api.patch(`${BASE}/farm-transfers/${id}/in-transit`);
    return toFarmMovement(data);
  },

  async confirmMovementArrival(
    id: string,
    payload: { actualArrivalDate: string; actualArrivalTime: string },
  ): Promise<FarmMovement> {
    const { data } = await api.patch(`${BASE}/farm-transfers/${id}/confirm-arrival`, payload);
    return toFarmMovement(data);
  },

  async completeFarmMovement(id: string): Promise<FarmMovement> {
    const { data } = await api.patch(`${BASE}/farm-transfers/${id}/complete`);
    return toFarmMovement(data);
  },

  async cancelFarmMovement(id: string, reason?: string): Promise<FarmMovement> {
    const { data } = await api.patch(`${BASE}/farm-transfers/${id}/cancel`, { cancelReason: reason });
    return toFarmMovement(data);
  },
};
