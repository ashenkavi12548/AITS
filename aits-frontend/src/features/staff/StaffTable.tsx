import React from "react";
import { KeyRound, Edit3, Trash2 } from "lucide-react";
import type { FarmEmployee } from "@/services/farms.service";
import {
  PERMISSION_GROUPS,
} from "./constants";
import { getRoleDisplayConfig } from "@/utils/role.utils";

interface StaffTableProps {
  employees: FarmEmployee[];
  currentUserId?: string;
  onToggleStatus: (emp: FarmEmployee) => void;
  onOpenResetPass: (emp: FarmEmployee) => void;
  onOpenEditModal: (emp: FarmEmployee) => void;
  onPromptDelete: (emp: FarmEmployee) => void;
  onOpenAssignTask?: (emp: FarmEmployee) => void;
}

export function StaffTable({
  employees,
  currentUserId,
  onToggleStatus,
  onOpenResetPass,
  onOpenEditModal,
  onPromptDelete,
  onOpenAssignTask,
}: StaffTableProps) {
  return (
    <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f9f9f9] dark:bg-[#1c1c1c] border-b border-[#e5e5e5] dark:border-[#383838] text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
              <th className="py-3.5 px-4">Staff Member</th>
              <th className="py-3.5 px-4">Farm Role</th>
              <th className="py-3.5 px-4">Account Status</th>
              <th className="py-3.5 px-4">Operational Permissions Scope</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#383838] text-xs">
            {employees.map((emp) => {
              const isOwner = emp.farmRole === "OWNER";
              const isCurrentUser = currentUserId === emp.userId;
              const roleInfo = getRoleDisplayConfig(emp.farmRole);
              const RoleIcon = roleInfo.icon;
              const empPerms = emp.user.permissions || [];

              return (
                <tr
                  key={emp.id}
                  className="hover:bg-zinc-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  {/* Member info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {emp.user.profileImageUrl ? (
                        <img
                          src={emp.user.profileImageUrl}
                          alt={emp.user.fullName}
                          className="w-9 h-9 rounded-xl object-cover shrink-0 border border-[#10a37f]/30 shadow-sm"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#10a37f]/20 to-sky-500/20 text-[#10a37f] flex items-center justify-center font-bold text-xs border border-[#10a37f]/30 shrink-0">
                          {emp.user.firstName?.charAt(0) || "U"}
                          {emp.user.lastName?.charAt(0) || ""}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-1.5">
                          <span>{emp.user.fullName}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] block">
                          {emp.user.email}
                        </span>
                        {emp.user.phone && (
                          <span className="text-[10px] text-zinc-500 block">
                            {emp.user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleInfo.badgeClass}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {roleInfo.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      disabled={isOwner}
                      onClick={() => onToggleStatus(emp)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        emp.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                      } ${isOwner ? "cursor-default" : "cursor-pointer"}`}
                      title={
                        isOwner
                          ? "Owner cannot be deactivated"
                          : "Click to toggle status"
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          emp.status === "ACTIVE"
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                        }`}
                      />
                      {emp.status}
                    </button>
                  </td>

                  {/* Permissions Scope */}
                  <td className="py-3.5 px-4 max-w-sm">
                    {isOwner ? (
                      <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                        Full Administrative Control
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {PERMISSION_GROUPS.map((g) => {
                          const PermIcon = g.icon;
                          return g.permissions.map((p) => {
                            const has =
                              empPerms.includes(p.id) ||
                              emp.farmRole === "MANAGER";
                            if (!has) return null;
                            return (
                              <span
                                key={p.id}
                                className={`text-[10px] px-2 py-0.5 rounded border inline-flex items-center gap-1 ${g.color}`}
                              >
                                {PermIcon && <PermIcon className="w-2.5 h-2.5" />}
                                {p.shortLabel}
                              </span>
                            );
                          });
                        })}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenResetPass(emp)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {onOpenAssignTask && (
                        <button
                          type="button"
                          onClick={() => onOpenAssignTask(emp)}
                          className="p-1.5 rounded-lg text-[#10a37f] hover:text-[#0e8c6d] hover:bg-[#10a37f]/10 transition-colors cursor-pointer"
                          title="Assign Task"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                      )}

                      {!isOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(emp)}
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Edit Staff Member"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onPromptDelete(emp)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
