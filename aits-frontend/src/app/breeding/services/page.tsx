'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBreedingServices } from '@/hooks/useBreedingServices';
import { usePregnancyTracking } from '@/hooks/usePregnancyTracking';
import { BreedingHeader } from '@/features/breeding/BreedingHeader';
import { BreedingServicesTable } from '@/features/breeding/BreedingServicesTable';
import { BreedingFormModal } from '@/features/breeding/BreedingFormModal';
import { BreedingDetailModal } from '@/features/breeding/BreedingDetailModal';
import { BreedingDeleteDialog } from '@/features/breeding/BreedingDeleteDialog';
import { PregnancyCheckFormModal } from '@/features/breeding/PregnancyCheckFormModal';
import { BreedingRecord, CreateBreedingInput, CreatePregnancyCheckInput } from '@/types/breeding';

export default function BreedingServicesPage() {
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
    refetchRecords,
    loadDropdowns,
    createRecord,
    updateRecord,
    deleteRecord,
    exportCsv,
  } = useBreedingServices();

  const { createCheck } = usePregnancyTracking();

  // Modals & Dialogs State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BreedingRecord | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<BreedingRecord | null>(null);

  const [isPDModalOpen, setIsPDModalOpen] = useState(false);
  const [pdRecord, setPdRecord] = useState<BreedingRecord | null>(null);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (record: BreedingRecord) => {
    setEditingRecord(record);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (record: BreedingRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeleteDialog = (record: BreedingRecord) => {
    setRecordToDelete(record);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenPDModal = (record?: BreedingRecord) => {
    setPdRecord(record || null);
    setIsPDModalOpen(true);
  };

  const handleFormSubmit = async (data: CreateBreedingInput): Promise<boolean> => {
    if (editingRecord) {
      return await updateRecord(editingRecord.id, { ...data, id: editingRecord.id });
    } else {
      return await createRecord(data);
    }
  };

  const handlePDSubmit = async (data: CreatePregnancyCheckInput): Promise<boolean> => {
    const success = await createCheck({
      ...data,
      breedingServiceId: pdRecord ? pdRecord.id : undefined,
    });
    if (success) {
      refetchRecords();
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (recordToDelete) {
      const success = await deleteRecord(recordToDelete.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setRecordToDelete(null);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <BreedingHeader
          canManage={canManage}
          onAddClick={handleOpenAddModal}
          onExportClick={exportCsv}
          onRefreshClick={refetchRecords}
          isRefreshing={isLoading}
        />

        {/* Breeding Services Table */}
        <BreedingServicesTable
          records={records}
          params={params}
          totalCount={totalCount}
          totalPages={totalPages}
          isLoading={isLoading}
          isError={isError}
          canManage={canManage}
          onSort={setSorting}
          onPageChange={setPage}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          onViewDetails={handleOpenDetailModal}
          onEditRecord={handleOpenEditModal}
          onDeleteRecord={handleOpenDeleteDialog}
          onRecordPregnancyCheck={handleOpenPDModal}
          onRetry={refetchRecords}
        />

        {/* Add/Edit Breeding Form Modal */}
        <BreedingFormModal
          isOpen={isFormModalOpen}
          initialData={editingRecord}
          femaleAnimals={femaleAnimals}
          bulls={bulls}
          semenStraws={semenStraws}
          isSubmitting={isMutating}
          onClose={() => setIsFormModalOpen(false)}
          onFarmChange={loadDropdowns}
          onSubmit={handleFormSubmit}
        />

        {/* View Details Drawer/Modal */}
        <BreedingDetailModal
          isOpen={isDetailModalOpen}
          record={selectedRecord}
          onClose={() => setIsDetailModalOpen(false)}
          onEdit={() => selectedRecord && handleOpenEditModal(selectedRecord)}
          onRecordPD={() => selectedRecord && handleOpenPDModal(selectedRecord)}
          canManage={canManage}
        />

        {/* Delete Confirmation Dialog */}
        <BreedingDeleteDialog
          isOpen={isDeleteDialogOpen}
          record={recordToDelete}
          isDeleting={isMutating}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
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
