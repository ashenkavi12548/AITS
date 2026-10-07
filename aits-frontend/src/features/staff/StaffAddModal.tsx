import React, { useState } from "react";
import {
  X,
  UserPlus,
  Mail,
  Lock,
  Phone,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Camera,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useAuthStore } from "@/stores/useAuthStore";
import { farmsService } from "@/services/farms.service";
import type {
  CreateEmployeeInput,
  FarmEmployee,
} from "@/services/farms.service";
import {
  PERMISSION_GROUPS,
  ROLE_PRESET_PERMISSIONS,
  generateSecurePassword,
} from "@/features/staff/constants";

interface StaffAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEmployeeInput) => Promise<void>;
  isSubmitting: boolean;
  employees: FarmEmployee[];
}

export function StaffAddModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  employees,
}: StaffAddModalProps) {
  const { hasPermissionOnFarm } = useAuthStore();
  const [formData, setFormData] = useState<CreateEmployeeInput>({
    firstName: "",
    lastName: "",
    email: "",
    password: generateSecurePassword(),
    phone: "",
    role: "WORKER",
    permissions: ROLE_PRESET_PERMISSIONS.WORKER,
    assignedStaff: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingPhoto(true);
    try {
      const result = await farmsService.uploadStaffPhoto(file);
      if (result.success) {
        setFormData(prev => ({ ...prev, profileImageUrl: result.imageUrl }));
        toast.success("Photo uploaded successfully");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form upon successful submission
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: generateSecurePassword(),
      phone: "",
      role: "WORKER",
      permissions: ROLE_PRESET_PERMISSIONS.WORKER,
      assignedStaff: [],
      profileImageUrl: undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Farm Staff Member"
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
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                Add Farm Staff Member
              </h3>
              <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                Assign roles and delegate daily barn operations
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
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-center overflow-hidden">
                {formData.profileImageUrl ? (
                  <Image src={formData.profileImageUrl} alt="Profile" fill className="object-cover" unoptimized />
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
            <span className="text-[10px] text-zinc-500 mt-1.5 font-medium">Upload Photo (Optional)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="e.g. Kasun"
                className="w-full px-3.5 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="e.g. Bandara"
                className="w-full px-3.5 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
              Email / Login Identifier <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="worker@prasagefarm.lk"
                className="w-full pl-9 pr-3 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e]">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      password: generateSecurePassword(),
                    })
                  }
                  className="text-[10px] text-[#10a37f] hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Generate
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min 6 chars"
                  className="w-full pl-9 pr-8 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="077 123 4567"
                  className="w-full pl-9 pr-3 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
              Farm Role Designation
            </label>
            <select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as CreateEmployeeInput["role"];
                const presets =
                  newRole && ROLE_PRESET_PERMISSIONS[newRole]
                    ? ROLE_PRESET_PERMISSIONS[newRole]
                    : [];
                setFormData({
                  ...formData,
                  role: newRole,
                  permissions: presets,
                });
              }}
              className="w-full px-3 py-2 bg-[#f6f6f6] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white cursor-pointer"
            >
              <option value="WORKER">
                Farm Worker (Milking, Feeding & Daily Barn Chores)
              </option>
              {hasPermissionOnFarm("manager:appoint") && (
                <option value="MANAGER">
                  Farm Manager (Workforce Supervision & Reports)
                </option>
              )}
              <option value="VETERINARIAN">
                Resident Veterinarian (Clinical & Health Records)
              </option>
              <option value="AUDITOR">
                Auditor / Compliance Inspector (Traceability Review)
              </option>
            </select>
          </div>

          {/* Assigned Staff (Only for Managers) */}
          {formData.role === "MANAGER" && (
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
                          ?.filter((emp) => emp.farmRole !== "OWNER")
                          .map((emp) => emp.id) || [];
                      setFormData({
                        ...formData,
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
                      setFormData({ ...formData, assignedStaff: [] })
                    }
                    className="text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </label>
              <div className="space-y-2 p-3 bg-zinc-50 dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#383838] max-h-40 overflow-y-auto">
                {employees?.filter((emp) => emp.farmRole !== "OWNER").length ===
                0 ? (
                  <p className="text-xs text-zinc-500">
                    No other staff members available.
                  </p>
                ) : (
                  employees
                    ?.filter((emp) => emp.farmRole !== "OWNER")
                    .map((emp) => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.assignedStaff?.includes(emp.id) || false
                          }
                          onChange={(e) => {
                            const newStaff = e.target.checked
                              ? [...(formData.assignedStaff || []), emp.id]
                              : (formData.assignedStaff || []).filter(
                                  (id) => id !== emp.id,
                                );
                            setFormData({
                              ...formData,
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

          {/* Granular Permissions Section */}
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
                    ).map((p) => p.id);
                    setFormData({
                      ...formData,
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
                    setFormData({
                      ...formData,
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
                  (formData.permissions || []).includes(id),
                );
                const isGroupPartiallyChecked =
                  !isGroupFullyChecked &&
                  groupPermIds.some((id) =>
                    (formData.permissions || []).includes(id),
                  );

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#e5e5e5] dark:border-[#333]">
                      <input
                        type="checkbox"
                        checked={isGroupFullyChecked}
                        disabled={group.permissions.some(p => !hasPermissionOnFarm(p.id))}
                        ref={(el) => {
                          if (el) el.indeterminate = isGroupPartiallyChecked;
                        }}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          // Only include permissions the user is allowed to assign
                          const assignableGroupPermIds = groupPermIds.filter(id => hasPermissionOnFarm(id));
                          
                          if (checked) {
                            const newPerms = Array.from(
                              new Set([
                                ...(formData.permissions || []),
                                ...assignableGroupPermIds,
                              ]),
                            );
                            setFormData({ ...formData, permissions: newPerms });
                          } else {
                            const newPerms = (formData.permissions || []).filter(
                              (id) => !assignableGroupPermIds.includes(id),
                            );
                            setFormData({ ...formData, permissions: newPerms });
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
                        const isChecked = (formData.permissions || []).includes(
                          p.id,
                        );
                        const canAssign = hasPermissionOnFarm(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2 ${!canAssign ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-xs select-none p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#252525] transition-colors`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!canAssign}
                              onChange={(e) => {
                                if (!canAssign) return;
                                const cur = formData.permissions || [];
                                setFormData({
                                  ...formData,
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
              <span>Create Employee</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
