import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalsService } from '@/services/animals.service';
import type {
  AnimalQueryParams,
  UpdateAnimalStatusInput,
  CreateAnimalInput,
} from '@/types/animals';

// Query key factory — keeps cache keys consistent
export const animalKeys = {
  all: ['animals'] as const,
  lists: () => [...animalKeys.all, 'list'] as const,
  list: (params: AnimalQueryParams) => [...animalKeys.lists(), params] as const,
  stats: (farmId?: string) => [...animalKeys.all, 'stats', farmId] as const,
  detail: (id: string) => [...animalKeys.all, 'detail', id] as const,
  qr: (id: string) => [...animalKeys.all, 'qr', id] as const,
  identifiers: (id: string) => [...animalKeys.all, 'identifiers', id] as const,
  history: (id: string) => [...animalKeys.all, 'history', id] as const,
};

/**
 * Paginated, filtered, server-side animals list.
 */
export function useAnimals(params: AnimalQueryParams = {}) {
  return useQuery({
    queryKey: animalKeys.list(params),
    queryFn: () => animalsService.getAnimals(params),
    placeholderData: (prev) => prev,
  });
}

/**
 * Live herd inventory statistics.
 */
export function useHerdStats(farmId?: string) {
  return useQuery({
    queryKey: animalKeys.stats(farmId),
    queryFn: () => animalsService.getHerdStats(farmId),
  });
}

/**
 * Full animal identity graph for detail page.
 */
export function useAnimalDetail(id: string) {
  return useQuery({
    queryKey: animalKeys.detail(id),
    queryFn: () => animalsService.getAnimalById(id),
    enabled: Boolean(id),
  });
}

/**
 * Animal QR code and history.
 */
export function useAnimalQr(id: string) {
  return useQuery({
    queryKey: animalKeys.qr(id),
    queryFn: () => animalsService.getAnimalQr(id),
    enabled: Boolean(id),
  });
}

/**
 * Animal identifiers list.
 */
export function useAnimalIdentifiers(id: string) {
  return useQuery({
    queryKey: animalKeys.identifiers(id),
    queryFn: () => animalsService.getIdentifiers(id),
    enabled: Boolean(id),
  });
}

/**
 * Animal audit history timeline.
 */
export function useAnimalHistory(id: string) {
  return useQuery({
    queryKey: animalKeys.history(id),
    queryFn: () => animalsService.getAnimalHistory(id),
    enabled: Boolean(id),
  });
}

/**
 * Mutation: register a new animal.
 * On success, invalidates the animals list and stats.
 */
export function useCreateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnimalInput) => animalsService.createAnimal(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: animalKeys.lists() });
      void qc.invalidateQueries({ queryKey: animalKeys.stats() });
    },
  });
}

/**
 * Mutation: update animal status with audit reason.
 * On success, invalidates list, stats, and the individual animal cache.
 */
export function useUpdateAnimalStatus(animalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAnimalStatusInput) =>
      animalsService.updateAnimalStatus(animalId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: animalKeys.lists() });
      void qc.invalidateQueries({ queryKey: animalKeys.stats() });
      void qc.invalidateQueries({ queryKey: animalKeys.detail(animalId) });
    },
  });
}

/**
 * Mutation: soft-delete / archive animal.
 */
export function useDeleteAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => animalsService.deleteAnimal(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: animalKeys.lists() });
      void qc.invalidateQueries({ queryKey: animalKeys.stats() });
    },
  });
}
