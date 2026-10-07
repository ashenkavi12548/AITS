import React from "react";
import type { FarmEmployee } from "@/services/farms.service";
import { StaffCard } from "@/features/staff/StaffCard";

interface StaffCardGridProps {
  employees: FarmEmployee[];
  currentUserId?: string;
  onToggleStatus: (emp: FarmEmployee) => void;
  onOpenResetPass: (emp: FarmEmployee) => void;
  onOpenEditModal: (emp: FarmEmployee) => void;
  onPromptDelete: (emp: FarmEmployee) => void;
  onOpenAssignTask?: (emp: FarmEmployee) => void;
}

export function StaffCardGrid({
  employees,
  currentUserId,
  onToggleStatus,
  onOpenResetPass,
  onOpenEditModal,
  onPromptDelete,
  onOpenAssignTask,
}: StaffCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {employees.map((emp) => (
        <StaffCard
          key={emp.id}
          employee={emp}
          isCurrentUser={currentUserId === emp.userId}
          onToggleStatus={onToggleStatus}
          onOpenResetPass={onOpenResetPass}
          onOpenEditModal={onOpenEditModal}
          onPromptDelete={onPromptDelete}
          onOpenAssignTask={onOpenAssignTask}
        />
      ))}
    </div>
  );
}
