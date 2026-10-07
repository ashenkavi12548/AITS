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
  Milk,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
} from "lucide-react";
import {
  ProductionRecord,
  ProductionQueryParams,
  MilkQualityStatus,
} from "@/types/production";
import AnimalPhoto from "@/components/common/AnimalPhoto";

interface ProductionTableProps {
  records: ProductionRecord[];
  params: ProductionQueryParams;
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  canManage: boolean;
  canDeletePermanently?: boolean;
  onSort: (column: ProductionQueryParams["sortBy"]) => void;
  onPageChange: (page: number) => void;
  onViewDetails: (record: ProductionRecord) => void;
  onEditRecord: (record: ProductionRecord) => void;
  onDeleteRecord: (record: ProductionRecord) => void;
  onDeletePermanentlyRecord?: (record: ProductionRecord) => void;
  onRetry: () => void;
}

export const ProductionTable: React.FC<ProductionTableProps> = ({
  records,
  params,
  totalCount,
  totalPages,
  isLoading,
  isError,
  errorMessage,
  canManage,
  canDeletePermanently = false,
  onSort,
  onPageChange,
  onViewDetails,
  onEditRecord,
  onDeleteRecord,
  onDeletePermanentlyRecord,
  onRetry,
}) => {
  // Quality status badge component (compact)
  const renderQualityBadge = (status: MilkQualityStatus) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending Test
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs overflow-hidden">
        <div className="p-4 space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-2 border-b border-[#e5e5e5]/50 dark:border-[#383838]/50 last:border-0"
            >
              <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-20" />
              <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-24" />
              <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-28 hidden md:block" />
              <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-14" />
              <div className="h-5 bg-[#f0f0f0] dark:bg-[#383838] rounded-full w-18" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white dark:bg-[#2f2f2f] p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-9 h-9 text-rose-500 mb-2" />
        <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white">
          Failed to load milk records
        </h3>
        <p className="text-[11.5px] text-[#737373] dark:text-[#8e8e8e] mt-1 max-w-md">
          {errorMessage ||
            "An error occurred while fetching production records."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#10a37f] text-white font-semibold text-xs hover:bg-[#0e8c6d] transition-colors cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // Empty state
  if (!records || records.length === 0) {
    return (
      <div className="bg-white dark:bg-[#2f2f2f] p-8 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#166534]/10 text-[#166534] dark:text-[#22C55E] flex items-center justify-center mb-2.5">
          <Milk className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
          No milk production records found
        </h3>
        <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1 max-w-xs">
          No records matched your search query or filter parameters. Try
          clearing filters or logging a new milking session.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs overflow-hidden transition-colors duration-150">
      {/* Compact Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8faf8] dark:bg-[#252525] text-[#737373] dark:text-[#8e8e8e] uppercase tracking-wider font-bold text-[11px] border-b border-[#e5e5e5] dark:border-[#383838]">
            <tr>
              <th
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors whitespace-nowrap"
                onClick={() => onSort("date")}
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                </div>
              </th>
              <th
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors whitespace-nowrap"
                onClick={() => onSort("animalTag")}
              >
                <div className="flex items-center gap-1">
                  <span>Animal / Identifier</span>
                  <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                </div>
              </th>
              <th
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors whitespace-nowrap"
                onClick={() => onSort("farmName")}
              >
                <div className="flex items-center gap-1">
                  <span>Farm Facility</span>
                  <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                </div>
              </th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Session</th>
              <th
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors text-right whitespace-nowrap"
                onClick={() => onSort("quantityLiters")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Quantity (L)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                </div>
              </th>
              <th
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#0d0d0d] dark:hover:text-white transition-colors whitespace-nowrap"
                onClick={() => onSort("qualityStatus")}
              >
                <div className="flex items-center gap-1">
                  <span>Quality</span>
                  <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                </div>
              </th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Recorded By</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]/70 dark:divide-[#383838]/70 text-[#0d0d0d] dark:text-[#e5e5e5] text-[11.5px]">
            {records.map((r) => (
              <tr
                key={r.id}
                className={`transition-colors ${
                  r.isVoided
                    ? "bg-rose-500/5 dark:bg-rose-950/15 opacity-80"
                    : "hover:bg-[#f8faf8] dark:hover:bg-[#262626]"
                }`}
              >
                <td className="py-2.5 px-3.5 font-medium whitespace-nowrap text-[#737373] dark:text-[#a3a3a3]">
                  {r.date}
                </td>
                <td className="py-2.5 px-3.5 font-mono font-bold text-[#166534] dark:text-[#22C55E] whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <AnimalPhoto 
                      src={r.imageUrl} 
                      animalNumber={r.animalTag} 
                      species={r.species || undefined} 
                      showBadge={false} 
                      className="w-8 h-8 rounded-lg border border-[#e5e5e5] dark:border-[#444] shrink-0" 
                    />
                    <div>
                      <div>{r.animalTag}</div>
                      <div className="text-[10px] font-semibold text-[#0d0d0d] dark:text-white font-sans">
                        {r.animalName !== r.animalTag ? r.animalName : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3.5 text-[#737373] dark:text-[#a3a3a3] max-w-37.5 truncate">
                  {r.farmName}
                </td>
                <td className="py-2.5 px-3.5 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#737373] dark:text-[#a3a3a3]">
                    {r.session === "MORNING" ? (
                      <Sun className="w-3 h-3 text-amber-500" />
                    ) : r.session === "AFTERNOON" ? (
                      <Sun className="w-3 h-3 text-orange-500" />
                    ) : (
                      <Moon className="w-3 h-3 text-sky-500" />
                    )}
                    {r.session === "MORNING"
                      ? "Morning"
                      : r.session === "AFTERNOON"
                        ? "Afternoon"
                        : "Evening"}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 font-bold text-right text-[12px] tabular-nums whitespace-nowrap text-[#0d0d0d] dark:text-white">
                  {r.isVoided ? (
                    <span className="line-through text-[#737373] dark:text-[#8e8e8e]" title="Voided record yield">
                      {r.quantityLiters} L
                    </span>
                  ) : (
                    <span>{r.quantityLiters} L</span>
                  )}
                </td>
                <td className="py-2.5 px-3.5 whitespace-nowrap">
                  {r.isVoided ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                      title={r.voidReason ? `Reason: ${r.voidReason}` : "Record voided"}
                    >
                      <Ban className="w-3 h-3" />
                      Voided
                    </span>
                  ) : (
                    renderQualityBadge(r.qualityStatus)
                  )}
                </td>
                <td className="py-2.5 px-3.5 text-[#737373] dark:text-[#a3a3a3] text-[11px] whitespace-nowrap truncate max-w-35">
                  {r.recordedBy}
                </td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
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
                        {r.isVoided ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10">
                            Voided
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditRecord(r)}
                              className="p-1 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                              title="Edit record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(r)}
                              className="p-1 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-500 dark:hover:text-amber-400 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                              title="Void record"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            {canDeletePermanently && onDeletePermanentlyRecord && (
                              <button
                                type="button"
                                onClick={() => onDeletePermanentlyRecord(r)}
                                className="p-1 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Card View */}
      <div className="lg:hidden p-3.5 divide-y divide-[#e5e5e5] dark:divide-[#383838] space-y-3">
        {records.map((r) => (
          <div key={r.id} className={`pt-3 first:pt-0 space-y-2 ${r.isVoided ? "opacity-80" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AnimalPhoto 
                  src={r.imageUrl} 
                  animalNumber={r.animalTag} 
                  species={r.species || undefined} 
                  showBadge={false} 
                  className="w-10 h-10 rounded-lg border border-[#e5e5e5] dark:border-[#444] shrink-0" 
                />
                <div>
                  <span className="font-mono font-bold text-[11px] text-[#166534] dark:text-[#22C55E]">{r.animalTag}</span>
                  <h4 className="text-xs font-bold text-[#0d0d0d] dark:text-white">{r.animalName}</h4>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-extrabold ${r.isVoided ? "line-through text-[#737373]" : "text-[#0d0d0d] dark:text-white"}`}>
                  {r.quantityLiters} L
                </span>
                <div className="mt-0.5">
                  {r.isVoided ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                      <Ban className="w-3 h-3" />
                      Voided
                    </span>
                  ) : (
                    renderQualityBadge(r.qualityStatus)
                  )}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] grid grid-cols-2 gap-1 bg-[#f8faf8] dark:bg-[#212121] p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
              <div>
                <span className="font-semibold text-[#0d0d0d] dark:text-white">
                  Date:
                </span>{" "}
                {r.date}
              </div>
              <div>
                <span className="font-semibold text-[#0d0d0d] dark:text-white">
                  Session:
                </span>{" "}
                {r.session}
              </div>
              <div className="col-span-2 truncate">
                <span className="font-semibold text-[#0d0d0d] dark:text-white">
                  Farm:
                </span>{" "}
                {r.farmName}
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10.5px] text-[#737373] dark:text-[#8e8e8e] truncate max-w-xs">
                By: {r.recordedBy}
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
                    {r.isVoided ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded-lg">
                        Voided
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditRecord(r)}
                          className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(r)}
                          className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                          Void
                        </button>
                        {canDeletePermanently && onDeletePermanentlyRecord && (
                          <button
                            type="button"
                            onClick={() => onDeletePermanentlyRecord(r)}
                            className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compact Pagination Controls Footer */}
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
          milk records
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
    </div>
  );
};
