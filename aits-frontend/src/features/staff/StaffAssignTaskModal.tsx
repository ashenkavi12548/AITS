import React, { useState } from "react";
import { X, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { FarmEmployee } from "@/services/farms.service";
import {
  TaskPriority,
  TaskCategory,
  CreateTaskDto,
} from "@/services/tasks.service";

interface StaffAssignTaskModalProps {
  isOpen: boolean;
  employee: FarmEmployee | null;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto) => Promise<void>;
  isSubmitting: boolean;
}

export function StaffAssignTaskModal({
  isOpen,
  employee,
  onClose,
  onSubmit,
  isSubmitting,
}: StaffAssignTaskModalProps) {
  const [formData, setFormData] = useState<Omit<CreateTaskDto, "assignedToId">>(
    {
      title: "",
      description: "",
      priority: TaskPriority.NORMAL,
      category: TaskCategory.GENERAL,
      dueDate: new Date().toISOString().split("T")[0],
      animalId: "",
    },
  );

  if (!isOpen || !employee) return null;

  const employeeName =
    employee.user?.fullName ||
    `${employee.user?.firstName || ""} ${employee.user?.lastName || ""}`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<CreateTaskDto> & {
      assignedToId: string;
      title: string;
      dueDate: string;
    } = {
      ...formData,
      assignedToId: employee.userId,
    };

    if (!payload.animalId) {
      delete payload.animalId;
    }
    if (!payload.description) {
      delete payload.description;
    }

    await onSubmit(payload as CreateTaskDto);
    // Reset form
    setFormData({
      title: "",
      description: "",
      priority: TaskPriority.NORMAL,
      category: TaskCategory.GENERAL,
      dueDate: new Date().toISOString().split("T")[0],
      animalId: "",
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assign Task"
      className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#222] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl max-w-lg w-full p-6 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#10a37f]/15 text-[#10a37f] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                Assign Task to {employeeName}
              </h3>
              <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                Create a new task and assign it directly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              placeholder="e.g., Morning Milking Routine"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              placeholder="Detailed instructions..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as TaskPriority,
                  })
                }
                className="w-full px-3.5 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as TaskCategory,
                  })
                }
                className="w-full px-3.5 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white cursor-pointer"
              >
                <option value="ANIMAL_CARE">Animal Care</option>
                <option value="FEEDING">Feeding</option>
                <option value="MILKING">Milking</option>
                <option value="HEALTH">Health</option>
                <option value="CLEANING">Cleaning</option>
                <option value="BREEDING">Breeding</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Related Animal ID (Optional)
              </label>
              <input
                type="text"
                value={formData.animalId}
                onChange={(e) =>
                  setFormData({ ...formData, animalId: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
                placeholder="UUID of animal"
              />
            </div>
          </div>

          {/* Submit / Cancel */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e5e5] dark:border-[#383838]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-xs font-semibold text-[#737373] dark:text-[#ececec] hover:bg-zinc-100 dark:hover:bg-[#303030] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white font-medium text-xs flex items-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Assign Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
