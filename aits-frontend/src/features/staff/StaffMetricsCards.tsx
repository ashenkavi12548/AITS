import React from "react";
import { Users, UserCheck, Shield, Milk } from "lucide-react";

interface StaffMetricsCardsProps {
  metrics: {
    total: number;
    active: number;
    managersAndVets: number;
    workers: number;
    activePct: number;
  };
}

export function StaffMetricsCards({ metrics }: StaffMetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Personnel */}
      <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
            Total Staff
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[#0d0d0d] dark:text-white">
          {metrics.total}
        </div>
        <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5 block">
          Enrolled workforce
        </span>
      </div>

      {/* 2. Active Operators */}
      <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
            Active Operators
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.active}
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded">
            {metrics.activePct}% Active
          </span>
        </div>
        <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5 block">
          Authorized to operate
        </span>
      </div>

      {/* 3. Supervisors & Vets */}
      <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
            Supervisors & Vets
          </span>
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[#0d0d0d] dark:text-white">
          {metrics.managersAndVets}
        </div>
        <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5 block">
          Managers & clinical leads
        </span>
      </div>

      {/* 4. Field Crew */}
      <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
            Field Crew
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Milk className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[#0d0d0d] dark:text-white">
          {metrics.workers}
        </div>
        <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5 block">
          Milking & feeding workers
        </span>
      </div>
    </div>
  );
}
