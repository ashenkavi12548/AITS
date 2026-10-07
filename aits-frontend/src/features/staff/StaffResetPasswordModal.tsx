import React, { useState } from "react";
import { KeyRound, X, Sparkles, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import type { FarmEmployee } from "@/services/farms.service";
import { generateSecurePassword } from "@/features/staff/constants";

interface StaffResetPasswordModalProps {
  isOpen: boolean;
  employee: FarmEmployee | null;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
  isSubmitting: boolean;
}

export function StaffResetPasswordModal({
  isOpen,
  employee,
  onClose,
  onSubmit,
  isSubmitting,
}: StaffResetPasswordModalProps) {
  if (!isOpen || !employee) return null;

  return (
    <StaffResetPasswordModalForm
      employee={employee}
      onClose={onClose}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

function StaffResetPasswordModalForm({
  employee,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  employee: FarmEmployee;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  // Initialize initial password on mount directly without useEffect
  const [password, setPassword] = useState(() => generateSecurePassword());
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(password);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reset password for ${employee.user.fullName}`}
      className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#222] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#10a37f]" />
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Reset Password
            </h3>
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
          <div className="p-3 bg-zinc-50 dark:bg-[#1a1a1a] rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="text-[#737373] dark:text-[#8e8e8e] block">
              Staff Member:
            </span>
            <span className="font-bold text-[#0d0d0d] dark:text-white block mt-0.5">
              {employee.user.fullName}
            </span>
            <span className="text-[11px] text-zinc-500 block">
              {employee.user.email}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#737373] dark:text-[#8e8e8e]">
                New Security Password
              </label>
              <button
                type="button"
                onClick={() => setPassword(generateSecurePassword())}
                className="text-[10px] text-[#10a37f] hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Regenerate
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-xs font-semibold text-[#737373] dark:text-[#ececec] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || password.length < 6}
              className="px-5 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white font-medium text-xs flex items-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
