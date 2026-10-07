"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Key,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  LogOut,
  ShieldAlert,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { SessionDeviceInfo } from "@/types/settings";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string().min(1, "Please confirm your new password."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"]
});

export default function SecurityTab() {
  const { user } = useAuthStore();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [transferProtection, setTransferProtection] = useState(true);
  const [revokingSessions, setRevokingSessions] = useState(false);

  // Active Sessions
  const [sessions, setSessions] = useState<SessionDeviceInfo[]>([
    {
      id: "sess-curr",
      deviceName: "Chrome on Windows",
      browser: "Web Browser (Desktop)",
      ipAddress: "192.168.1.42",
      location: "Western Province, LK",
      lastActive: "Active Now",
      isCurrent: true,
    },
    {
      id: "sess-mobile",
      deviceName: "AITS Mobile App",
      browser: "Android App Client",
      ipAddress: "112.134.198.54",
      location: "Kurunegala, LK",
      lastActive: "2 hours ago",
      isCurrent: false,
    },
  ]);

  // Compute password strength
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  const strengthScore = [
    hasMinLength,
    hasUpper && hasLower,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  const strengthLabel =
    strengthScore === 0
      ? "None"
      : strengthScore === 1
        ? "Weak"
        : strengthScore === 2
          ? "Fair"
          : strengthScore === 3
            ? "Good"
            : "Strong";

  const strengthColor =
    strengthScore <= 1
      ? "bg-rose-500"
      : strengthScore === 2
        ? "bg-amber-500"
        : strengthScore === 3
          ? "bg-[#10a37f]"
          : "bg-[#10a37f]";

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    const parsed = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const err = parsed.error.issues[0].message;
      setPasswordMsg({ type: "error", text: err });
      toast.error(err);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      const successText = res.message || "Password successfully updated.";
      setPasswordMsg({ type: "success", text: successText });
      toast.success(successText);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      let msg = "Failed to change password.";
      if (err && typeof err === "object" && "response" in err) {
        const response = (
          err as { response?: { data?: { message?: string | string[] } } }
        ).response;
        if (response?.data?.message) {
          msg = Array.isArray(response.data.message)
            ? response.data.message.join(", ")
            : response.data.message;
        }
      } else if (err instanceof Error && err.message) {
        msg = err.message;
      }
      setPasswordMsg({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setRevokingSessions(true);
    try {
      await authService.logoutAll();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("All other devices have been signed out.");
    } catch {
      toast.error("Failed to revoke sessions.");
    } finally {
      setRevokingSessions(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Main Row: Password Form & 2FA Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password Form */}
        <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
            <div className="p-2 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
                Change Password
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                Set a strong password to protect your account and farm records.
              </p>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                passwordMsg.type === "success"
                  ? "bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {passwordMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white cursor-pointer"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters recommended"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-2 pt-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#737373] dark:text-[#8e8e8e]">
                      Password Strength
                    </span>
                    <span className="font-bold text-[#0d0d0d] dark:text-white">
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-all duration-300 ${
                          strengthScore >= step
                            ? strengthColor
                            : "bg-[#e5e5e5] dark:bg-[#383838]"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10.5px] text-[#737373] dark:text-[#8e8e8e] pt-1">
                    <span
                      className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                    >
                      {hasMinLength ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      8+ Characters
                    </span>
                    <span
                      className={`flex items-center gap-1 ${hasUpper && hasLower ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                    >
                      {hasUpper && hasLower ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Upper & Lowercase
                    </span>
                    <span
                      className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                    >
                      {hasNumber ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      At least one number
                    </span>
                    <span
                      className={`flex items-center gap-1 ${hasSymbol ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                    >
                      {hasSymbol ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Special symbol (@, #, $)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white font-semibold transition-all shadow-md shadow-[#10a37f]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              <span>
                {passwordLoading ? "Updating Password..." : "Save New Password"}
              </span>
            </button>
          </form>
        </div>

        {/* 2FA & Account Protection */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
              <div className="p-2 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
                  Account Protection & Verification
                </h3>
                <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                  Extra security checks for sensitive operations.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <span className="font-semibold text-[#0d0d0d] dark:text-white block">
                    Email Verification on Sign In
                  </span>
                  <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                    Sends a 6-digit confirmation code to{" "}
                    {user?.email || "your email"} when signing in from an
                    unrecognized device.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => {
                      setTwoFactorEnabled(e.target.checked);
                      toast.success(
                        e.target.checked
                          ? "Email sign-in verification enabled"
                          : "Email sign-in verification disabled",
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <span className="font-semibold text-[#0d0d0d] dark:text-white block">
                    Confirm Livestock Ownership Transfers
                  </span>
                  <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                    Requires password re-entry before completing permanent
                    animal transfers or cull records.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={transferProtection}
                    onChange={(e) => {
                      setTransferProtection(e.target.checked);
                      toast.success("Ownership transfer protection updated");
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#d1d5db] dark:bg-[#404040] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions & Device Management */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
                Active Devices & Sessions
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                Devices currently signed in to your AITS account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRevokeAllSessions}
            disabled={revokingSessions || sessions.length <= 1}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            {revokingSessions ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Sign Out Other Devices</span>
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-[#2b2b2b] text-[#737373] dark:text-[#8e8e8e] shrink-0">
                  {session.isCurrent ? (
                    <Laptop className="w-4 h-4 text-[#10a37f]" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-[#10a37f]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0d0d0d] dark:text-white">
                      {session.deviceName}
                    </span>
                    {session.isCurrent ? (
                      <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-[#10a37f]/15 text-[#10a37f]">
                        Current Device
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-[#f4f4f4] dark:bg-[#2a2a2a] text-[#737373] dark:text-[#8e8e8e]">
                        Mobile App
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                    {session.browser} • {session.ipAddress}
                  </p>
                  <p className="text-[10px] text-[#737373] dark:text-[#8e8e8e]">
                    Location: {session.location}
                  </p>
                </div>
              </div>

              <span className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400 self-end sm:self-center">
                {session.lastActive}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
