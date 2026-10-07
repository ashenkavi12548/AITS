"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormData,
} from "@/schemas/auth/register.schema";
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { authService } from "@/services/auth.service";
import AitsLogo from "@/components/common/AitsLogo";

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    verifyOtp,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const {
    register: formRegister,
    handleSubmit: formHandleSubmit,
    trigger,
    control,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      farmName: "",
      farmType: "Dairy & Cattle",
      province: "Central Province",
      district: "Kandy",
      city: "Kandy",
      agreeTerms: true,
    },
    mode: "onTouched",
  });

  const passwordValue = useWatch({ control, name: "password" }) || "";
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Step 3: OTP State
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const canResend = countdown === 0;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === 3 && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  // Password strength calculator
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculatePasswordStrength(passwordValue);

  const getStrengthLabel = (score: number) => {
    if (!passwordValue) return { label: "None", color: "bg-transparent" };
    if (score <= 2) return { label: "Weak", color: "bg-rose-500" };
    if (score === 3 || score === 4)
      return { label: "Good", color: "bg-amber-500" };
    return { label: "Strong", color: "bg-[#10a37f]" };
  };

  const handleNext = async () => {
    if (step === 1) {
      setLocalError(null);
      const isValid = await trigger([
        "firstName",
        "lastName",
        "email",
        "phone",
        "password",
        "confirmPassword",
      ]);
      if (isValid) {
        setStep(2);
      }
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLocalError(null);
    clearError();

    const success = await register({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
      role: "FARMER",
      farmName: data.farmName || `${data.firstName}'s Livestock Facility`,
      farmType: data.farmType,
      province: data.province,
      district: data.district,
      city: data.city,
    });

    if (success) {
      setRegisteredEmail(data.email);
      router.push('/dashboard');
    }
  };

  // OTP Handling
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

    // If all 6 digits entered, auto submit
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      submitOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      submitOtp(pastedData);
    }
  };

  const submitOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join("");
    if (code.length !== 6) {
      setOtpError("Please enter all 6 digits of your verification code.");
      return;
    }

    setOtpVerifying(true);
    setOtpError(null);
    const targetEmail = registeredEmail || getValues("email");

    const success = await verifyOtp({
      email: targetEmail,
      otp: code,
    });

    setOtpVerifying(false);
    if (success) {
      router.push("/dashboard");
    } else {
      setOtpError(
        "Invalid or expired 6-digit verification code. Please check your email and try again.",
      );
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resendLoading) return;
    const targetEmail = registeredEmail || getValues("email");
    if (!targetEmail) return;

    setResendLoading(true);
    setResendStatus(null);
    setOtpError(null);

    try {
      const res = await authService.resendVerification(targetEmail);
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
          : "Failed to resend verification code.");
      setResendStatus(Array.isArray(errTxt) ? errTxt.join(", ") : errTxt);
    } finally {
      setResendLoading(false);
    }
  };

  const displayedError = localError || error;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative text-[#0d0d0d] dark:text-[#ececec] overflow-hidden">
      {/* Immersive Realistic Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 pointer-events-none"
        style={{
          backgroundImage: `url('/images/farm-register-bg.jpg')`,
        }}
      />

      {/* Modern Gradient & Blur Overlays */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/45 to-black/60 dark:from-black/90 dark:via-black/60 dark:to-black/75 backdrop-blur-[2px] pointer-events-none" />

      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/15 dark:border-white/10 bg-black/30 backdrop-blur-md relative z-20">
        <Link href="/" className="inline-flex items-center">
          <AitsLogo variant="full" size="sm" />
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/80 hidden sm:inline font-medium">
            Already registered?
          </span>
          <Link
            href="/login"
            className="font-medium text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all px-3.5 py-1.5 rounded-xl backdrop-blur-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-xl">
          {/* Progress Indicator (3 Steps) */}
          <div className="mb-4 bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold text-white/80 mb-2 px-1">
              <span className={step >= 1 ? "text-[#10a37f] font-bold" : ""}>
                1. Credentials
              </span>
              <span className={step >= 2 ? "text-[#10a37f] font-bold" : ""}>
                2. Facility Setup
              </span>
              <span className={step >= 3 ? "text-[#10a37f] font-bold" : ""}>
                3. Email OTP
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#10a37f] transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Card Container */}
          <div className="bg-white/92 dark:bg-[#1a1a1a]/92 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#10a37f]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[#0ea5e9]/15 blur-3xl pointer-events-none" />

            {/* Error banner for Step 1 & 2 */}
            {step !== 3 && displayedError && (
              <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{displayedError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    clearError();
                  }}
                  className="text-rose-500 font-bold ml-1"
                >
                  &times;
                </button>
              </div>
            )}

            {/* STEP 1: Account Information */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="mb-4">
                  <h2 className="text-xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                    Register as Farm Owner / Farmer
                  </h2>
                  <p className="text-xs text-[#737373] dark:text-[#a0a0a0] mt-1">
                    Create your farm facility account. Farm workers and
                    employees will be added directly from inside your farm
                    workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                      <input
                        type="text"
                        {...formRegister("firstName")}
                        placeholder="e.g. Sunil"
                        className={`w-full pl-10 pr-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.firstName ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"}`}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...formRegister("lastName")}
                      placeholder="e.g. Perera"
                      className={`w-full px-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.lastName ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"}`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                      <input
                        type="email"
                        {...formRegister("email")}
                        placeholder="farmer@livestock.lk"
                        className={`w-full pl-10 pr-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.email ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                      <input
                        type="tel"
                        {...formRegister("phone")}
                        placeholder="+94 77 123 4567"
                        className={`w-full pl-10 pr-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      Security Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        {...formRegister("password")}
                        placeholder="Min 6 characters"
                        className={`w-full pl-10 pr-10 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.password ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...formRegister("confirmPassword")}
                      placeholder="Repeat password"
                      className={`w-full px-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"}`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password strength indicator */}
                {passwordValue && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] mb-1 text-[#737373] dark:text-[#8e8e8e]">
                      <span>Password Strength</span>
                      <span className="font-semibold">
                        {getStrengthLabel(strength).label}
                      </span>
                    </div>
                    <div className="flex gap-1.5 h-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all ${
                            i <= strength
                              ? getStrengthLabel(strength).color
                              : "bg-[#e5e5e5] dark:bg-[#383838]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full mt-4 py-3 px-4 rounded-xl bg-linear-to-r from-[#10a37f] to-[#0e8c6d] hover:from-[#0e8c6d] hover:to-[#0c7a5f] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#10a37f]/30 transition-all cursor-pointer"
                >
                  <span>Continue to Facility Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Facility / Farm Details */}
            {step === 2 && (
              <form
                onSubmit={(e) => {
                  void formHandleSubmit(onSubmit)(e);
                }}
                className="space-y-4 animate-in fade-in"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                    Farm Facility Setup
                  </h2>
                  <p className="text-xs text-[#737373] dark:text-[#a0a0a0] mt-1">
                    Establish your agricultural holding and regional registry
                    profile.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                    Farm / Livestock Facility Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                    <input
                      type="text"
                      {...formRegister("farmName")}
                      placeholder="e.g. Highland Dairy Farm"
                      className={`w-full pl-10 pr-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.farmName ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-[#10a37f]/20"}`}
                    />
                  </div>
                  {errors.farmName && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.farmName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      Operation Type
                    </label>
                    <select
                      {...formRegister("farmType")}
                      className={`w-full px-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none cursor-pointer ${errors.farmType ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f]"}`}
                    >
                      <option value="Dairy & Cattle">Dairy & Cattle</option>
                      <option value="Beef Production">Beef Production</option>
                      <option value="Breeding & Genetics">
                        Breeding & Genetics Center
                      </option>
                      <option value="Mixed Livestock">Mixed Livestock</option>
                    </select>
                    {errors.farmType && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.farmType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      Province / Region
                    </label>
                    <select
                      {...formRegister("province")}
                      className={`w-full px-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none cursor-pointer ${errors.province ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f]"}`}
                    >
                      <option value="Central Province">Central Province</option>
                      <option value="Western Province">Western Province</option>
                      <option value="North Western Province">
                        North Western Province
                      </option>
                      <option value="Southern Province">
                        Southern Province
                      </option>
                      <option value="Northern Province">
                        Northern Province
                      </option>
                      <option value="Eastern Province">Eastern Province</option>
                      <option value="North Central Province">
                        North Central Province
                      </option>
                      <option value="Uva Province">Uva Province</option>
                      <option value="Sabaragamuwa Province">
                        Sabaragamuwa Province
                      </option>
                    </select>
                    {errors.province && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.province.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      District
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                      <input
                        type="text"
                        {...formRegister("district")}
                        placeholder="e.g. Kandy"
                        className={`w-full pl-10 pr-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none transition-all ${errors.district ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f]"}`}
                      />
                    </div>
                    {errors.district && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.district.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      {...formRegister("city")}
                      placeholder="e.g. Peradeniya"
                      className={`w-full px-3.5 py-2 bg-white/70 dark:bg-[#111111]/70 border rounded-xl text-sm focus:outline-none transition-all ${errors.city ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f]"}`}
                    />
                    {errors.city && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="pt-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="terms"
                      {...formRegister("agreeTerms")}
                      className="mt-0.5 w-4 h-4 rounded text-[#10a37f] accent-[#10a37f] cursor-pointer"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-[#737373] dark:text-[#a0a0a0] cursor-pointer select-none"
                    >
                      I confirm that I am the authorized operator of this
                      facility and agree to the National Livestock Traceability
                      standards.
                    </label>
                  </div>
                  {errors.agreeTerms && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.agreeTerms.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2.5 px-4 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-xs font-semibold text-[#737373] dark:text-[#ececec] hover:bg-[#ececec] dark:hover:bg-[#303030] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-[#10a37f] to-[#0e8c6d] hover:from-[#0e8c6d] hover:to-[#0c7a5f] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#10a37f]/30 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit & Verify Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Dedicated 6-Digit Email OTP Verification Screen */}
            {step === 3 && (
              <div className="text-center py-2 animate-in fade-in space-y-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] mb-1 border border-[#10a37f]/20 shadow-sm">
                  <KeyRound className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                    Check Your Inbox
                  </h2>
                  <p className="text-xs text-[#737373] dark:text-[#a0a0a0] mt-1 max-w-sm mx-auto">
                    We sent a 6-digit verification code to
                  </p>
                  <div className="inline-flex items-center gap-2 mt-2 px-3.5 py-1 rounded-full bg-[#f4f4f4] dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838]">
                    <Mail className="w-3.5 h-3.5 text-[#10a37f]" />
                    <span className="text-xs font-semibold text-[#10a37f]">
                      {registeredEmail || getValues("email")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white underline cursor-pointer ml-1"
                      title="Edit email"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Error Banner for OTP */}
                {otpError && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Resend Status */}
                {resendStatus && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/20 text-[#10a37f] text-xs flex items-center justify-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{resendStatus}</span>
                  </div>
                )}

                {/* 6-Digit OTP Boxes */}
                <div className="py-2">
                  <div
                    className="flex justify-center items-center gap-2 sm:gap-3"
                    onPaste={handleOtpPaste}
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
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border bg-white/80 dark:bg-[#111111]/80 text-[#0d0d0d] dark:text-white transition-all outline-none ${
                          digit
                            ? "border-[#10a37f] shadow-md shadow-[#10a37f]/20 ring-2 ring-[#10a37f]/20"
                            : "border-[#e5e5e5] dark:border-[#383838] focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={() => submitOtp()}
                  disabled={otpVerifying || otp.some((d) => d === "")}
                  className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-[#10a37f] to-[#0e8c6d] hover:from-[#0e8c6d] hover:to-[#0c7a5f] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#10a37f]/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating Security Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code & Enter Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend OTP Timer & Actions */}
                <div className="pt-2 text-center text-xs text-[#737373] dark:text-[#a0a0a0]">
                  {countdown > 0 ? (
                    <p>
                      Didn&apos;t receive the email? Resend available in{" "}
                      <span className="font-semibold text-[#10a37f]">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#10a37f] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {resendLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>Resend Verification Code</span>
                    </button>
                  )}
                </div>
              </div>
            )}
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
