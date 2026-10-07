"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, Users } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
  FarmEmployee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "@/services/farms.service";
import type { CreateTaskDto } from "@/services/tasks.service";
import {
  useFarms,
  useStaffEmployees,
  useCreateStaffEmployee,
  useUpdateStaffEmployee,
  useResetStaffPassword,
  useRemoveStaffEmployee,
} from "@/hooks/use-staff";
import { StaffHeader } from "@/features/staff/StaffHeader";
import { StaffMetricsCards } from "@/features/staff/StaffMetricsCards";
import { StaffFilterToolbar } from "@/features/staff/StaffFilterToolbar";
import { StaffCardGrid } from "@/features/staff/StaffCardGrid";
import { StaffTable } from "@/features/staff/StaffTable";
import { StaffAddModal } from "@/features/staff/StaffAddModal";
import { StaffEditModal } from "@/features/staff/StaffEditModal";
import { StaffResetPasswordModal } from "@/features/staff/StaffResetPasswordModal";
import { StaffDeleteModal } from "@/features/staff/StaffDeleteModal";
import { StaffAssignTaskModal } from "@/features/staff/StaffAssignTaskModal";
import { useCreateTask } from "@/hooks/use-tasks";
import { toast } from "react-hot-toast";

export default function StaffManagementPage() {
  const { user, hasPermissionOnFarm } = useAuthStore();
  const router = useRouter();

  // Redirect if not authorized
  useEffect(() => {
    // Admins and Farmers always have access. For other users, they must have the farm_member:read permission to view the Staff tab.
    if (user) {
      const hasAccess = 
        user.role === "FARMER" || 
        hasPermissionOnFarm("farm_member:read");
        
      if (!hasAccess) {
        router.push("/dashboard");
      }
    }
  }, [user, router, hasPermissionOnFarm]);

  // 1. Data Fetching Queries
  const { data: allFarms = [], isLoading: isFarmsLoading } = useFarms();
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  // Active farm resolution: selected or first available
  const activeFarm = useMemo(() => {
    if (selectedFarmId) {
      const found = allFarms.find((f) => f.id === selectedFarmId);
      if (found) return found;
    }
    return allFarms[0] || null;
  }, [allFarms, selectedFarmId]);

  const {
    data: employees = [],
    isLoading: isStaffLoading,
    isRefetching,
    refetch: refetchStaff,
  } = useStaffEmployees(activeFarm?.id);

  // 2. Mutations
  const createEmployeeMutation = useCreateStaffEmployee(activeFarm?.id);
  const updateEmployeeMutation = useUpdateStaffEmployee(activeFarm?.id);
  const resetPasswordMutation = useResetStaffPassword(activeFarm?.id);
  const removeEmployeeMutation = useRemoveStaffEmployee(activeFarm?.id);
  const createTaskMutation = useCreateTask(activeFarm?.id);

  // 3. UI & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // 4. Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState<FarmEmployee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] =
    useState<FarmEmployee | null>(null);

  // 5. Computed KPI Metrics
  const staffMetrics = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "ACTIVE").length;
    const managersAndVets = employees.filter(
      (e) => e.farmRole === "MANAGER" || e.farmRole === "VETERINARIAN",
    ).length;
    const workers = employees.filter((e) => e.farmRole === "WORKER").length;
    const activePct = total > 0 ? Math.round((active / total) * 100) : 100;
    return { total, active, managersAndVets, workers, activePct };
  }, [employees]);

  // 6. Filtered Employees List
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullName =
        emp?.user?.fullName ||
        `${emp?.user?.firstName || ""} ${emp?.user?.lastName || ""}`.trim();
      const email = emp?.user?.email || "";
      const phone = emp?.user?.phone || "";

      const matchesSearch =
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery);

      const matchesRole = roleFilter === "ALL" || emp.farmRole === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" || emp.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, searchQuery, roleFilter, statusFilter]);

  // 7. Handlers
  const handleToggleStatus = async (emp: FarmEmployee) => {
    if (!activeFarm?.id || emp.farmRole === "OWNER") return;
    const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await updateEmployeeMutation.mutateAsync({
      employeeUserId: emp.userId,
      data: { status: newStatus },
    });
  };

  const handleOpenEdit = (emp: FarmEmployee) => {
    setSelectedEmployee(emp);
    setIsEditModalOpen(true);
  };

  const handleOpenAssignTask = (emp: FarmEmployee) => {
    setSelectedEmployee(emp);
    setIsAssignTaskModalOpen(true);
  };

  const handleOpenResetPass = (emp: FarmEmployee) => {
    setSelectedEmployee(emp);
    setIsResetPassModalOpen(true);
  };

  const handlePromptDelete = (emp: FarmEmployee) => {
    setEmployeeToDelete(emp);
    setIsDeleteModalOpen(true);
  };

  const handleAddEmployeeSubmit = async (data: CreateEmployeeInput) => {
    await createEmployeeMutation.mutateAsync(data);
    setIsAddModalOpen(false);
  };

  const handleUpdateEmployeeSubmit = async (data: UpdateEmployeeInput) => {
    if (!selectedEmployee) return;
    await updateEmployeeMutation.mutateAsync({
      employeeUserId: selectedEmployee.userId,
      data,
    });
    setIsEditModalOpen(false);
  };

  const handleResetPasswordSubmit = async (newPassword: string) => {
    if (!selectedEmployee) return;
    await resetPasswordMutation.mutateAsync({
      employeeUserId: selectedEmployee.userId,
      newPassword,
    });
    setIsResetPassModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    await removeEmployeeMutation.mutateAsync(employeeToDelete.userId);
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  const handleAssignTaskSubmit = async (data: CreateTaskDto) => {
    if (!selectedEmployee) return;
    try {
      await createTaskMutation.mutateAsync({
        ...data,
        assignedToId: selectedEmployee.userId,
      });
      toast.success("Task assigned successfully!");
      setIsAssignTaskModalOpen(false);
    } catch (error: unknown) {
      const axiosErr = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const message = axiosErr.response?.data?.message;
      if (Array.isArray(message)) {
        toast.error(message[0]);
      } else if (typeof message === 'string') {
        toast.error(message);
      } else {
        toast.error("Failed to assign task");
      }
    }
  };

  const isLoading = isFarmsLoading || isStaffLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header & Facility Selector */}
        <StaffHeader
          allFarms={allFarms}
          activeFarm={activeFarm}
          isRefreshing={isRefetching}
          onFarmChange={(farmId) => setSelectedFarmId(farmId)}
          onRefresh={() => refetchStaff()}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          staffCount={staffMetrics.total}
        />

        {/* Workforce KPI Stats Grid */}
        <StaffMetricsCards metrics={staffMetrics} />

        {/* Directory Controls Bar */}
        <StaffFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalEmployees={employees.length}
        />

        {/* Directory Content */}
        {isLoading ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#242424] border border-[#e5e5e5] dark:border-[#383838] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#10a37f]" />
            <span className="text-xs text-[#737373] dark:text-[#8e8e8e] font-medium">
              Loading staff roster...
            </span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#242424] border border-[#e5e5e5] dark:border-[#383838] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
              No staff members found
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e] max-w-sm mx-auto">
              {searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL"
                ? "No employees match your current filter parameters. Try clearing your search query or role filter."
                : "Your farm has no registered employees yet. Click 'Add Staff Member' to delegate daily operations."}
            </p>
            {(searchQuery ||
              roleFilter !== "ALL" ||
              statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : viewMode === "cards" ? (
          <StaffCardGrid
            employees={filteredEmployees}
            currentUserId={user?.id}
            onToggleStatus={handleToggleStatus}
            onOpenResetPass={handleOpenResetPass}
            onOpenEditModal={handleOpenEdit}
            onPromptDelete={handlePromptDelete}
            onOpenAssignTask={handleOpenAssignTask}
          />
        ) : (
          <StaffTable
            employees={filteredEmployees}
            currentUserId={user?.id}
            onToggleStatus={handleToggleStatus}
            onOpenResetPass={handleOpenResetPass}
            onOpenEditModal={handleOpenEdit}
            onPromptDelete={handlePromptDelete}
            onOpenAssignTask={handleOpenAssignTask}
          />
        )}
      </div>

      {/* Modals */}
      <StaffAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEmployeeSubmit}
        isSubmitting={createEmployeeMutation.isPending}
        employees={employees || []}
      />

      <StaffEditModal
        isOpen={isEditModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleUpdateEmployeeSubmit}
        isSubmitting={updateEmployeeMutation.isPending}
        employees={employees || []}
      />

      <StaffResetPasswordModal
        isOpen={isResetPassModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsResetPassModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleResetPasswordSubmit}
        isSubmitting={resetPasswordMutation.isPending}
      />

      <StaffDeleteModal
        isOpen={isDeleteModalOpen}
        employee={employeeToDelete}
        farmName={activeFarm?.name}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isSubmitting={removeEmployeeMutation.isPending}
      />

      <StaffAssignTaskModal
        isOpen={isAssignTaskModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsAssignTaskModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleAssignTaskSubmit}
        isSubmitting={createTaskMutation.isPending}
      />
    </DashboardLayout>
  );
}
