"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Download,
  Calendar,
  X,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCurrentUser } from "@/hooks/use-dashboard";
import { dashboardService, QuickAddAnimalResponse } from "@/services/dashboard.service";

interface DashboardHeaderProps {
  selectedDateFilter: string;
  onDateFilterChange: (val: string) => void;
}

export default function DashboardHeader({
  selectedDateFilter,
  onDateFilterChange,
}: DashboardHeaderProps) {
  const queryClient = useQueryClient();
  const { user: authUser, isInitialized, isLoading: isAuthLoading } = useAuthStore();
  const { data: dashboardUser, isLoading: isDashboardLoading } = useCurrentUser();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddAnimalModalOpen, setIsAddAnimalModalOpen] = useState(false);
  const [newTagNumber, setNewTagNumber] = useState("");
  const [newAnimalName, setNewAnimalName] = useState("");
  const [newAnimalBreed, setNewAnimalBreed] = useState("Holstein-Friesian");
  const [newAnimalGender, setNewAnimalGender] = useState<"FEMALE" | "MALE">(
    "FEMALE",
  );
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [createdQrUrl, setCreatedQrUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeUser = authUser || dashboardUser;
  const isUserLoading =
    (!isInitialized && isAuthLoading) || (!activeUser && isDashboardLoading);

  const formattedName = React.useMemo(() => {
    if (!activeUser) return "";
    if (activeUser.firstName && activeUser.lastName) {
      return `${activeUser.firstName} ${activeUser.lastName}`.trim();
    }
    if (activeUser.firstName) {
      return activeUser.firstName.trim();
    }
    if ('fullName' in activeUser && activeUser.fullName) {
      return (activeUser.fullName as string).trim();
    }
    if (activeUser.email) {
      return activeUser.email.split("@")[0];
    }
    return "";
  }, [activeUser]);

  const handleDownloadCsv = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://unique-education-production-a86b.up.railway.app";
    window.open(`${apiUrl}/api/dashboard/export`, "_blank");
    setIsExportModalOpen(false);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagNumber.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res: QuickAddAnimalResponse = await dashboardService.quickAddAnimal({
        animalNumber: newTagNumber.trim().toUpperCase(),
        name: newAnimalName.trim() || undefined,
        breed: newAnimalBreed,
        gender: newAnimalGender,
      });

      const qr = res?.animal?.qrCode?.qrImageUrl || null;
      setCreatedQrUrl(qr);
      setIsAddedSuccess(true);
      setIsSubmitting(false);

      // Instantly refresh dashboard metrics & charts in real-time
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
    } catch (err: unknown) {
      setIsSubmitting(false);
      const axiosMsg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg =
        axiosMsg ||
        (err instanceof Error
          ? err.message
          : "Failed to register animal. Please try again.");
      setErrorMessage(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  const handleDownloadQuickQr = () => {
    if (!createdQrUrl) return;
    const link = document.createElement("a");
    link.href = createdQrUrl;
    link.download = `${newTagNumber}-AITS-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseAddModal = () => {
    setIsAddedSuccess(false);
    setIsAddAnimalModalOpen(false);
    setNewTagNumber("");
    setNewAnimalName("");
    setCreatedQrUrl(null);
    setErrorMessage(null);
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <>
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-colors duration-150">
        {/* Left: Greeting & Status */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10a37f]/10 text-[#10a37f] text-[11px] font-semibold tracking-wide uppercase border border-[#10a37f]/20 mb-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Live Surveillance & Traceability</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-[#0d0d0d] dark:text-white tracking-tight">
            {isUserLoading ? (
              <span className="inline-block w-48 h-7 bg-[#f0f0f0] dark:bg-[#383838] animate-pulse rounded-lg" />
            ) : formattedName ? (
              `Welcome back, ${formattedName}`
            ) : (
              "Welcome back"
            )}
          </h1>
          <p className="text-[13.5px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-0.5">
            Real-time livestock telemetry, milk yield metrics, and veterinary
            activity.
          </p>
        </div>

        {/* Right: Actions & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter Selector */}
          <div className="relative inline-flex items-center">
            <Calendar className="absolute left-3 w-4 h-4 text-[#737373] dark:text-[#8e8e8e] pointer-events-none" />
            <select
              value={selectedDateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="pl-9 pr-8 py-2 text-[13px] font-medium bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-[#ececec] hover:border-[#10a37f]/50 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/30 cursor-pointer shadow-2xs"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Quarter">This Quarter</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#0d0d0d] dark:text-[#ececec] bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl hover:bg-[#ececec] dark:hover:bg-[#383838] transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
            <span>Export</span>
          </button>

          {/* Primary Action Button (OpenAI Emerald) */}
          <button
            onClick={() => setIsAddAnimalModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Animal</span>
          </button>
        </div>
      </div>

      {/* 1. Interactive Export Modal Popover */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 z-50 w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsExportModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20">
                  <Download className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white">
                    Export Dashboard Report
                  </h3>
                  <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">
                    Timeline: {selectedDateFilter}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-[#737373] dark:text-[#8e8e8e] hover:bg-[#ececec] dark:hover:bg-[#383838] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleDownloadCsv}
                className="w-full p-3.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f] bg-[#f9f9f9] dark:bg-[#212121] hover:bg-white dark:hover:bg-[#2f2f2f] transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#10a37f]/10 text-[#10a37f]">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f] transition-colors">
                      Executive CSV
                    </h4>
                    <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                      KPIs, milk yield records, and alerts.
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e] group-hover:text-[#10a37f]" />
              </button>

              <button
                onClick={handleDownloadCsv}
                className="w-full p-3.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] hover:border-[#0ea5e9] bg-[#f9f9f9] dark:bg-[#212121] hover:bg-white dark:hover:bg-[#2f2f2f] transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white group-hover:text-[#0ea5e9] transition-colors">
                      Traceability Audit Sheet
                    </h4>
                    <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                      Official biosecurity and compliance record.
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e] group-hover:text-[#0ea5e9]" />
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#e5e5e5] dark:border-[#383838]">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-3.5 py-1.5 text-[13px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#ececec] dark:hover:bg-[#383838] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Quick Add Animal Modal Popover */}
      {isAddAnimalModalOpen && (
        <div
          className="fixed inset-0 z-50 w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsAddAnimalModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20">
                  <Plus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white">
                    Quick Add Livestock Animal
                  </h3>
                  <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">
                    Register into active herd database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddAnimalModalOpen(false)}
                className="p-1 rounded-lg text-[#737373] dark:text-[#8e8e8e] hover:bg-[#ececec] dark:hover:bg-[#383838] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAddedSuccess ? (
              <div className="p-6 text-center flex flex-col items-center justify-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-[#10a37f] animate-bounce" />
                <div>
                  <h4 className="text-[15px] font-bold text-[#0d0d0d] dark:text-white">
                    Animal Registered Successfully!
                  </h4>
                  <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                    Tag #{newTagNumber} is active in traceability grid.
                  </p>
                </div>

                {createdQrUrl && (
                  <div className="p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col items-center">
                    <Image
                      src={createdQrUrl}
                      alt="Animal QR"
                      width={144}
                      height={144}
                      className="w-36 h-36 object-contain"
                      unoptimized
                    />
                    <span className="text-[10px] font-mono font-bold text-[#047857] mt-1">
                      {newTagNumber}
                    </span>
                  </div>
                )}

                <div className="w-full flex flex-col gap-2 pt-2">
                  {createdQrUrl && (
                    <button
                      type="button"
                      onClick={handleDownloadQuickQr}
                      className="w-full py-2.5 px-4 rounded-xl text-[13px] font-bold text-white bg-[#10a37f] hover:bg-[#0e8c6d] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR Code (PNG)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="w-full py-2 px-4 rounded-xl text-[12px] font-semibold text-[#737373] dark:text-[#b4b4b4] hover:bg-[#ececec] dark:hover:bg-[#383838] transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickAdd} className="space-y-3">
                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[12px]">
                    {errorMessage}
                  </div>
                )}
                <div>
                  <label className="block text-[12.5px] font-medium text-[#0d0d0d] dark:text-[#ececec] mb-1">
                    Ear Tag / Animal Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COW-001"
                    value={newTagNumber}
                    onChange={(e) => setNewTagNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-[13px] bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-[#ececec] focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f] uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-[#0d0d0d] dark:text-[#ececec] mb-1">
                    Animal Name / Nickname
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Daisy"
                    value={newAnimalName}
                    onChange={(e) => setNewAnimalName(e.target.value)}
                    className="w-full px-3.5 py-2 text-[13px] bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-[#ececec] focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[12.5px] font-medium text-[#0d0d0d] dark:text-[#ececec] mb-1">
                      Breed
                    </label>
                    <select
                      value={newAnimalBreed}
                      onChange={(e) => setNewAnimalBreed(e.target.value)}
                      className="w-full px-3 py-2 text-[12.5px] bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-[#ececec] focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f]"
                    >
                      <option value="Holstein-Friesian">Holstein</option>
                      <option value="Jersey">Jersey</option>
                      <option value="Ayrshire">Ayrshire</option>
                      <option value="Brown Swiss">Brown Swiss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-medium text-[#0d0d0d] dark:text-[#ececec] mb-1">
                      Gender
                    </label>
                    <select
                      value={newAnimalGender}
                      onChange={(e) =>
                        setNewAnimalGender(e.target.value as "FEMALE" | "MALE")
                      }
                      className="w-full px-3 py-2 text-[12.5px] bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-[#ececec] focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f]"
                    >
                      <option value="FEMALE">Cow (Female)</option>
                      <option value="MALE">Bull (Male)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e5e5e5] dark:border-[#383838] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddAnimalModalOpen(false)}
                    className="px-3.5 py-1.5 text-[13px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#ececec] dark:hover:bg-[#383838] rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting
                      ? "Saving & Generating QR..."
                      : "Save & Generate QR"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
