"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { authService } from "@/services/auth.service";
import {
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  KeyRound,
} from "lucide-react";
import VerifyEmailModal from "@/components/common/VerifyEmailModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebarStore();
  const { user } = useAuthStore();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResend = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user?.email) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(user.email);
      setResendStatus(res.message || "Verification code sent to your email!");
    } catch {
      setResendStatus(
        "Failed to send verification email. Please try again later.",
      );
    } finally {
      setResending(false);
    }
  };

  const showVerificationBanner =
    user && user.isEmailVerified === false && !bannerDismissed;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-150">
        <Sidebar />
        <div
          className={`flex flex-col transition-all duration-200 min-h-screen ${
            isCollapsed ? "md:ml-16" : "md:ml-64"
          }`}
        >
          <TopHeader />
          {showVerificationBanner && (
            <div
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in cursor-pointer hover:bg-amber-500/15 dark:hover:bg-amber-500/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Your account email{" "}
                  <strong className="font-semibold">{user.email}</strong> is not
                  yet verified. Click to enter your 6-digit OTP code.
                </span>
              </div>
              <div
                className="flex items-center gap-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1 rounded-lg bg-[#10a37f] text-white hover:bg-[#0e8c6d] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify Now</span>
                </button>

                {resendStatus ? (
                  <span className="text-[#10a37f] dark:text-emerald-400 font-medium flex items-center gap-1 text-[11.5px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {resendStatus}
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="px-2.5 py-1 rounded-lg bg-amber-600/20 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-60 text-[11.5px]"
                  >
                    {resending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Mail className="w-3 h-3" />
                    )}
                    <span>Resend OTP</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBannerDismissed(true);
                  }}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-white transition-colors cursor-pointer p-1 rounded-md"
                  title="Dismiss"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>

        {/* Email OTP Verification Popup Modal */}
        {user && (
          <VerifyEmailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            userEmail={user.email}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
