"use client";

import React from "react";
import { AlertCircle, RotateCw, BarChart2, Lock } from "lucide-react";

interface ReportChartCardProps {
  title: string;
  description?: string;
  periodLabel?: string;
  isLoading?: boolean;
  isError?: boolean;
  isAccessDenied?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const ReportChartCard: React.FC<ReportChartCardProps> = ({
  title,
  description,
  periodLabel = "Selected Date Range",
  isLoading,
  isError,
  isAccessDenied,
  errorMessage = "Failed to load chart data.",
  isEmpty,
  onRetry,
  children,
}) => {
  return (
    <div className="relative bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-lg rounded-[20px] p-5 lg:p-6 border border-[#cbd5e1] dark:border-[#525252] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col justify-between h-full transition-colors group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
              <BarChart2 className="w-4 h-4" strokeWidth={2.5} />
            </div>
            {title}
          </h3>
          {description && (
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {description}
            </p>
          )}
        </div>
        <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
          {periodLabel}
        </span>
      </div>

      {/* Body Content / States */}
      <div className="relative min-h-70 flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="w-full h-70 bg-slate-50/50 dark:bg-[#222]/30 animate-pulse rounded-2xl flex items-center justify-center text-[13px] font-medium text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
              Loading chart telemetry...
            </div>
          </div>
        ) : isAccessDenied ? (
          <div className="w-full h-70 rounded-2xl border border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-6 flex flex-col items-center justify-center text-center">
            <Lock className="w-10 h-10 text-amber-500 mb-3" />
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
              Restricted Access
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
              You do not have permission to view this chart.
            </p>
          </div>
        ) : isError ? (
          <div className="w-full h-70 rounded-2xl border border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-2">
              {errorMessage}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-[13px] font-bold hover:bg-rose-700 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                Retry Chart
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="w-full h-70 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-transparent">
            <BarChart2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No chart data recorded for current filters.
            </p>
          </div>
        ) : (
          <div className="w-full h-70 relative z-10">{children}</div>
        )}
      </div>
    </div>
  );
};
