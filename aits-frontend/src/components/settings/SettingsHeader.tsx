"use client";

import React from "react";
import { Search, SlidersHorizontal, X, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getRoleDisplayConfig } from "@/utils/role.utils";
export default function SettingsHeader() {
  const { user } = useAuthStore();
  const { searchQuery, setSearchQuery } = useSettingsStore();

  const activeRoleConfig = getRoleDisplayConfig(user?.farmRole || user?.role);

  return (
    <div className="space-y-4 pb-2 border-b border-[#e5e5e5] dark:border-[#303030]">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#8e8e8e]">
          <span>AITS Portal</span>
          <span>/</span>
          <span className="font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#10a37f]" />
            Settings
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active status pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Account
          </span>

          {/* User role pill */}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
            {activeRoleConfig.label}
          </span>
        </div>
      </div>

      {/* Main Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
            Account & Farm Settings
          </h1>
          <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1 max-w-2xl">
            Update your personal contact details, manage your registered farm
            facility, change your password, and customize your alert
            notifications.
          </p>
        </div>

        {/* Quick Filter Search Bar */}
        <div className="relative min-w-60 max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings (e.g. password, farm)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white placeholder-[#737373] dark:placeholder-[#8e8e8e] focus:outline-none focus:ring-2 focus:ring-[#10a37f] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white p-0.5 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
