'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface DashboardKpiCardProps {
  label: string;
  value?: number | string;
  unit?: string;
  icon: LucideIcon;
  accentColor: string; // Hex color code
  trend?: {
    value: string;
    isPositive: boolean;
  };
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export default function DashboardKpiCard({
  label,
  value,
  unit,
  icon: Icon,
  accentColor,
  trend,
  isLoading,
  isError,
  onRetry,
}: DashboardKpiCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#2f2f2f] p-5 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-32 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-[#f0f0f0] dark:bg-[#383838] rounded-md" />
          <div className="h-8 w-8 bg-[#f0f0f0] dark:bg-[#383838] rounded-lg" />
        </div>
        <div className="h-7 w-16 bg-[#f0f0f0] dark:bg-[#383838] rounded-md mt-2" />
        <div className="h-3 w-14 bg-[#f0f0f0] dark:bg-[#383838] rounded-md mt-1" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#2f2f2f] p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs flex flex-col justify-between h-32">
        <div className="flex items-center justify-between text-rose-500">
          <span className="text-[12px] font-semibold">{label}</span>
          <AlertCircle className="w-4 h-4" />
        </div>
        <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-1">Failed to load metric.</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[11px] font-semibold text-[#10a37f] underline underline-offset-2 hover:opacity-80 text-left mt-auto cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const displayValue = value !== undefined && value !== null ? value : 0;

  return (
    <div className="bg-white dark:bg-[#2f2f2f] p-4.5 md:p-5 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between transition-all duration-150 hover:border-[#10a37f]/40 group">
      {/* Header Row: Label & Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-semibold text-[#737373] dark:text-[#8e8e8e] tracking-wider truncate uppercase">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
            border: `1px solid ${accentColor}25`,
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-2xl md:text-3xl font-bold text-[#0d0d0d] dark:text-white tracking-tight tabular-nums leading-none">
          {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
        </span>
        {unit && <span className="text-[12px] font-semibold text-[#737373] dark:text-[#8e8e8e]">{unit}</span>}
      </div>

      {/* Footer: Trend Indicator */}
      <div className="mt-3 flex items-center gap-1.5 text-[11.5px]">
        {trend ? (
          <>
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[10.5px] border ${
                trend.isPositive
                  ? 'bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 inline" />
              )}
              {trend.value}
            </span>
            <span className="text-[#737373] dark:text-[#8e8e8e]">vs last cycle</span>
          </>
        ) : (
          <span className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]" />
            Live herd telemetry
          </span>
        )}
      </div>
    </div>
  );
}
