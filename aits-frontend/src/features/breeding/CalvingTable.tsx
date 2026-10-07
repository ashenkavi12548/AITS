"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Baby,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  CalvingRecord,
  CalvingQueryParams,
  CalvingStatus,
} from "@/types/breeding";
import AnimalPhoto from "@/components/common/AnimalPhoto";

interface CalvingTableProps {
  records: CalvingRecord[];
  params: CalvingQueryParams;
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (key: keyof CalvingQueryParams, value: unknown) => void;
  onClearFilters: () => void;
  onRecordCalving: (record?: CalvingRecord) => void;
  onRetry: () => void;
}

export const CalvingTable: React.FC<CalvingTableProps> = ({
  records,
  params,
  totalCount,
  totalPages,
  isLoading,
  isError,
  canManage: _canManage,
  onPageChange,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onRecordCalving: _onRecordCalving,
  onRetry,
}) => {
  const hasActiveFilters =
    Boolean(params.search) ||
    Boolean(params.farmId) ||
    Boolean(params.calvingStatus);

  const renderStatusBadge = (status: CalvingStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case "EXPECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            <Clock className="w-3 h-3" /> Expected
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        );
      case "COMPLICATED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Complicated
          </span>
        );
      case "ABORTED":
      case "STILLBIRTH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <XCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & Filters */}
      <div className="bg-white dark:bg-[#2f2f2f] p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs space-y-3 transition-colors duration-150">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
            <input
              type="text"
              value={params.search || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by mother tag, name, or staff member..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-[#e5e5e5] dark:border-[#383838]">
          <div>
            <label className="block text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
              Calving Status
            </label>
            <select
              value={params.calvingStatus || ""}
              onChange={(e) =>
                onFilterChange(
                  "calvingStatus",
                  e.target.value as CalvingStatus | "",
                )
              }
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="EXPECTED">Expected</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="COMPLICATED">Complicated</option>
              <option value="ABORTED">Aborted / Stillbirth</option>
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
              Failed to load calving records
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
            <Baby className="w-10 h-10 text-[#10a37f] mb-2" />
            <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
              No calving records found
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1 max-w-xs">
              No calving records match your search parameters.
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
                      Mother Animal
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Farm</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Expected Date
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Actual Date
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Calving Status
                    </th>
                    <th className="py-2 px-2.5 text-center whitespace-nowrap">
                      Calves
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Assistance
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Recorded By
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
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <AnimalPhoto 
                            src={r.imageUrl} 
                            animalNumber={r.motherAnimalTag} 
                            species={r.species || undefined} 
                            showBadge={false} 
                            className="w-8 h-8 rounded-lg border border-[#e5e5e5] dark:border-[#444] shrink-0" 
                          />
                          <div>
                            <span className="font-mono font-bold text-[#166534] dark:text-[#22C55E] mr-1.5">{r.motherAnimalTag}</span>
                            <span className="font-semibold text-[#0d0d0d] dark:text-white">({r.motherAnimalName})</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] max-w-35 truncate">
                        {r.farmName}
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
                        {r.expectedCalvingDate}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                        {r.actualCalvingDate || "Pending"}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {renderStatusBadge(r.calvingStatus)}
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold">
                        {r.numberOfCalves}
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
                        {r.assistanceRequired ? "Vet Assisted" : "Unassisted"}
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] truncate max-w-32.5">
                        {r.recordedBy}
                      </td>
                      <td className="py-2 px-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.calvingStatus === "COMPLETED" && (
                            <Link
                              href="/animals/register"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#166534] text-white hover:bg-[#14532d] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Register Calf
                            </Link>
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
                        animalNumber={r.motherAnimalTag} 
                        species={r.species || undefined} 
                        showBadge={false} 
                        className="w-10 h-10 rounded-lg border border-[#e5e5e5] dark:border-[#444] shrink-0" 
                      />
                      <div>
                        <span className="font-mono font-bold text-[11px] text-[#166534] dark:text-[#22C55E]">{r.motherAnimalTag}</span>
                        <h4 className="text-xs font-bold text-[#0d0d0d] dark:text-white">{r.motherAnimalName}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderStatusBadge(r.calvingStatus)}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] grid grid-cols-2 gap-1 bg-[#f8faf8] dark:bg-[#212121] p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
                    <div>
                      <span className="font-semibold text-[#0d0d0d] dark:text-white">
                        Expected:
                      </span>{" "}
                      {r.expectedCalvingDate}
                    </div>
                    <div>
                      <span className="font-semibold text-[#0d0d0d] dark:text-white">
                        Actual:
                      </span>{" "}
                      {r.actualCalvingDate || "Pending"}
                    </div>
                  </div>

                  {r.calvingStatus === "COMPLETED" && (
                    <div className="pt-1 flex justify-end">
                      <Link
                        href="/animals/register"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#166534] text-white hover:bg-[#14532d] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Register Calf
                      </Link>
                    </div>
                  )}
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
                calving records
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
