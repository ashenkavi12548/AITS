import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';
import {
  ProductionRecord,
  ProductionQueryParams,
  ProductionSummaryStats,
  ProductionAnalyticsData,
  CreateProductionInput,
  UpdateProductionInput,
  FarmOption,
  AnimalOption,
} from '@/types/production';
import { productionService } from '@/services/production.service';

/** Extract a readable message from any error, including Axios validation errors. */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  const axiosErr = err as AxiosError<{ message?: string | string[]; error?: string }>;
  if (axiosErr.response?.data) {
    const data = axiosErr.response.data;
    if (Array.isArray(data.message)) return data.message.join('; ');
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function useProduction() {
  // Query & Filter State
  const [params, setParams] = useState<ProductionQueryParams>({
    search: '',
    farmId: '',
    startDate: '',
    endDate: '',
    session: '',
    qualityStatus: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  // Data States
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<ProductionSummaryStats | null>(null);
  const [analytics, setAnalytics] = useState<ProductionAnalyticsData | null>(null);

  // Dropdown options
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [animals, setAnimals] = useState<AnimalOption[]>([]);

  // Status flags
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load farms dropdown
  const loadFarms = useCallback(async () => {
    try {
      const data = await productionService.getFarms();
      setFarms(data);
    } catch (err) {
      console.error('Failed to load farm options:', err);
    }
  }, []);

  // Load animals dropdown
  const loadAnimals = useCallback(async (farmId?: string) => {
    try {
      const data = await productionService.getAnimals(farmId);
      setAnimals(data);
    } catch (err) {
      console.error('Failed to load animal options:', err);
    }
  }, []);

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await productionService.getSummaryStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load summary stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Load Analytics Data
  const loadAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const data = await productionService.getAnalyticsData();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  // Fetch paginated records
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const response = await productionService.getRecords(params);
      setRecords(response.data);
      setTotalCount(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (err: unknown) {
      setIsError(true);
      const msg = extractErrorMessage(err, 'Failed to fetch milk production records.');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  // Initial setup
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) {
        await Promise.all([loadFarms(), loadAnimals(), loadStats(), loadAnalytics()]);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [loadFarms, loadAnimals, loadStats, loadAnalytics]);

  // Fetch records whenever filter parameters change (with debounce on search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  // Handler helpers
  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const setSearch = (search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const setFilter = (key: keyof ProductionQueryParams, value: unknown) => {
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setParams({
      search: '',
      farmId: '',
      startDate: '',
      endDate: '',
      session: '',
      qualityStatus: '',
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
    toast.success('Filters cleared');
  };

  const setSorting = (sortBy: ProductionQueryParams['sortBy']) => {
    setParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  // Create record
  const createRecord = async (input: CreateProductionInput): Promise<boolean> => {
    setIsMutating(true);
    try {
      await productionService.createRecord(input);
      toast.success('Milk production record logged successfully!');
      await Promise.all([fetchRecords(), loadStats(), loadAnalytics()]);
      return true;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to create production record.');
      toast.error(msg);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  // Update record
  const updateRecord = async (input: UpdateProductionInput): Promise<boolean> => {
    setIsMutating(true);
    try {
      await productionService.updateRecord(input);
      toast.success('Production record updated successfully!');
      await Promise.all([fetchRecords(), loadStats(), loadAnalytics()]);
      return true;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to update production record.');
      toast.error(msg);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  // Void record (auditable cancellation)
  const voidRecord = async (id: string, reason: string): Promise<boolean> => {
    setIsMutating(true);
    try {
      await productionService.voidRecord(id, reason);
      toast.success('Production record marked as voided successfully.');
      await Promise.all([fetchRecords(), loadStats(), loadAnalytics()]);
      return true;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to void production record.');
      toast.error(msg);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  // Delete record (redirects to voidRecord for traceability compliance)
  const deleteRecord = async (id: string, reason = 'Record voided via user action'): Promise<boolean> => {
    return voidRecord(id, reason);
  };

  // Permanent Delete (destructive)
  const deleteRecordPermanent = async (id: string): Promise<boolean> => {
    setIsMutating(true);
    try {
      await productionService.deleteRecordPermanent(id);
      toast.success('Production record permanently deleted.');
      await Promise.all([fetchRecords(), loadStats(), loadAnalytics()]);
      return true;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to permanently delete production record.');
      toast.error(msg);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  // Export CSV
  const exportCsv = () => {
    if (records.length === 0) {
      toast.error('No production records available to export.');
      return;
    }
    productionService.exportCsv(records);
    toast.success(`Exported ${records.length} production records to CSV!`);
  };

  return {
    params,
    records,
    totalCount,
    totalPages,
    stats,
    analytics,
    farms,
    animals,
    isLoading,
    isStatsLoading,
    isAnalyticsLoading,
    isMutating,
    isError,
    errorMessage,
    setPage,
    setSearch,
    setFilter,
    clearFilters,
    setSorting,
    refetchRecords: fetchRecords,
    loadAnimals,
    createRecord,
    updateRecord,
    voidRecord,
    deleteRecord,
    deleteRecordPermanent,
    exportCsv,
  };
}
