"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useFarmMovements,
  useTraceabilityFarms,
  useRegisteredFarms,
  useEligibleAnimals,
  useCreateFarmMovement,
  useMarkMovementInTransit,
  useConfirmMovementArrival,
  useCancelFarmMovement,
} from "@/hooks/useTraceability";
import { FarmMovementCards } from "@/features/traceability/FarmMovementCards";
import { FarmMovementFilterBar } from "@/features/traceability/FarmMovementFilterBar";
import { FarmMovementTable } from "@/features/traceability/FarmMovementTable";
import { FarmMovementCardsList } from "@/features/traceability/FarmMovementCardsList";
import { FarmMovementFormModal } from "@/features/traceability/FarmMovementFormModal";
import { FarmMovementActionsModal } from "@/features/traceability/FarmMovementActionsModal";
import {
  Truck,
  Plus,
  ChevronLeft,
  ChevronRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { FarmMovement, FarmMovementFilters } from "@/types/traceability.types";

export default function MovementOverviewPage() {
  const { user, activeFarmId } = useAuthStore();
  const currentFarmId = activeFarmId || user?.primaryFarmId;
  const canManage = (() => {
    if (!user) return true;
    const role = (user.role || "").toUpperCase();
    const perms = (user.permissions || []).map((p) => p.toLowerCase());
    if (
      role === "GOVERNMENT_OFFICER" ||
      role === "AUDITOR" ||
      perms.includes("traceability:read_only")
    ) {
      return false;
    }
    return true;
  })();

  const [filters, setFilters] = useState<FarmMovementFilters>({
    page: 1,
    limit: 10,
    status: "ALL",
    reason: "ALL",
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<FarmMovement | null>(
    null,
  );

  const {
    data: movementsData,
    isLoading,
    isError,
    refetch,
  } = useFarmMovements(filters);
  const { data: myFarms = [] } = useTraceabilityFarms();
  useRegisteredFarms();
  const { data: animals = [] } = useEligibleAnimals(currentFarmId ?? undefined);

  const createMutation = useCreateFarmMovement();
  const inTransitMutation = useMarkMovementInTransit();
  const arrivalMutation = useConfirmMovementArrival();
  const cancelMutation = useCancelFarmMovement();

  const handleFilterChange = (newFilters: Partial<FarmMovementFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      status: "ALL",
      reason: "ALL",
      fromFarmId: "ALL",
      toFarmId: "ALL",
    });
  };

  const handleCreate = async (payload: Partial<FarmMovement>) => {
    await createMutation.mutateAsync(payload);
  };

  const handleMarkInTransit = async (id: string) => {
    await inTransitMutation.mutateAsync(id);
  };

  const handleConfirmArrival = async (
    id: string,
    data: { actualArrivalDate: string; actualArrivalTime: string },
  ) => {
    await arrivalMutation.mutateAsync({ id, data });
  };

  const handleCancel = async (id: string, reason?: string) => {
    await cancelMutation.mutateAsync({ id, reason });
  };

  const totalPages = movementsData?.meta?.totalPages || 1;
  const currentPage = filters.page || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#212121] p-5 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-teal-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-[#8e8e8e]" /> 
                <span className="text-[11px] font-semibold text-[#10a37f] bg-[#10a37f]/10 px-2 py-0.5 rounded-full border border-[#10a37f]/20">
                  Movement Overview
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-[#0d0d0d] dark:text-white mt-0.5">
                Farm-to-Farm Animal Movement
              </h1>
              <p className="text-[13px] text-[#737373] dark:text-[#8e8e8e] mt-1">
                Inter-farm livestock transfers, transit status lifecycle, and
                destination arrival verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 bg-white dark:bg-[#282828] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] border border-[#e5e5e5] dark:border-[#383838] rounded-xl transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {canManage && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-[#10a37f] hover:bg-[#0e8c6d] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Record Movement</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary KPI Cards */}
        <FarmMovementCards
          movements={movementsData?.data || []}
          isLoading={isLoading}
        />

        {/* Filter Bar */}
        <FarmMovementFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          farms={myFarms}
        />

        {/* Error State */}
        {isError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-xs flex items-center justify-between">
            <span>Failed to load farm movement records.</span>
            <button
              onClick={() => refetch()}
              className="font-bold underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Desktop Movement Table */}
        <div className="hidden md:block">
          <FarmMovementTable
            movements={movementsData?.data || []}
            isLoading={isLoading}
            canManage={canManage}
            onOpenActionsModal={(mov) => setSelectedMovement(mov)}
          />
        </div>

        {/* Mobile Movement Cards List */}
        <div className="block md:hidden">
          <FarmMovementCardsList
            movements={movementsData?.data || []}
            isLoading={isLoading}
            onOpenActionsModal={(mov) => setSelectedMovement(mov)}
          />
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-[#212121] px-4 py-3 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xs text-xs">
            <span className="text-[#737373] dark:text-[#8e8e8e]">
              Page{" "}
              <strong className="text-[#0d0d0d] dark:text-white">
                {currentPage}
              </strong>{" "}
              of {totalPages} ({movementsData?.meta?.total || 0} movements)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => handleFilterChange({ page: currentPage - 1 })}
                className="p-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#383838] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => handleFilterChange({ page: currentPage + 1 })}
                className="p-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#383838] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create Movement Form Modal */}
        <FarmMovementFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreate}
          animals={animals}
          isSubmitting={createMutation.isPending}
        />

        {/* Actions & Lifecycle Modal */}
        <FarmMovementActionsModal
          movement={selectedMovement}
          isOpen={Boolean(selectedMovement)}
          onClose={() => setSelectedMovement(null)}
          onMarkInTransit={handleMarkInTransit}
          onConfirmArrival={handleConfirmArrival}
          onCancelMovement={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
}
