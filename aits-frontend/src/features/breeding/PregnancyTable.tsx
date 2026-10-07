"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  PregnancyCheck,
  PregnancyQueryParams,
  PregnancyStatus,
  PregnancyCheckType,
} from "@/types/breeding";
import AnimalPhoto from "@/components/common/AnimalPhoto";

interface PregnancyTableProps {
  records: PregnancyCheck[];
  params: PregnancyQueryParams;
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (key: keyof PregnancyQueryParams, value: unknown) => void;
  onClearFilters: () => void;
  onRecordCheck: (record?: PregnancyCheck) => void;
  onRetry: () => void;
}

export const PregnancyTable: React.FC<PregnancyTableProps> = ({
  records,
  params,
  totalCount,
  totalPages,
  isLoading,
  isError,
  canManage,
  onPageChange,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onRecordCheck,
  onRetry,
}) => {
  const hasActiveFilters =
    Boolean(params.search) ||
    Boolean(params.farmId) ||
    Boolean(params.checkType) ||
    Boolean(params.pregnancyStatus);

  const renderStatusBadge = (status: PregnancyStatus) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case "NOT_CHECKED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            <Clock className="w-3 h-3" /> Not Checked
          </span>
        );
      case "RECHECK_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3 h-3" /> Recheck Required
          </span>
        );
      case "NOT_PREGNANT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Not Pregnant (Open)
          </span>
        );
      case "PREGNANCY_LOST":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <XCircle className="w-3 h-3" /> Pregnancy Lost
          </span>
        );
      default:
        return null;
    }
  };

  const renderCheckTypeBadge = (type: PregnancyCheckType) => {
    switch (type) {
      case "60_DAY_CHECK":
        return (
          <span className="text-[11px] font-semibold text-[#10a37f]">
            60-Day PD
          </span>
        );
      case "90_DAY_CHECK":
        return (
          <span className="text-[11px] font-semibold text-[#0ea5e9]">
            90-Day PD
          </span>
        );
      case "ADDITIONAL_CHECK":
        return (
          <span className="text-[11px] font-semibold text-[#8b5cf6]">
            Additional PD
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Header Bar */}
      <div className="bg-white dark:bg-[#2f2f2f] p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs space-y-3 transition-colors duration-150">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
            <input
              type="text"
              value={params.search || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by animal tag, name, or veterinarian..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
            />
            {params.search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors cursor-pointer shrink-0 border border-rose-200 dark:border-rose-900/40"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-[#e5e5e5] dark:border-[#383838]">
          <div>
            <label className="block text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
              Check Type
            </label>
            <select
              value={params.checkType || ""}
              onChange={(e) =>
                onFilterChange(
                  "checkType",
                  e.target.value as PregnancyCheckType | "",
                )
              }
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
            >
              <option value="">All Check Types</option>
              <option value="60_DAY_CHECK">60-Day Check</option>
              <option value="90_DAY_CHECK">90-Day Check</option>
              <option value="ADDITIONAL_CHECK">Additional Check</option>
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
              Pregnancy Status
            </label>
            <select
              value={params.pregnancyStatus || ""}
              onChange={(e) =>
                onFilterChange(
                  "pregnancyStatus",
                  e.target.value as PregnancyStatus | "",
                )
              }
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed Pregnant</option>
              <option value="RECHECK_REQUIRED">Recheck Required</option>
              <option value="NOT_PREGNANT">Not Pregnant (Open)</option>
              <option value="NOT_CHECKED">Not Checked</option>
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
              Farm Facility
            </label>
            <select
              value={params.farmId || ""}
              onChange={(e) => onFilterChange("farmId", e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
            >
              <option value="">All Farms</option>
              <option value="farm-001">Green Valley Dairy Farm</option>
              <option value="farm-002">Highland Livestock Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs overflow-hidden transition-colors duration-150">
        {isLoading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-2 border-b border-[#e5e5e5]/50 dark:border-[#383838]/50 last:border-0"
              >
                <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-24" />
                <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-28" />
                <div className="h-5 bg-[#f0f0f0] dark:bg-[#383838] rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-9 h-9 text-rose-500 mb-2" />
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white">
              Failed to load pregnancy records
            </h3>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#10a37f] text-white font-semibold text-xs hover:bg-[#0e8c6d] transition-colors cursor-pointer"
            >
              Retry Load
            </button>
          </div>
        ) : !records || records.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <CalendarCheck className="w-10 h-10 text-[#10a37f] mb-2" />
            <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
              No pregnancy checks found
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1 max-w-xs">
              No records matched your search parameters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f8faf8] dark:bg-[#252525] text-[#737373] dark:text-[#8e8e8e] uppercase tracking-wider font-bold text-[10.5px] border-b border-[#e5e5e5] dark:border-[#383838]">
                  <tr>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Female / Identifier
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Farm</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Service Date
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Check Type
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Check Date
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">PD Status</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Est. Calving Date
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Vet / Technician
                    </th>
                    <th className="py-2 px-2.5 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]/70 dark:divide-[#383838]/70 text-[#0d0d0d] dark:text-[#e5e5e5] text-[11px]">
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[#f8faf8] dark:hover:bg-[#262626] transition-colors"
                    >
                      <td className="py-2 px-2.5 font-mono font-bold text-[#166534] dark:text-[#22C55E] whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <AnimalPhoto 
                            src={r.imageUrl} 
                            animalNumber={r.femaleAnimalTag} 
                            species={r.species || undefined} 
                            showBadge={false} 
                            className="w-8 h-8 rounded-lg border border-[#e5e5e5] dark:border-[#444] shrink-0" 
                          />
                          <div>
                            <div>{r.femaleAnimalTag}</div>
                            <div className="text-[10px] font-semibold text-[#0d0d0d] dark:text-white font-sans">
                              {r.femaleAnimalName !== r.femaleAnimalTag ? r.femaleAnimalName : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] max-w-35 truncate">
                        {r.farmName}
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
                        {r.lastServiceDate}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {renderCheckTypeBadge(r.checkType)}
                      </td>
                      <td className="py-2 px-2.5 font-medium whitespace-nowrap">
                        {r.checkDate}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {renderStatusBadge(r.pregnancyStatus)}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-[#166534] dark:text-[#22C55E] whitespace-nowrap">
                        {r.estimatedCalvingDate}
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] truncate max-w-32.5">
                        {r.technicianOrVet}
                      </td>
                      <td className="py-2 px-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onRecordCheck(r)}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                            >
                              Update PD
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-3.5 divide-y divide-[#e5e5e5] dark:divide-[#383838] space-y-3">
              {records.map((r) => (
                <div key={r.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <AnimalPhoto 
                        src={r.imageUrl} 
                        animalNumber={r.femaleAnimalTag} 
                        species={r.species || undefined} 
                        showBadge={false} 
                        className="w-10 h-10 rounded-lg border border-[#e5e5e5] dark:border-[#444] shrink-0" 
                      />
                      <div>
                        <span className="font-mono font-bold text-[11px] text-[#166534] dark:text-[#22C55E]">{r.femaleAnimalTag}</span>
                        <h4 className="text-xs font-bold text-[#0d0d0d] dark:text-white">{r.femaleAnimalName}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderStatusBadge(r.pregnancyStatus)}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] grid grid-cols-2 gap-1 bg-[#f8faf8] dark:bg-[#212121] p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
                    <div>
                      <span className="font-semibold text-[#0d0d0d] dark:text-white">
                        Check Date:
                      </span>{" "}
                      {r.checkDate}
                    </div>
                    <div>
                      <span className="font-semibold text-[#0d0d0d] dark:text-white">
                        Est. Calving:
                      </span>{" "}
                      {r.estimatedCalvingDate}
                    </div>
                    <div className="col-span-2 truncate">
                      <span className="font-semibold text-[#0d0d0d] dark:text-white">
                        Vet/Tech:
                      </span>{" "}
                      {r.technicianOrVet}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-2.5 bg-[#f8faf8] dark:bg-[#252525] border-t border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between text-[11.5px]">
              <span className="text-[#737373] dark:text-[#8e8e8e]">
                Showing{" "}
                <strong className="font-semibold text-[#0d0d0d] dark:text-white">
                  {records.length}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-[#0d0d0d] dark:text-white">
                  {totalCount}
                </strong>{" "}
                pregnancy records
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPageChange(params.page! - 1)}
                  disabled={params.page === 1}
                  className="p-1 rounded-lg border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#383838] disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-semibold">
                  Page {params.page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => onPageChange(params.page! + 1)}
                  disabled={params.page === totalPages}
                  className="p-1 rounded-lg border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#383838] disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
