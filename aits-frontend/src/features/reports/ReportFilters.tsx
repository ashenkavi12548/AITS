"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Filter,
  X,
  Calendar,
  Building2,
  SlidersHorizontal,
  ArrowLeftRight,
} from "lucide-react";
import {
  ReportFilters as IReportFilters,
  ReportTab,
} from "@/types/report.types";
import { reportService } from "@/services/report.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { validateDateRange } from "@/utils/report.utils";

interface ReportFiltersProps {
  activeTab: ReportTab;
  filters: IReportFilters;
  onFilterChange: (key: keyof IReportFilters, value: unknown) => void;
  onClearFilters: () => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  activeTab,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const { user } = useAuthStore();
  const role = (user?.role || "").toUpperCase();

  const [datePreset, setDatePreset] = useState<string>("This Week");

  // Fetch live filter options from database
  const { data: filtersMeta } = useQuery({
    queryKey: ["reports", "filters-meta"],
    queryFn: () => reportService.getFiltersMeta(),
    staleTime: 5 * 60 * 1000,
  });

  const allFarms = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string; name: string }> = [
      { id: "ALL", name: "All Assigned Farms" },
    ];
    seen.add("ALL");

    if (filtersMeta?.farms && filtersMeta.farms.length > 0) {
      filtersMeta.farms.forEach((f) => {
        if (f.id && !seen.has(f.id.toUpperCase())) {
          seen.add(f.id.toUpperCase());
          list.push(f);
        }
      });
    }
    return list;
  }, [filtersMeta]);

  // If user is a Farmer / Farm Manager, restrict available farms to assigned farm
  const availableFarms = useMemo(() => {
    if (role === "FARMER" && user?.primaryFarmId) {
      const primaryId = user.primaryFarmId;
      return allFarms.filter(
        (f) =>
          f.id === "ALL" ||
          f.id === primaryId ||
          f.name.toLowerCase().includes(primaryId.toLowerCase()),
      );
    }
    return allFarms;
  }, [user, role, allFarms]);

  const availableBreeds = useMemo(() => {
    const list = ["All Breeds"];
    if (filtersMeta?.breeds && filtersMeta.breeds.length > 0) {
      filtersMeta.breeds.forEach((b) => {
        if (!list.includes(b)) list.push(b);
      });
    }
    return list;
  }, [filtersMeta]);

  const availableStatuses = useMemo(() => {
    const list = ["All Statuses"];
    if (filtersMeta?.statuses && filtersMeta.statuses.length > 0) {
      filtersMeta.statuses.forEach((s) => {
        if (!list.includes(s)) list.push(s);
      });
    }
    return list;
  }, [filtersMeta]);

  const availableDiagnoses = useMemo(() => {
    const list = ["All Diagnoses"];
    if (filtersMeta?.diagnoses && filtersMeta.diagnoses.length > 0) {
      filtersMeta.diagnoses.forEach((s) => {
        if (!list.includes(s)) list.push(s);
      });
    }
    return list;
  }, [filtersMeta]);

  const availablePregnancyStatuses = useMemo(() => {
    const list = ["All Statuses"];
    if (
      filtersMeta?.pregnancyStatuses &&
      filtersMeta.pregnancyStatuses.length > 0
    ) {
      filtersMeta.pregnancyStatuses.forEach((s) => {
        if (!list.includes(s)) list.push(s);
      });
    }
    return list;
  }, [filtersMeta]);

  // Count active non-default filters
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.farmId !== "ALL") count++;
    if (filters.breed && filters.breed !== "All Breeds") count++;
    if (filters.gender && filters.gender !== "All") count++;
    if (filters.animalStatus && filters.animalStatus !== "All Statuses")
      count++;
    if (filters.reportStatus && filters.reportStatus !== "All") count++;
    if (filters.diagnosis && filters.diagnosis !== "All Diagnoses") count++;
    if (filters.pregnancyStatus && filters.pregnancyStatus !== "All Statuses")
      count++;
    if (filters.searchQuery && filters.searchQuery.trim() !== "") count++;
    return count;
  }, [filters]);

  const dateError = !validateDateRange(filters.startDate, filters.endDate);

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (preset) {
      case "Today":
        break;
      case "This Week": {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.setDate(diff));
        end = new Date();
        break;
      }
      case "Last 7 Days":
        start.setDate(now.getDate() - 7);
        break;
      case "Last 30 Days":
        start.setDate(now.getDate() - 30);
        break;
      case "This Month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "Last Month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "This Year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "Custom":
        return; // Don't change dates, just reveal custom inputs
    }

    if (preset !== "Custom") {
      onFilterChange("startDate", start.toISOString().slice(0, 10));
      onFilterChange("endDate", end.toISOString().slice(0, 10));
    }
  };

  return (
    <div className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-lg rounded-[20px] p-5 lg:p-6 border border-white/20 dark:border-[#333]/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] space-y-5 transition-all">
      {/* Top Header Row of Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <SlidersHorizontal className="w-4.5 h-4.5" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard Filters
          </span>
          {activeCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold shadow-sm">
              {activeCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Compare toggle */}
          <label className="flex items-center gap-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={filters.compareWithPrevious}
                onChange={(e) =>
                  onFilterChange("compareWithPrevious", e.target.checked)
                }
                className="peer sr-only"
              />
              <div className="w-10 h-5.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </div>
            <span className="flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Compare Period
            </span>
          </label>

          {/* Clear filters button */}
          {activeCount > 0 && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 text-[12px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold cursor-pointer bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-500/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={3} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Farm Select */}
        <div>
          <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Farm Location
          </label>
          <div className="relative">
            <select
              value={filters.farmId}
              onChange={(e) => onFilterChange("farmId", e.target.value)}
              className="w-full h-10 px-3.5 text-[13px] font-medium rounded-xl bg-slate-50/50 dark:bg-[#222]/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none transition-all hover:bg-slate-50 dark:hover:bg-[#2a2a2a]/50"
            >
              {availableFarms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Date Preset */}
        <div>
          <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Date Range
          </label>
          <div className="relative">
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="w-full h-10 px-3.5 text-[13px] font-medium rounded-xl bg-slate-50/50 dark:bg-[#222]/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none transition-all hover:bg-slate-50 dark:hover:bg-[#2a2a2a]/50"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Year">This Year</option>
              <option value="Custom">Custom Range...</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Custom Dates (Conditionally Rendered) */}
        {datePreset === "Custom" && (
          <>
            <div>
              <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  onFilterChange("startDate", e.target.value);
                }}
                className={`w-full h-10 px-3.5 text-[13px] font-medium rounded-xl bg-slate-50/50 dark:bg-[#222]/50 text-slate-900 dark:text-white border ${
                  dateError
                    ? "border-rose-500 focus:ring-rose-500/50"
                    : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                } focus:outline-none focus:ring-2 transition-all hover:bg-slate-50 dark:hover:bg-[#2a2a2a]/50`}
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> To Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  onFilterChange("endDate", e.target.value);
                }}
                className={`w-full h-10 px-3.5 text-[13px] font-medium rounded-xl bg-slate-50/50 dark:bg-[#222]/50 text-slate-900 dark:text-white border ${
                  dateError
                    ? "border-rose-500 focus:ring-rose-500/50"
                    : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                } focus:outline-none focus:ring-2 transition-all hover:bg-slate-50 dark:hover:bg-[#2a2a2a]/50`}
              />
            </div>
          </>
        )}

        {/* Breed Filter (Context Relevant) */}
        {(activeTab === "overview" ||
          activeTab === "production" ||
          activeTab === "breeding") && (
          <div>
            <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-500" /> Animal Breed
            </label>
            <div className="relative">
              <select
                value={filters.breed || "All Breeds"}
                onChange={(e) => onFilterChange("breed", e.target.value)}
                className="w-full h-10 px-3.5 text-[13px] font-medium rounded-xl bg-slate-50/50 dark:bg-[#222]/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none transition-all hover:bg-slate-50 dark:hover:bg-[#2a2a2a]/50"
              >
                {availableBreeds.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Animal Status Filter */}
        {(activeTab === "overview" ||
          activeTab === "health" ||
          activeTab === "traceability") && (
          <div>
            <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-500" /> Animal Status
            </label>
            <div className="relative">
              <select
                value={filters.animalStatus || "All Statuses"}
                onChange={(e) => onFilterChange("animalStatus", e.target.value)}
                className="w-full h-10 px-3.5 text-[13px] font-medium rounded-xl bg-slate-50/50 dark:bg-[#222]/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none transition-all hover:bg-slate-50 dark:hover:bg-[#2a2a2a]/50"
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        )}
        {/* Diagnosis Filter (Context Relevant) */}
        {activeTab === "health" && (
          <div>
            <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-500" /> Diagnosis
            </label>
            <div className="relative">
              <select
                value={filters.diagnosis || "All Diagnoses"}
                onChange={(e) => onFilterChange("diagnosis", e.target.value)}
                className="w-full h-10 px-3.5 text-[13px] font-medium rounded-xl bg-slate-50/50 dark:bg-[#222]/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none transition-all hover:bg-slate-50 dark:hover:bg-[#2a2a2a]/50"
              >
                {availableDiagnoses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Pregnancy Status Filter (Context Relevant) */}
        {activeTab === "breeding" && (
          <div>
            <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-500" /> Pregnancy
              Status
            </label>
            <div className="relative">
              <select
                value={filters.pregnancyStatus || "All Statuses"}
                onChange={(e) =>
                  onFilterChange("pregnancyStatus", e.target.value)
                }
                className="w-full h-10 px-3.5 text-[13px] font-medium rounded-xl bg-slate-50/50 dark:bg-[#222]/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none transition-all hover:bg-slate-50 dark:hover:bg-[#2a2a2a]/50"
              >
                {availablePregnancyStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {dateError && (
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 border border-rose-500/20">
          <X className="w-4 h-4" />
          Error: The From Date cannot be later than the To Date.
        </div>
      )}
    </div>
  );
};
