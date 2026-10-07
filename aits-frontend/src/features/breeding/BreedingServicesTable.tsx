"use client";

import React from "react";
import {
  Eye,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
  Dna,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarCheck,
  Search,
  X,
} from "lucide-react";
import {
  BreedingRecord,
  BreedingQueryParams,
  BreedingStatus,
  BreedingMethod,
} from "@/types/breeding";
import AnimalPhoto from "@/components/common/AnimalPhoto";

interface BreedingServicesTableProps {
  records: BreedingRecord[];
  params: BreedingQueryParams;
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onSort: (column: BreedingQueryParams["sortBy"]) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (key: keyof BreedingQueryParams, value: unknown) => void;
  onClearFilters: () => void;
  onViewDetails: (record: BreedingRecord) => void;
  onEditRecord: (record: BreedingRecord) => void;
  onDeleteRecord: (record: BreedingRecord) => void;
  onRecordPregnancyCheck: (record: BreedingRecord) => void;
  onRetry: () => void;
}

export const BreedingServicesTable: React.FC<BreedingServicesTableProps> = ({
  records,
  params,
  totalCount,
  totalPages,
  isLoading,
  isError,
  canManage,
  onSort,
  onPageChange,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onViewDetails,
  onEditRecord,
  onDeleteRecord,
  onRecordPregnancyCheck,
  onRetry,
}) => {
  const hasActiveFilters =
    Boolean(params.search) ||
    Boolean(params.farmId) ||
    Boolean(params.method) ||
    Boolean(params.status) ||
    Boolean(params.startDate) ||
    Boolean(params.endDate);

  const renderStatusBadge = (status: BreedingStatus) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#10a37f]/10 text-[#0e8c6d] dark:text-[#12b88f] border border-[#10a37f]/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case "PREGNANCY_CHECK_PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <CalendarCheck className="w-3 h-3" /> PD Pending
          </span>
        );
      case "SUCCESSFUL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3 h-3" /> Successful (Pregnant)
          </span>
        );
      case "UNSUCCESSFUL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Unsuccessful (Open)
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border border-zinc-500/20">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const renderMethodBadge = (method: BreedingMethod) => {
    if (method === "ARTIFICIAL_INSEMINATION") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
          <Dna className="w-3 h-3" /> AI Insemination
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
        Natural Paddock
      </span>
    );
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
              placeholder="Search by animal tag, name, technician, or sire details..."
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

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-[#e5e5e5] dark:border-[#383838]">
          <div>
            <label className="block text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
              Breeding Method
            </label>
            <select
              value={params.method || ""}
              onChange={(e) =>
                onFilterChange("method", e.target.value as BreedingMethod | "")
              }
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
            >
              <option value="">All Methods</option>
              <option value="ARTIFICIAL_INSEMINATION">
                Artificial Insemination (AI)
              </option>
              <option value="NATURAL">Natural Paddock Breeding</option>
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
              Breeding Status
            </label>
            <select
              value={params.status || ""}
              onChange={(e) =>
                onFilterChange("status", e.target.value as BreedingStatus | "")
              }
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="PREGNANCY_CHECK_PENDING">PD Pending</option>
              <option value="SUCCESSFUL">Successful (Pregnant)</option>
              <option value="UNSUCCESSFUL">Unsuccessful (Open)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
              From Date
            </label>
            <input
              type="date"
              value={params.startDate || ""}
              onChange={(e) => onFilterChange("startDate", e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
              To Date
            </label>
            <input
              type="date"
              value={params.endDate || ""}
              onChange={(e) => onFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs overflow-hidden transition-colors duration-150">
        {isLoading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-2 border-b border-[#e5e5e5]/50 dark:border-[#383838]/50 last:border-0"
              >
                <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-20" />
                <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-24" />
                <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-28 hidden md:block" />
                <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-14" />
                <div className="h-5 bg-[#f0f0f0] dark:bg-[#383838] rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-9 h-9 text-rose-500 mb-2" />
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white">
              Failed to load breeding records
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
            <Dna className="w-10 h-10 text-[#10a37f] mb-2" />
            <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
              No breeding records found
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1 max-w-xs">
              No service logs matched your search or filter options.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="bg-[#f8faf8] dark:bg-[#252525] text-[#737373] dark:text-[#8e8e8e] uppercase tracking-wider font-bold text-[10.5px] border-b border-[#e5e5e5] dark:border-[#383838]">
                  <tr>
                    <th
                      className="py-2 px-2.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors"
                      onClick={() => onSort("serviceDate")}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                      </div>
                    </th>
                    <th
                      className="py-2 px-2.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors"
                      onClick={() => onSort("femaleAnimalTag")}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>Female / Identifier</span>
                        <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                      </div>
                    </th>
                    <th
                      className="py-2 px-2.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors"
                      onClick={() => onSort("farmName")}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>Farm</span>
                        <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                      </div>
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Method</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Sire / Straw
                    </th>
                    <th
                      className="py-2 px-2.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors text-center"
                      onClick={() => onSort("attemptNumber")}
                    >
                      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                        <span>Attempt</span>
                        <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                      </div>
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      Technician
                    </th>
                    <th className="py-2 px-2.5 whitespace-nowrap">
                      60-Day PD Due
                    </th>
                    <th
                      className="py-2 px-2.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors"
                      onClick={() => onSort("status")}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                      </div>
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
                      <td className="py-2 px-2.5 font-medium whitespace-nowrap text-[#737373] dark:text-[#a3a3a3]">
                        {r.serviceDate}
                      </td>
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
                              {r.femaleAnimalName !== r.femaleAnimalTag
                                ? r.femaleAnimalName
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] max-w-32.5 truncate">
                        {r.farmName}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {renderMethodBadge(r.serviceMethod)}
                      </td>
                      <td className="py-2 px-2.5 font-semibold text-[#0d0d0d] dark:text-white max-w-35 truncate">
                        {r.bullName || r.semenStrawId || "N/A"}
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold">
                        {r.attemptNumber}
                      </td>
                      <td className="py-2 px-2.5 text-[#737373] dark:text-[#a3a3a3] truncate max-w-30">
                        {r.technician}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap text-[#737373] dark:text-[#a3a3a3]">
                        {r.firstPregnancyCheckDate}
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {renderStatusBadge(r.status)}
                      </td>
                      <td className="py-2 px-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onViewDetails(r)}
                            className="p-1 rounded-md text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#383838] transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => onRecordPregnancyCheck(r)}
                                className="p-1 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                                title="Record Pregnancy Check"
                              >
                                <CalendarCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditRecord(r)}
                                className="p-1 rounded-md text-[#10a37f] hover:bg-[#10a37f]/10 transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRecord(r)}
                                className="p-1 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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
                        <span className="font-mono font-bold text-[11px] text-[#166534] dark:text-[#22C55E]">
                          {r.femaleAnimalTag}
                        </span>
                        <h4 className="text-xs font-bold text-[#0d0d0d] dark:text-white">
                          {r.femaleAnimalName}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderStatusBadge(r.status)}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] grid grid-cols-2 gap-1 bg-[#f8faf8] dark:bg-[#212121] p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
                    <div>
                      <span className="font-semibold text-[#0d0d0d] dark:text-white">
                        Date:
                      </span>{" "}
                      {r.serviceDate}
                    </div>
                    <div>
                      <span className="font-semibold text-[#0d0d0d] dark:text-white">
                        Attempt:
                      </span>{" "}
                      #{r.attemptNumber}
                    </div>
                    <div className="col-span-2 truncate">
                      <span className="font-semibold text-[#0d0d0d] dark:text-white">
                        Sire/Straw:
                      </span>{" "}
                      {r.bullName || r.semenStrawId}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10.5px] text-[#737373] dark:text-[#8e8e8e] truncate max-w-xs">
                      Tech: {r.technician}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewDetails(r)}
                        className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-[#f0f0f0] dark:bg-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#e5e5e5] transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditRecord(r)}
                            className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-[#10a37f]/10 text-[#10a37f] hover:bg-[#10a37f]/20 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(r)}
                            className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls Footer */}
            <div className="px-4 py-2.5 bg-[#f8faf8] dark:bg-[#252525] border-t border-[#e5e5e5] dark:border-[#383838] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11.5px]">
              <span className="text-[#737373] dark:text-[#8e8e8e]">
                Showing{" "}
                <strong className="font-semibold text-[#0d0d0d] dark:text-white">
                  {records.length}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-[#0d0d0d] dark:text-white">
                  {totalCount}
                </strong>{" "}
                breeding service logs
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

                <span className="px-2.5 py-0.5 font-semibold text-[#0d0d0d] dark:text-white">
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
