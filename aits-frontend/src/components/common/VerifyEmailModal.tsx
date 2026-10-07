"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { authService } from "@/services/auth.service";
import AitsLogo from "@/components/common/AitsLogo";

interface VerifyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function VerifyEmailModal({
  isOpen,
  onClose,
  userEmail,
}: VerifyEmailModalProps) {
  const { verifyOtp, updateUser } = useAuthStore();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const canResend = countdown === 0;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first box when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Resend countdown timer
  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newOtp = [...otp];
    if (cleanVal.length <= 1) {
      newOtp[index] = cleanVal;
      setOtp(newOtp);
      setOtpError(null);
      if (cleanVal && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      submitVerification(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      submitVerification(pastedData);
    }
  };

  const submitVerification = async (codeToSubmit?: string) => {
    const code = codeToSubmit || otp.join("");
    if (code.length !== 6) {
      setOtpError("Please enter all 6 digits of the code.");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    const success = await verifyOtp({
      email: userEmail,
      otp: code,
    });

    setIsVerifying(false);

    if (success) {
      setIsSuccess(true);
      updateUser({ isEmailVerified: true });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setOtpError(
        "Invalid or expired 6-digit verification code. Please request a new code.",
      );
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    setResendLoading(true);
    setResendStatus(null);
    setOtpError(null);

    try {
      const res = await authService.resendVerification(userEmail);
      setResendStatus(
        res.message || "A fresh 6-digit verification code has been dispatched.",
      );
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const errTxt =
        axiosErr.response?.data?.message ||
        (err instanceof Error
          ? err.message
          : "Failed to dispatch verification email.");
      setResendStatus(Array.isArray(errTxt) ? errTxt.join(", ") : errTxt);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1f1f1f] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl p-6 sm:p-7 relative overflow-hidden text-[#0d0d0d] dark:text-[#ececec] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Light */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#10a37f]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-[#0ea5e9]/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-3 animate-in fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
              <CheckCircle2 className="w-9 h-9 text-[#10a37f]" />
            </div>
            <h3 className="text-xl font-bold text-[#0d0d0d] dark:text-white">
              Email Verified Successfully!
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#a0a0a0] max-w-xs mx-auto">
              Your farm identity is verified. Full livestock tracking, QR
              tagging, and export features are now unlocked.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header with Tracker Logo */}
            <div className="text-center">
              <div className="mb-2.5 flex justify-center">
                <AitsLogo size="md" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                Verify Account Email
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#a0a0a0] mt-1 max-w-xs mx-auto">
                Enter the 6-digit verification code dispatched to:
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-[#f4f4f4] dark:bg-[#2a2a2a] border border-[#e5e5e5] dark:border-[#383838]">
                <Mail className="w-3.5 h-3.5 text-[#10a37f]" />
                <span className="text-xs font-semibold text-[#10a37f]">
                  {userEmail}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {otpError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* Resend Status */}
            {resendStatus && (
              <div className="p-2.5 rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/20 text-[#10a37f] text-xs flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resendStatus}</span>
              </div>
            )}

            {/* 6 OTP Boxes */}
            <div className="py-2">
              <div
                className="flex justify-center items-center gap-2 sm:gap-2.5"
                onPaste={handlePaste}
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border bg-white dark:bg-[#141414] text-[#0d0d0d] dark:text-white transition-all outline-none ${
                      digit
                        ? "border-[#10a37f] shadow-sm ring-2 ring-[#10a37f]/20"
                        : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => submitVerification()}
              disabled={isVerifying || otp.some((d) => d === "")}
              className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-[#10a37f] to-[#0e8c6d] hover:from-[#0e8c6d] hover:to-[#0c7a5f] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#10a37f]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating OTP Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Unlock Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend Actions */}
            <div className="text-center text-xs text-[#737373] dark:text-[#a0a0a0] pt-1">
              {countdown > 0 ? (
                <p>
                  Didn&apos;t get the code? Resend in{" "}
                  <span className="font-semibold text-[#10a37f]">
                    {countdown}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#10a37f] hover:underline cursor-pointer disabled:opacity-50"
                >
                  {resendLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Resend 6-Digit Code</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
