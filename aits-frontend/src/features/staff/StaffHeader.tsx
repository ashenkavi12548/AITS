import React from "react";
import {
  Users,
  Building2,
  ChevronDown,
  RefreshCw,
  UserPlus,
  MapPin,
} from "lucide-react";
import type { FarmFacility } from "@/services/farms.service";

interface StaffHeaderProps {
  allFarms: FarmFacility[];
  activeFarm: FarmFacility | null;
  isRefreshing: boolean;
  onFarmChange: (farmId: string) => void;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  staffCount: number;
}

export function StaffHeader({
  allFarms,
  activeFarm,
  isRefreshing,
  onFarmChange,
  onRefresh,
  onOpenAddModal,
  staffCount,
}: StaffHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Bar with Title, Facility Selector, Refresh & Add Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#10a37f]/15 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                Staff Management
              </h1>
              <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a0a0a0]">
                Manage farm workers, assign operational permissions, and
                delegate daily barn activities.
              </p>
            </div>
          </div>
        </div>

        {/* Farm Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {allFarms.length > 1 && (
            <div className="relative">
              <select
                aria-label="Select Farm Facility"
                value={activeFarm?.id || ""}
                onChange={(e) => onFarmChange(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-semibold text-[#0d0d0d] dark:text-white focus:outline-none focus:border-[#10a37f] shadow-xs cursor-pointer"
              >
                {allFarms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.registrationNumber})
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none" />
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none" />
            </div>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#1f1f1f] text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:border-[#10a37f] transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Staff List"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#10a37f]" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs shadow-[#10a37f]/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Facility Context Card Banner */}
      {activeFarm && (
        <div className="bg-linear-to-r from-emerald-500/5 via-teal-500/5 to-transparent bg-white dark:bg-[#202020] rounded-2xl border border-[#e5e5e5] dark:border-[#333] p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/20 text-[#10a37f] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-[#0d0d0d] dark:text-white">
                    {activeFarm.name}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#10a37f]/10 text-[#10a37f] font-semibold border border-[#10a37f]/20">
                    {activeFarm.registrationNumber}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                    {activeFarm.farmType}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#8e8e8e] mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {activeFarm.city}, {activeFarm.district} (
                    {activeFarm.province})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs shrink-0 self-start sm:self-center">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-400 text-[11px] block">
                  Registered Animals
                </span>
                <span className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                  {activeFarm._count?.animals ?? 0} head
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-400 text-[11px] block">
                  Staff Workforce
                </span>
                <span className="font-bold text-sm text-[#10a37f]">
                  {staffCount} members
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
