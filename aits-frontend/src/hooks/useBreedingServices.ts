import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  BreedingRecord,
  BreedingQueryParams,
  CreateBreedingInput,
  UpdateBreedingInput,
  FemaleAnimalOption,
  BullOption,
  SemenStrawOption,
} from '@/types/breeding';
import { breedingService } from '@/services/breeding.service';

export function useBreedingServices() {
  const [params, setParams] = useState<BreedingQueryParams>({
    search: '',
    farmId: '',
    method: '',
    status: '',
    technician: '',
    startDate: '',
    endDate: '',
    sortBy: 'serviceDate',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [femaleAnimals, setFemaleAnimals] = useState<FemaleAnimalOption[]>([]);
  const [bulls, setBulls] = useState<BullOption[]>([]);
  const [semenStraws, setSemenStraws] = useState<SemenStrawOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isError, setIsError] = useState(false);

  const loadDropdowns = useCallback(async (farmId?: string) => {
    try {
      const [females, availableBulls, straws] = await Promise.all([
        breedingService.getEligibleFemaleAnimals(farmId),
        breedingService.getAvailableBulls(farmId),
        breedingService.getSemenInventory(farmId),
      ]);
      setFemaleAnimals(females);
      setBulls(availableBulls);
      setSemenStraws(straws);
    } catch (err) {
      console.error('Failed to load breeding dropdown options:', err);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await breedingService.getBreedingRecords(params);
      setRecords(res.data);
      setTotalCount(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error('Failed to fetch breeding records:', err);
      setIsError(true);
      toast.error('Failed to fetch breeding records.');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) await loadDropdowns();
    };
    init();
    return () => {
      active = false;
    };
  }, [loadDropdowns]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const setPage = (page: number) => setParams((prev) => ({ ...prev, page }));
  const setSearch = (search: string) => setParams((prev) => ({ ...prev, search, page: 1 }));
  const setFilter = (key: keyof BreedingQueryParams, value: unknown) =>
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));

  const clearFilters = () => {
    setParams({
      search: '',
      farmId: '',
      method: '',
      status: '',
      technician: '',
      startDate: '',
      endDate: '',
      sortBy: 'serviceDate',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
    toast.success('Filters cleared');
  };

  const setSorting = (sortBy: BreedingQueryParams['sortBy']) => {
    setParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const createRecord = async (input: CreateBreedingInput): Promise<boolean> => {
    setIsMutating(true);
    try {
      await breedingService.createBreedingRecord(input);
      toast.success('Breeding service record saved successfully!');
      await fetchRecords();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create breeding record.';
      toast.error(msg);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const updateRecord = async (id: string, input: UpdateBreedingInput): Promise<boolean> => {
    setIsMutating(true);
    try {
      await breedingService.updateBreedingRecord(id, input);
      toast.success('Breeding record updated successfully!');
      await fetchRecords();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update record.';
      toast.error(msg);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteRecord = async (id: string): Promise<boolean> => {
    setIsMutating(true);
    try {
      await breedingService.deleteBreedingRecord(id);
      toast.success('Breeding record deleted successfully!');
      await fetchRecords();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete record.';
      toast.error(msg);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const exportCsv = () => {
    if (records.length === 0) {
      toast.error('No breeding records available to export.');
      return;
    }
    breedingService.exportCsv(records);
    toast.success(`Exported ${records.length} breeding records to CSV!`);
  };

  return {
    params,
    records,
    totalCount,
    totalPages,
    femaleAnimals,
    bulls,
    semenStraws,
    isLoading,
    isMutating,
    isError,
    setPage,
    setSearch,
    setFilter,
    clearFilters,
    setSorting,
    refetchRecords: fetchRecords,
    loadDropdowns,
    createRecord,
    updateRecord,
    deleteRecord,
    exportCsv,
  };
}
