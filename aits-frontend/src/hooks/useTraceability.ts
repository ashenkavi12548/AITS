import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { traceabilityService } from '@/services/traceability.service';
import { farmsService } from '@/services/farms.service';
import {
  DailyActivity,
  DailyActivityFilters,
  FarmMovement,
  FarmMovementFilters,
  LifetimeFilters,
} from '@/types/traceability.types';
import { animalKeys } from './use-animals';

export const traceabilityKeys = {
  all: ['traceability'] as const,
  overview: (filters?: { farmId?: string; date?: string }) => [...traceabilityKeys.all, 'overview', filters] as const,
  dailyActivities: (filters?: DailyActivityFilters) => [...traceabilityKeys.all, 'dailyActivities', filters] as const,
  dailyActivity: (id: string) => [...traceabilityKeys.all, 'dailyActivity', id] as const,
  lifetime: (animalId: string, filters?: LifetimeFilters) => [...traceabilityKeys.all, 'lifetime', animalId, filters] as const,
  farmMovements: (filters?: FarmMovementFilters) => [...traceabilityKeys.all, 'farmMovements', filters] as const,
  farmMovement: (id: string) => [...traceabilityKeys.all, 'farmMovement', id] as const,
  farms: () => [...traceabilityKeys.all, 'farms'] as const,
  eligibleAnimals: (farmId?: string) => [...traceabilityKeys.all, 'eligibleAnimals', farmId] as const,
  registeredFarms: () => [...traceabilityKeys.all, 'registeredFarms'] as const,
};

export function useTraceabilityFarms() {
  return useQuery({
    queryKey: traceabilityKeys.farms(),
    queryFn: () => traceabilityService.getActiveFarms(),
  });
}

export function useRegisteredFarms() {
  return useQuery({
    queryKey: traceabilityKeys.registeredFarms(),
    queryFn: () => farmsService.searchAllFarms(),
  });
}

export function useEligibleAnimals(farmId?: string) {
  return useQuery({
    queryKey: traceabilityKeys.eligibleAnimals(farmId),
    queryFn: () => traceabilityService.getEligibleAnimals(farmId),
  });
}

export function useTraceabilityOverview(filters?: { farmId?: string; date?: string }) {
  return useQuery({
    queryKey: traceabilityKeys.overview(filters),
    queryFn: () => traceabilityService.getTraceabilityOverview(filters),
  });
}

export function useDailyActivities(filters?: DailyActivityFilters) {
  return useQuery({
    queryKey: traceabilityKeys.dailyActivities(filters),
    queryFn: () => traceabilityService.getDailyActivities(filters),
  });
}

export function useCreateDailyActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DailyActivity>) => traceabilityService.createDailyActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}

export function useDeleteDailyActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => traceabilityService.deleteDailyActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}

export function useAnimalLifetimeTrace(animalId: string, filters?: LifetimeFilters) {
  return useQuery({
    queryKey: traceabilityKeys.lifetime(animalId, filters),
    queryFn: () => traceabilityService.getAnimalLifetimeTrace(animalId, filters),
    enabled: Boolean(animalId),
  });
}

export function useFarmMovements(filters?: FarmMovementFilters) {
  return useQuery({
    queryKey: traceabilityKeys.farmMovements(filters),
    queryFn: () => traceabilityService.getFarmMovements(filters),
  });
}

export function useCreateFarmMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FarmMovement>) => traceabilityService.createFarmMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}

export function useMarkMovementInTransit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => traceabilityService.markMovementInTransit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}

export function useConfirmMovementArrival() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { actualArrivalDate: string; actualArrivalTime: string } }) =>
      traceabilityService.confirmMovementArrival(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
      queryClient.invalidateQueries({ queryKey: animalKeys.all });
    },
  });
}

export function useCompleteFarmMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => traceabilityService.completeFarmMovement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
      queryClient.invalidateQueries({ queryKey: animalKeys.all });
    },
  });
}

export function useCancelFarmMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      traceabilityService.cancelFarmMovement(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}
