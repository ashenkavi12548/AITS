import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  PregnancyCheck,
  PregnancyQueryParams,
  PregnancySummaryStats,
  CreatePregnancyCheckInput,
} from '@/types/breeding';
import { breedingService } from '@/services/breeding.service';

export function usePregnancyTracking() {
  const [params, setParams] = useState<PregnancyQueryParams>({
    search: '',
    farmId: '',
    checkType: '',
    pregnancyStatus: '',
    page: 1,
    limit: 10,
  });

  const [records, setRecords] = useState<PregnancyCheck[]>([]);
  const [stats, setStats] = useState<PregnancySummaryStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await breedingService.getPregnancySummary();
      setStats(res);
    } catch (err) {
      console.error('Failed to load pregnancy summary stats:', err);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await breedingService.getPregnancyChecks(params);
      setRecords(res.data);
      setTotalCount(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to fetch pregnancy check records:', err);
      setIsError(true);
      toast.error('Failed to fetch pregnancy records.');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) await fetchSummary();
    };
    init();
    return () => {
      active = false;
    };
  }, [fetchSummary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const setPage = (page: number) => setParams((prev) => ({ ...prev, page }));
  const setSearch = (search: string) => setParams((prev) => ({ ...prev, search, page: 1 }));
  const setFilter = (key: keyof PregnancyQueryParams, value: unknown) =>
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));

  const clearFilters = () => {
    setParams({
      search: '',
      farmId: '',
      checkType: '',
      pregnancyStatus: '',
      page: 1,
      limit: 10,
    });
    toast.success('Filters cleared');
  };

  const createCheck = async (input: CreatePregnancyCheckInput): Promise<boolean> => {
    setIsMutating(true);
    try {
      await breedingService.createPregnancyCheck(input);
      toast.success('Pregnancy check recorded successfully!');
      await Promise.all([fetchRecords(), fetchSummary()]);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record pregnancy check.';
      toast.error(msg);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    params,
    records,
    stats,
    totalCount,
    totalPages,
    isLoading,
    isMutating,
    isError,
    setPage,
    setSearch,
    setFilter,
    clearFilters,
    refetchRecords: fetchRecords,
    createCheck,
  };
}
