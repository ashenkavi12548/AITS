import React from "react";
import {
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  KeyRound,
  Edit3,
  Trash2,
} from "lucide-react";
import type { FarmEmployee } from "@/services/farms.service";
import {
  PERMISSION_GROUPS,
} from "@/features/staff/constants";
import { getRoleDisplayConfig } from "@/utils/role.utils";

interface StaffCardProps {
  employee: FarmEmployee;
  isCurrentUser: boolean;
  onToggleStatus: (emp: FarmEmployee) => void;
  onOpenResetPass: (emp: FarmEmployee) => void;
  onOpenEditModal: (emp: FarmEmployee) => void;
  onPromptDelete: (emp: FarmEmployee) => void;
  onOpenAssignTask?: (emp: FarmEmployee) => void;
}

export function StaffCard({
  employee: emp,
  isCurrentUser,
  onToggleStatus,
  onOpenResetPass,
  onOpenEditModal,
  onPromptDelete,
  onOpenAssignTask,
}: StaffCardProps) {
  const isOwner = emp.farmRole === "OWNER";
  const roleInfo = getRoleDisplayConfig(emp.farmRole);
  const RoleIcon = roleInfo.icon;
  const empPerms = emp.user.permissions || [];

  return (
    <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs hover:border-[#10a37f]/40 transition-all p-5 flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name, Role, Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {emp.user.profileImageUrl ? (
              <img
                src={emp.user.profileImageUrl}
                alt={emp.user.fullName}
                className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-[#10a37f]/30 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#10a37f]/20 via-teal-500/10 to-sky-500/20 text-[#10a37f] border border-[#10a37f]/30 flex items-center justify-center font-bold text-base shrink-0">
                {emp.user.firstName?.charAt(0) || "U"}
                {emp.user.lastName?.charAt(0) || ""}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-[#0d0d0d] dark:text-white">
                  {emp.user.fullName}
                </h3>
                {isCurrentUser && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleInfo.badgeClass}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Status Toggle Button */}
          <button
            type="button"
            disabled={isOwner}
            onClick={() => onToggleStatus(emp)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
              emp.status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
            } ${isOwner ? "cursor-default" : "cursor-pointer"}`}
            title={
              isOwner
                ? "Owner account cannot be deactivated"
                : "Click to toggle active status"
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                emp.status === "ACTIVE"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            {emp.status}
          </button>
        </div>

        {/* Contact details */}
        <div className="mt-4 space-y-1.5 text-xs text-[#737373] dark:text-[#a0a0a0] bg-zinc-50 dark:bg-[#1c1c1c] p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 shrink-0 text-[#888]" />
            <a
              href={`mailto:${emp.user.email}`}
              className="hover:underline hover:text-[#10a37f] truncate"
            >
              {emp.user.email}
            </a>
          </div>
          {emp.user.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 shrink-0 text-[#888]" />
              <a
                href={`tel:${emp.user.phone}`}
                className="hover:underline hover:text-[#10a37f]"
              >
                {emp.user.phone}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>No telephone registered</span>
            </div>
          )}
        </div>

        {/* Operational Permissions Scope */}
        <div className="mt-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e] block mb-1.5">
            Operational Scope
          </span>
          {isOwner ? (
            <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Administrator & Farm Authority</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {PERMISSION_GROUPS.map((g) => {
                const PermIcon = g.icon || ShieldCheck;
                return g.permissions.map((perm) => {
                  const hasPerm =
                    empPerms.includes(perm.id) || emp.farmRole === "MANAGER";
                  return (
                    <span
                      key={perm.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                        hasPerm
                          ? g.color
                          : "opacity-35 line-through bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-transparent"
                      }`}
                      title={
                        hasPerm ? perm.desc : `No access: ${perm.label}`
                      }
                    >
                      <PermIcon className="w-2.5 h-2.5" />
                      {perm.shortLabel}
                    </span>
                  );
                });
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="mt-5 pt-3.5 border-t border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Calendar className="w-3 h-3" />
          <span>Joined {new Date(emp.joinedAt).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenResetPass(emp)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#303030] hover:bg-zinc-200 dark:hover:bg-[#3d3d3d] text-[#737373] dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset Security Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Password</span>
          </button>

          {onOpenAssignTask && (
            <button
              type="button"
              onClick={() => onOpenAssignTask(emp)}
              className="px-2.5 py-1.5 rounded-lg bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] dark:text-[#12b88f] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Assign Task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              <span className="hidden sm:inline">Assign</span>
            </button>
          )}

          {!isOwner && (
            <>
              <button
                type="button"
                onClick={() => onOpenEditModal(emp)}
                className="px-2.5 py-1.5 rounded-lg bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Edit Role & Scope"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => onPromptDelete(emp)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                title="Remove from Farm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
