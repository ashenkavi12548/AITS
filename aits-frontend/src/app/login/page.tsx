"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/schemas/auth/login.schema';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Activity,
  Radio,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import AitsLogo from "@/components/common/AitsLogo";
import { getFirstAccessibleRoute } from "@/config/navigation.config";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const decodedRedirect = redirectParam ? decodeURIComponent(redirectParam) : null;
  const {
    user,
    login,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,
    clearError,
    hasPermissionOnFarm,
  } = useAuthStore();

  const redirectUrl =
    decodedRedirect && decodedRedirect !== "/" && decodedRedirect !== "/login"
      ? decodedRedirect
      : getFirstAccessibleRoute(user, hasPermissionOnFarm);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: true,
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isInitialized, isAuthenticated, router, redirectUrl]);

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const success = await login({
      email: data.identifier,
      identifier: data.identifier,
      password: data.password,
    });
    if (success) {
      toast.success('Successfully logged in!');
    } else {
      toast.error('Authentication failed. Please check your credentials.');
    }
  };

  if (!isInitialized || isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#10a37f]/20 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/30 shadow-xs animate-pulse">
            <Radio className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Loader2 className="w-4 h-4 animate-spin text-[#10a37f]" />
            <span>Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative text-[#0d0d0d] dark:text-[#ececec] overflow-hidden">
      {/* Immersive Realistic Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 pointer-events-none"
        style={{
          backgroundImage: `url('/images/farm-login-bg.jpg')`,
        }}
      />

      {/* Modern Gradient & Blur Overlays */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/60 dark:from-black/90 dark:via-black/60 dark:to-black/75 backdrop-blur-[2px] pointer-events-none" />

      {/* Top minimal glass navigation */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/15 dark:border-white/10 bg-black/30 backdrop-blur-md relative z-20">
        <Link href="/" className="inline-flex items-center">
          <AitsLogo
            variant="full"
            size="sm"
          />
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/80 hidden sm:inline font-medium">
            New farm owner?
          </span>
          <Link
            href="/register"
            className="font-medium text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all px-3.5 py-1.5 rounded-xl backdrop-blur-sm"
          >
            Register Farm Facility
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Card Container with Glassmorphism */}
          <div className="bg-white/92 dark:bg-[#1a1a1a]/92 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Ambient subtle light glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#10a37f]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[#0ea5e9]/15 blur-3xl pointer-events-none" />

            {/* Header Section */}
            <div className="text-center mb-6 flex flex-col items-center">
              <div className="mb-3">
                <AitsLogo variant="icon" size="xl" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                Sign In to AITS
              </h1>
              <p className="text-xs text-[#737373] dark:text-[#a0a0a0] mt-1.5 max-w-xs mx-auto">
                Livestock Identification, Dairy Yield & Traceability Platform
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                >
                  &times;
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email or Phone Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1.5">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                  <input
                    type="text"
                    {...register("identifier")}
                    placeholder="farmer@livestock.lk or +94 77 123 4567"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-white/70 dark:bg-[#111111]/70 text-[#0d0d0d] dark:text-[#ececec] border rounded-xl text-sm placeholder:text-[#8e8e8e] dark:placeholder:text-[#666] focus:outline-none focus:ring-2 transition-all ${
                      errors.identifier
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"
                    }`}
                  />
                </div>
                {errors.identifier && (
                  <p className="mt-1 text-xs text-rose-500">{errors.identifier.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      toast(
                        'Password reset: Please contact your system administrator or farm owner.',
                        { icon: 'ℹ️', duration: 6000 },
                      )
                    }
                    className="text-[11px] text-[#10a37f] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Enter your security password"
                    className={`w-full pl-10 pr-10 py-2.5 bg-white/70 dark:bg-[#111111]/70 text-[#0d0d0d] dark:text-[#ececec] border rounded-xl text-sm placeholder:text-[#8e8e8e] dark:placeholder:text-[#666] focus:outline-none focus:ring-2 transition-all ${
                      errors.password
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
              )}

              {/* Remember me option */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  {...register("rememberMe")}
                  className="w-4 h-4 rounded border-[#e5e5e5] dark:border-[#383838] text-[#10a37f] accent-[#10a37f] focus:ring-[#10a37f] cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-[#737373] dark:text-[#a0a0a0] cursor-pointer select-none"
                >
                  Stay signed in on this workstation (Dual-JWT Session)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-linear-to-r from-[#10a37f] to-[#0e8c6d] hover:from-[#0e8c6d] hover:to-[#0c7a5f] active:scale-[0.99] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#10a37f]/30 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security Features Footer */}
          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-white/80">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10a37f]" />
              <span>Dual-JWT Auth</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span>RBAC Protected</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>ISO 22005 Traceable</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-white/70 border-t border-white/10 bg-black/40 backdrop-blur-md relative z-20">
        AITS Livestock Traceability & Cloud Platform &copy;{" "}
        {new Date().getFullYear()} Ceylon Nest. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#10a37f]/20 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/30 shadow-xs animate-pulse">
              <Radio className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Loader2 className="w-4 h-4 animate-spin text-[#10a37f]" />
              <span>Checking authentication...</span>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
