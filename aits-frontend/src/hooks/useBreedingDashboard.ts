import { useState, useCallback, useEffect } from 'react';
import { breedingService } from '@/services/breeding.service';
import { BreedingSummaryStats, UpcomingActivityItem, BreedingAnalyticsData } from '@/types/breeding';

export function useBreedingDashboard() {
  const [stats, setStats] = useState<BreedingSummaryStats | null>(null);
  const [activities, setActivities] = useState<UpcomingActivityItem[]>([]);
  const [analytics, setAnalytics] = useState<BreedingAnalyticsData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [sum, act, ana] = await Promise.all([
        breedingService.getBreedingSummary(),
        breedingService.getUpcomingActivities(),
        breedingService.getAnalyticsData(),
      ]);
      setStats(sum);
      setActivities(act);
      setAnalytics(ana);
    } catch (err) {
      console.error('Failed to load breeding dashboard data:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) await loadDashboardData();
    };
    init();
    return () => {
      active = false;
    };
  }, [loadDashboardData]);

  return {
    stats,
    activities,
    analytics,
    isLoading,
    isError,
    refetch: loadDashboardData,
  };
}
