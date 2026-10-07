import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { PeriodType } from '@/types/dashboard';

export function useDashboardSummary(period?: string) {
  return useQuery({
    queryKey: ['dashboard', 'summary', period || 'default'],
    queryFn: () => dashboardService.getSummary(period),
  });
}

export function useMilkProductionTrend(period: PeriodType = 'daily') {
  return useQuery({
    queryKey: ['dashboard', 'milk-trends', period],
    queryFn: () => dashboardService.getMilkTrends(period),
  });
}

export function useAnimalStatusDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'animal-status'],
    queryFn: dashboardService.getAnimalStatusDistribution,
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['dashboard', 'upcoming-events'],
    queryFn: dashboardService.getUpcomingEvents,
  });
}

export function useAnimalsRequiringAttention() {
  return useQuery({
    queryKey: ['dashboard', 'animals-attention'],
    queryFn: dashboardService.getAnimalsRequiringAttention,
  });
}

export function useDashboardNotifications() {
  return useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: dashboardService.getNotifications,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: dashboardService.getCurrentUser,
  });
}
