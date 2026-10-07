import React, { useState } from "react";
import { Edit3, X, Loader2, Camera } from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useAuthStore } from "@/stores/useAuthStore";
import { farmsService } from "@/services/farms.service";
import type {
  FarmEmployee,
  UpdateEmployeeInput,
} from "@/services/farms.service";
import {
  PERMISSION_GROUPS,
  ROLE_PRESET_PERMISSIONS,
} from "@/features/staff/constants";

interface StaffEditModalProps {
  isOpen: boolean;
  employee: FarmEmployee | null;
  onClose: () => void;
  onSubmit: (data: UpdateEmployeeInput) => Promise<void>;
  isSubmitting: boolean;
  employees: FarmEmployee[];
}

export function StaffEditModal({
  isOpen,
  employee,
  onClose,
  onSubmit,
  isSubmitting,
  employees,
}: StaffEditModalProps) {
  if (!isOpen || !employee) return null;

  return (
    <StaffEditModalForm
      employee={employee}
      onClose={onClose}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      employees={employees}
    />
  );
}

function StaffEditModalForm({
  employee,
  onClose,
  onSubmit,
  isSubmitting,
  employees,
}: {
  employee: FarmEmployee;
  onClose: () => void;
  onSubmit: (data: UpdateEmployeeInput) => Promise<void>;
  isSubmitting: boolean;
  employees: FarmEmployee[];
}) {
  const { hasPermissionOnFarm } = useAuthStore();
  // Initialize state directly from the employee prop without useEffect cascading renders
  const [editData, setEditData] = useState<UpdateEmployeeInput>(() => ({
    firstName: employee.user.firstName,
    lastName: employee.user.lastName,
    phone: employee.user.phone || "",
    role: employee.farmRole,
    status: (employee.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    permissions: employee.user.permissions || [],
    assignedStaff: employee.managedStaffIds || [],
    profileImageUrl: employee.user.profileImageUrl || "",
  }));
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const result = await farmsService.uploadStaffPhoto(file);
      if (result.success) {
        setEditData((prev) => ({ ...prev, profileImageUrl: result.imageUrl }));
        toast.success("Photo uploaded successfully");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(editData);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${employee.user.fullName}`}
      className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#222] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl max-w-lg w-full p-6 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#10a37f]" />
            <div>
              <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                Edit {employee.user.fullName}
              </h3>
              <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                {employee.user.email}
              </span>
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
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-center overflow-hidden">
                {editData.profileImageUrl ? (
                  <Image
                    src={editData.profileImageUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Camera className="w-6 h-6 text-zinc-400" />
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
                title="Upload Profile Photo"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1.5 font-medium">
              Upload Photo (Optional)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={editData.firstName || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    firstName: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={editData.lastName || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    lastName: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={editData.phone || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    phone: e.target.value,
                  })
                }
                placeholder="077 123 4567"
                className="w-full px-3 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Account Status
              </label>
              <select
                value={editData.status || "ACTIVE"}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    status: e.target.value as "ACTIVE" | "INACTIVE",
                  })
                }
                className="w-full px-3 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE (Authorized to work)</option>
                <option value="INACTIVE">INACTIVE (Access revoked)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
              Farm Role
            </label>
            <select
              value={editData.role || "WORKER"}
              onChange={(e) => {
                const newRole = e.target.value as FarmEmployee["farmRole"];
                const presets =
                  newRole && ROLE_PRESET_PERMISSIONS[newRole]
                    ? ROLE_PRESET_PERMISSIONS[newRole]
                    : [];
                setEditData({
                  ...editData,
                  role: newRole,
                  permissions: presets,
                });
              }}
              className="w-full px-3 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white cursor-pointer"
            >
              <option value="WORKER">Farm Worker</option>
              {hasPermissionOnFarm("manager:appoint") && (
                <option value="MANAGER">Farm Manager</option>
              )}
              <option value="VETERINARIAN">Resident Vet</option>
              <option value="AUDITOR">Auditor</option>
            </select>
          </div>

          {/* Assigned Staff (Only for Managers) */}
          {editData.role === "MANAGER" && (
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                <span>
                  Assigned Staff{" "}
                  <span className="text-zinc-400 font-normal">
                    (Select workers they will manage)
                  </span>
                </span>
                <div className="flex gap-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const eligibleStaff =
                        employees
                          ?.filter(
                            (emp) =>
                              emp.farmRole !== "OWNER" &&
                              emp.id !== employee.id,
                          )
                          .map((emp) => emp.id) || [];
                      setEditData({
                        ...editData,
                        assignedStaff: eligibleStaff,
                      });
                    }}
                    className="text-[#10a37f] hover:underline"
                  >
                    Add All
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditData({ ...editData, assignedStaff: [] })
                    }
                    className="text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </label>
              <div className="space-y-2 p-3 bg-zinc-50 dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#383838] max-h-40 overflow-y-auto">
                {employees?.filter(
                  (emp) => emp.farmRole !== "OWNER" && emp.id !== employee.id,
                ).length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No other staff members available.
                  </p>
                ) : (
                  employees
                    ?.filter(
                      (emp) =>
                        emp.farmRole !== "OWNER" && emp.id !== employee.id,
                    )
                    .map((emp) => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            editData.assignedStaff?.includes(emp.id) || false
                          }
                          onChange={(e) => {
                            const newStaff = e.target.checked
                              ? [...(editData.assignedStaff || []), emp.id]
                              : (editData.assignedStaff || []).filter(
                                  (id) => id !== emp.id,
                                );
                            setEditData({
                              ...editData,
                              assignedStaff: newStaff,
                            });
                          }}
                          className="w-3.5 h-3.5 text-[#10a37f] border-[#d4d4d4] dark:border-[#525252] rounded-sm focus:ring-[#10a37f]"
                        />
                        <span className="text-xs text-[#0d0d0d] dark:text-white">
                          {emp.user.fullName}{" "}
                          <span className="text-zinc-400">
                            ({emp.farmRole})
                          </span>
                        </span>
                      </label>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Permissions Scope */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e]">
                Operational Scope & Permissions
              </label>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    const allPerms = PERMISSION_GROUPS.flatMap(
                      (g) => g.permissions,
                    )
                      .map((p) => p.id)
                      .filter((id) => hasPermissionOnFarm(id));
                    setEditData({
                      ...editData,
                      permissions: allPerms,
                    });
                  }}
                  className="text-[#10a37f] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditData({
                      ...editData,
                      permissions: [],
                    })
                  }
                  className="text-zinc-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-4 p-3 bg-zinc-50 dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#383838] max-h-56 overflow-y-auto">
              {PERMISSION_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                const groupPermIds = group.permissions.map((p) => p.id);
                const isGroupFullyChecked = groupPermIds.every((id) =>
                  (editData.permissions || []).includes(id),
                );
                const isGroupPartiallyChecked =
                  !isGroupFullyChecked &&
                  groupPermIds.some((id) =>
                    (editData.permissions || []).includes(id),
                  );

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#e5e5e5] dark:border-[#333]">
                      <input
                        type="checkbox"
                        checked={isGroupFullyChecked}
                        disabled={group.permissions.some(
                          (p) => !hasPermissionOnFarm(p.id),
                        )}
                        ref={(el) => {
                          if (el) el.indeterminate = isGroupPartiallyChecked;
                        }}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          // Only include permissions the user is allowed to assign
                          const assignableGroupPermIds = groupPermIds.filter(
                            (id) => hasPermissionOnFarm(id),
                          );

                          if (checked) {
                            const newPerms = Array.from(
                              new Set([
                                ...(editData.permissions || []),
                                ...assignableGroupPermIds,
                              ]),
                            );
                            setEditData({ ...editData, permissions: newPerms });
                          } else {
                            const newPerms = (
                              editData.permissions || []
                            ).filter(
                              (id) => !assignableGroupPermIds.includes(id),
                            );
                            setEditData({ ...editData, permissions: newPerms });
                          }
                        }}
                        className="w-3.5 h-3.5 text-[#10a37f] border-[#d4d4d4] dark:border-[#525252] rounded-sm focus:ring-[#10a37f] disabled:opacity-50"
                      />
                      <div className="flex items-center gap-1.5 flex-1">
                        <GroupIcon className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                        <span className="font-bold text-xs text-[#404040] dark:text-[#d4d4d4]">
                          {group.name}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pl-6">
                      {group.permissions.map((p) => {
                        const isChecked = (editData.permissions || []).includes(
                          p.id,
                        );
                        const canAssign = hasPermissionOnFarm(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2 ${!canAssign ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} text-xs select-none p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#252525] transition-colors`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!canAssign}
                              onChange={(e) => {
                                if (!canAssign) return;
                                const cur = editData.permissions || [];
                                setEditData({
                                  ...editData,
                                  permissions: e.target.checked
                                    ? [...cur, p.id]
                                    : cur.filter((x) => x !== p.id),
                                });
                              }}
                              className="mt-0.5 w-3.5 h-3.5 rounded text-[#10a37f] accent-[#10a37f] disabled:opacity-50"
                            />
                            <div className="flex-1">
                              <span className="font-semibold text-[#0d0d0d] dark:text-[#ececec]">
                                {p.label}
                              </span>
                              <p className="text-[9px] text-[#737373] dark:text-[#8e8e8e] mt-0.5 leading-tight">
                                {p.desc}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
