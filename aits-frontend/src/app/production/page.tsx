"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProduction } from "@/hooks/useProduction";
import { ProductionHeader } from "@/features/production/ProductionHeader";
import { ProductionSummaryCards } from "@/features/production/ProductionSummaryCards";
import { ProductionFilters } from "@/features/production/ProductionFilters";
import { ProductionTable } from "@/features/production/ProductionTable";
import { ProductionFormModal } from "@/features/production/ProductionFormModal";
import { ProductionDetailModal } from "@/features/production/ProductionDetailModal";
import { ProductionDeleteDialog } from "@/features/production/ProductionDeleteDialog";
import { ProductionAnalyticsCharts } from "@/features/production/ProductionAnalyticsCharts";
import { ProductionRecord, CreateProductionInput } from "@/types/production";

export default function ProductionPage() {
  const { user, hasPermissionOnFarm } = useAuthStore();

  // Simple frontend permission check: Admin & Managers can edit/delete; view-only users cannot
  const canManage = (() => {
    if (!user) return true; // Default allowed
        return hasPermissionOnFarm("milk:update");
  })();

  const canDeletePermanently = (() => {
    if (!user) return false;
        return hasPermissionOnFarm("milk:delete-permanent");
  })();

  const {
    params,
    records,
    totalCount,
    totalPages,
    stats,
    analytics,
    farms,
    animals,
    isLoading,
    isStatsLoading,
    isAnalyticsLoading,
    isMutating,
    isError,
    errorMessage,
    setPage,
    setSearch,
    setFilter,
    clearFilters,
    setSorting,
    refetchRecords,
    loadAnimals,
    createRecord,
    updateRecord,
    deleteRecord,
    deleteRecordPermanent,
    exportCsv,
  } = useProduction();

  // Modal & Dialog States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(
    null,
  );

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProductionRecord | null>(
    null,
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermanentDeleteMode, setIsPermanentDeleteMode] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ProductionRecord | null>(
    null,
  );

  // Handlers
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (record: ProductionRecord) => {
    setEditingRecord(record);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (record: ProductionRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeleteDialog = (record: ProductionRecord) => {
    setRecordToDelete(record);
    setIsPermanentDeleteMode(false);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenPermanentDeleteDialog = (record: ProductionRecord) => {
    setRecordToDelete(record);
    setIsPermanentDeleteMode(true);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (
    data: CreateProductionInput,
  ): Promise<boolean> => {
    if (editingRecord) {
      return await updateRecord({
        ...data,
        id: editingRecord.id,
      });
    } else {
      return await createRecord({
        ...data,
        recordedBy: user
          ? user.fullName || `${user.firstName} ${user.lastName}`
          : "Logged Manager",
      });
    }
  };

  const handleConfirmDelete = async (reason: string) => {
    if (recordToDelete) {
      const success = isPermanentDeleteMode
        ? await deleteRecordPermanent(recordToDelete.id)
        : await deleteRecord(recordToDelete.id, reason);
      if (success) {
        setIsDeleteDialogOpen(false);
        setRecordToDelete(null);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <ProductionHeader
          canManage={canManage}
          onAddClick={handleOpenAddModal}
          onExportClick={exportCsv}
          onRefreshClick={refetchRecords}
          isRefreshing={isLoading}
        />

        {/* KPI Summary Cards */}
        <ProductionSummaryCards stats={stats} isLoading={isStatsLoading} />

        {/* Filters */}
        <ProductionFilters
          params={params}
          farms={farms}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
        />

        {/* Main Production Records Table */}
        <ProductionTable
          records={records}
          params={params}
          totalCount={totalCount}
          totalPages={totalPages}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          canManage={canManage}
          canDeletePermanently={canDeletePermanently}
          onSort={setSorting}
          onPageChange={setPage}
          onViewDetails={handleOpenDetailModal}
          onEditRecord={handleOpenEditModal}
          onDeleteRecord={handleOpenDeleteDialog}
          onDeletePermanentlyRecord={handleOpenPermanentDeleteDialog}
          onRetry={refetchRecords}
        />

        {/* Analytics Section */}
        <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#383838]">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Milk Production Analytics
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Visual breakdown of daily yield curves, milking session volumes,
              top performing animals, and farm distribution.
            </p>
          </div>
          <ProductionAnalyticsCharts
            data={analytics}
            isLoading={isAnalyticsLoading}
          />
        </div>

        {/* Add/Edit Form Modal */}
        <ProductionFormModal
          isOpen={isFormModalOpen}
          initialData={editingRecord}
          farms={farms}
          animals={animals}
          isSubmitting={isMutating}
          onClose={() => setIsFormModalOpen(false)}
          onFarmChange={loadAnimals}
          onSubmit={handleFormSubmit}
        />

        {/* View Details Modal */}
        <ProductionDetailModal
          isOpen={isDetailModalOpen}
          record={selectedRecord}
          onClose={() => setIsDetailModalOpen(false)}
          onEdit={() => selectedRecord && handleOpenEditModal(selectedRecord)}
          onDelete={() => selectedRecord && handleOpenDeleteDialog(selectedRecord)}
          onDeletePermanently={() => selectedRecord && handleOpenPermanentDeleteDialog(selectedRecord)}
          canManage={canManage}
          canDeletePermanently={canDeletePermanently}
        />

        {/* Delete Confirmation Dialog */}
        <ProductionDeleteDialog
          isOpen={isDeleteDialogOpen}
          record={recordToDelete}
          isDeleting={isMutating}
          isPermanentDelete={isPermanentDeleteMode}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
