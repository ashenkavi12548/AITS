'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCalvingManagement } from '@/hooks/useCalvingManagement';
import { useBreedingServices } from '@/hooks/useBreedingServices';
import { BreedingHeader } from '@/features/breeding/BreedingHeader';
import { CalvingSummaryCards } from '@/features/breeding/CalvingSummaryCards';
import { CalvingTable } from '@/features/breeding/CalvingTable';
import { CalvingFormModal } from '@/features/breeding/CalvingFormModal';
import { CreateCalvingInput } from '@/types/breeding';

export default function CalvingManagementPage() {
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
    createCalving,
  } = useCalvingManagement();

  const { femaleAnimals } = useBreedingServices();

  const [isCalvingModalOpen, setIsCalvingModalOpen] = useState(false);

  const handleCalvingSubmit = async (data: CreateCalvingInput): Promise<boolean> => {
    return await createCalving(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <BreedingHeader
          canManage={canManage}
          onAddClick={() => setIsCalvingModalOpen(true)}
          onRefreshClick={refetchRecords}
          isRefreshing={isLoading}
        />

        {/* Calving Summary KPI Cards */}
        <CalvingSummaryCards stats={stats} isLoading={isLoading} />

        {/* Calving Management Table */}
        <CalvingTable
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
          onRecordCalving={() => setIsCalvingModalOpen(true)}
          onRetry={refetchRecords}
        />

        {/* Record Calving Form Modal */}
        <CalvingFormModal
          isOpen={isCalvingModalOpen}
          femaleAnimals={femaleAnimals}
          isSubmitting={isMutating}
          onClose={() => setIsCalvingModalOpen(false)}
          onSubmit={handleCalvingSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
