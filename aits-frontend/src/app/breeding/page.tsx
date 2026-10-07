'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBreedingDashboard } from '@/hooks/useBreedingDashboard';
import { useBreedingServices } from '@/hooks/useBreedingServices';
import { BreedingHeader } from '@/features/breeding/BreedingHeader';
import { BreedingDashboardCards } from '@/features/breeding/BreedingDashboardCards';
import { BreedingUpcomingActivities } from '@/features/breeding/BreedingUpcomingActivities';
import { BreedingAnalyticsCharts } from '@/features/breeding/BreedingAnalyticsCharts';
import { BreedingFormModal } from '@/features/breeding/BreedingFormModal';
import { CreateBreedingInput } from '@/types/breeding';

export default function BreedingDashboardPage() {
  const { user, hasPermissionOnFarm } = useAuthStore();
  const canManage = (() => {
    if (!user) return true;
        return hasPermissionOnFarm('breeding:write');
  })();

  const { stats, activities, analytics, isLoading, refetch } = useBreedingDashboard();
  const { femaleAnimals, bulls, semenStraws, createRecord, loadDropdowns } = useBreedingServices();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: CreateBreedingInput): Promise<boolean> => {
    setIsSubmitting(true);
    const success = await createRecord(data);
    setIsSubmitting(false);
    if (success) {
      refetch();
    }
    return success;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <BreedingHeader
          canManage={canManage}
          onAddClick={() => setIsAddModalOpen(true)}
          onRefreshClick={refetch}
          isRefreshing={isLoading}
        />

        {/* 6 Summary KPI Cards */}
        <BreedingDashboardCards stats={stats} isLoading={isLoading} />

        {/* Upcoming & Overdue Activities */}
        <BreedingUpcomingActivities activities={activities} isLoading={isLoading} />

        {/* Recharts Analytics Charts */}
        <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#383838]">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white">Breeding Analytics & Gestation Forecast</h2>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Visual breakdown of monthly service attempts, AI vs natural methods, herd pregnancy status, and estimated calving schedule.
            </p>
          </div>
          <BreedingAnalyticsCharts data={analytics} isLoading={isLoading} />
        </div>

        {/* Add Breeding Record Form Modal */}
        <BreedingFormModal
          isOpen={isAddModalOpen}
          femaleAnimals={femaleAnimals}
          bulls={bulls}
          semenStraws={semenStraws}
          isSubmitting={isSubmitting}
          onClose={() => setIsAddModalOpen(false)}
          onFarmChange={loadDropdowns}
          onSubmit={handleFormSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
