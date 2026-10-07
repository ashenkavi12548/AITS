'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePregnancyTracking } from '@/hooks/usePregnancyTracking';
import { useBreedingServices } from '@/hooks/useBreedingServices';
import { BreedingHeader } from '@/features/breeding/BreedingHeader';
import { PregnancySummaryCards } from '@/features/breeding/PregnancySummaryCards';
import { PregnancyTable } from '@/features/breeding/PregnancyTable';
import { PregnancyCheckFormModal } from '@/features/breeding/PregnancyCheckFormModal';
import { CreatePregnancyCheckInput } from '@/types/breeding';

export default function PregnancyTrackingPage() {
  const { user } = useAuthStore();
  const canManage = (() => {
    if (!user) return true;
    const role = (user.role || '').toUpperCase();
    const perms = (user.permissions || []).map((p) => p.toLowerCase());
    if (role === 'GOVERNMENT_OFFICER' || role === 'AUDITOR' || perms.includes('breeding:read_only')) {
      return false;
    }
    return true;
  })();

  const {
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
    refetchRecords,
    createCheck,
  } = usePregnancyTracking();

  const { femaleAnimals } = useBreedingServices();

  const [isPDModalOpen, setIsPDModalOpen] = useState(false);

  const handlePDSubmit = async (data: CreatePregnancyCheckInput): Promise<boolean> => {
    return await createCheck(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <BreedingHeader
          canManage={canManage}
          onAddClick={() => setIsPDModalOpen(true)}
          onRefreshClick={refetchRecords}
          isRefreshing={isLoading}
        />

        {/* Pregnancy KPI Summary Cards */}
        <PregnancySummaryCards stats={stats} isLoading={isLoading} />

        {/* Pregnancy Table */}
        <PregnancyTable
          records={records}
          params={params}
          totalCount={totalCount}
          totalPages={totalPages}
          isLoading={isLoading}
          isError={isError}
          canManage={canManage}
          onPageChange={setPage}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          onRecordCheck={() => setIsPDModalOpen(true)}
          onRetry={refetchRecords}
        />

        {/* Record Pregnancy Check Form Modal */}
        <PregnancyCheckFormModal
          isOpen={isPDModalOpen}
          femaleAnimals={femaleAnimals}
          isSubmitting={isMutating}
          onClose={() => setIsPDModalOpen(false)}
          onSubmit={handlePDSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
