"use client";

import React from "react";
import {
  RotateCw,
  Clock,
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  SlidersHorizontal,
  Eye,
  Loader2,
} from "lucide-react";
import { ReportTab } from "@/types/report.types";

interface ReportsHeaderProps {
  title?: string;
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenDownloadModal: () => void;
  activeTab?: ReportTab;
  onQuickExport?: (tab: ReportTab, format: "PDF" | "CSV") => void;
  onQuickPreview?: (tab: ReportTab) => void;
  isExporting?: boolean;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  title = "Dashboard",
  lastUpdated,
  isRefreshing,
  onRefresh,
  onOpenDownloadModal,
  activeTab = "overview",
  onQuickExport,
  onQuickPreview,
  isExporting = false,
}) => {

  return (
    <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-[#10a37f]/20">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
            {title}
          </h1>
          <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
            Live operational analytics, livestock health tracking, and compliance reporting.
          </p>
        </div>
      </div>

      {/* Actions & Metadata */}
      {/* Actions & Metadata */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4f4f4] dark:bg-[#383838] border border-[#e5e5e5] dark:border-[#4d4d4d] text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] font-medium shadow-sm">
          <Clock className="w-3.5 h-3.5 text-[#10a37f]" />
          <span>
            Updated:{" "}
            <strong className="font-bold text-[#0d0d0d] dark:text-white">
              {lastUpdated}
            </strong>
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh analytics data"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#10a37f]" : ""}`} />
        </button>

        {onQuickPreview && (
          <button
            type="button"
            onClick={() => onQuickPreview(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 border border-sky-100 dark:border-sky-500/20 transition-all cursor-pointer shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden xl:inline">Preview</span>
          </button>
        )}

        {onQuickExport && (
          <button
            type="button"
            onClick={() => onQuickExport(activeTab, "PDF")}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span className="hidden xl:inline">PDF</span>
          </button>
        )}

        {onQuickExport && (
          <button
            type="button"
            onClick={() => onQuickExport(activeTab, "CSV")}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-[#10a37f]/10 text-[#10a37f] hover:bg-[#10a37f]/20 border border-[#10a37f]/20 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            <span className="hidden xl:inline">CSV</span>
          </button>
        )}

        <button
          onClick={onOpenDownloadModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Custom Export</span>
        </button>
      </div>
    </div>
  );
};
