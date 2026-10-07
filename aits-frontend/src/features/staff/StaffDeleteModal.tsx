import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { FarmEmployee } from "@/services/farms.service";

interface StaffDeleteModalProps {
  isOpen: boolean;
  employee: FarmEmployee | null;
  farmName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function StaffDeleteModal({
  isOpen,
  employee,
  farmName,
  onClose,
  onConfirm,
  isSubmitting,
}: StaffDeleteModalProps) {
  if (!isOpen || !employee) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Remove Staff Member"
      className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#222] rounded-2xl border border-rose-500/30 shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Remove Staff Member?
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1">
              Are you sure you want to revoke access for{" "}
              <strong className="text-[#0d0d0d] dark:text-white">
                {employee.user.fullName}
              </strong>{" "}
              from{" "}
              <strong className="text-[#0d0d0d] dark:text-white">
                {farmName ?? "this farm"}
              </strong>
              ?
            </p>
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl mt-3 text-[11px] text-rose-600 dark:text-rose-400">
              This will revoke their facility credentials. Historical records and
              audit trails will be permanently preserved for traceability
              compliance.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-[#e5e5e5] dark:border-[#383838]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-xs font-semibold text-[#737373] dark:text-[#ececec] hover:bg-zinc-100 dark:hover:bg-[#303030] cursor-pointer"
          >
            Keep Member
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Remove from Farm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
