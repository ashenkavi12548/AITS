"use client";

import React from "react";
import {
  PawPrint,
  Activity,
  Milk,
  TrendingUp,
  HeartPulse,
  Dna,
  Route,
  AlertCircle,
  TrendingDown,
  Sun,
  Moon,
  Award,
  CheckCircle2,
  FileText,
  Pill,
  Syringe,
  ShieldAlert,
  Wheat,
  Scale,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  PieChart,
  Clock,
  XCircle,
  Calendar,
  Heart,
  Utensils,
  Truck,
} from "lucide-react";
import { ReportSummaryItem } from "@/types/report.types";
import { formatNumber } from "@/utils/report.utils";

interface ReportSummaryCardsProps {
  items: ReportSummaryItem[];
  isLoading?: boolean;
  compareWithPrevious?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  PawPrint,
  Activity,
  Milk,
  TrendingUp,
  HeartPulse,
  Dna,
  Route,
  AlertCircle,
  Sun,
  Moon,
  Award,
  CheckCircle2,
  FileText,
  Pill,
  Syringe,
  ShieldAlert,
  Wheat,
  Scale,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  PieChart,
  Clock,
  XCircle,
  Calendar,
  Heart,
  Utensils,
  Truck,
};

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({
  items,
  isLoading,
  compareWithPrevious = true,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-2xl bg-[#e5e5e5]/50 dark:bg-[#212121]/50 animate-pulse border border-[#e5e5e5] dark:border-[#303030]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((item) => {
        const IconComponent =
          (item.iconName && ICON_MAP[item.iconName]) || Activity;

        // Safe percentage rendering
        const hasPercentage =
          item.changePercentage !== undefined && item.changePercentage !== null;
        const isUp = item.changeDirection === "increase";
        const isPositiveContext = item.isPositive !== false; // If undefined or true, treat green as positive

        // Badge color logic
        let badgeBg =
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
        let iconBg =
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20";

        if (hasPercentage) {
          if (
            (isUp && !isPositiveContext) ||
            (!isUp && isPositiveContext && item.changePercentage! < 0)
          ) {
            // e.g. Increased health cases or decreased good metric
            if (item.changePercentage! < 0 && isPositiveContext) {
              badgeBg =
                "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
            } else {
              badgeBg =
                "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
              iconBg =
                "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20";
            }
          }
        }

        return (
          <div
            key={item.id}
            className="bg-white dark:bg-[#242424] rounded-xl border border-[#cbd5e1] dark:border-[#525252] p-3 flex flex-col justify-between group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`p-1 rounded-lg ${iconBg} transition-colors`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <p className="text-[10px] font-medium text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wider line-clamp-1">
              {item.label}
            </p>

            <div className="text-lg font-bold mt-0.5 flex items-baseline gap-1 text-slate-900 dark:text-white">
              {typeof item.value === "number" ? formatNumber(item.value) : item.value}
              {item.unit && (
                <span className="text-[10px] opacity-70 font-semibold">{item.unit}</span>
              )}
            </div>

            {/* Comparison details */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#333333] flex items-center justify-between text-[10px]">
              {compareWithPrevious && hasPercentage ? (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${badgeBg}`}>
                  {isUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(item.changePercentage!)}%
                </span>
              ) : compareWithPrevious && item.previousValue !== undefined ? (
                <span className="text-[#64748b] dark:text-[#94a3b8] font-medium bg-slate-50 dark:bg-[#333] px-1.5 py-0.5 rounded">
                  Prev: <strong className="text-slate-700 dark:text-slate-300">{item.previousValue}</strong>
                </span>
              ) : (
                <span className="text-[#64748b] dark:text-[#94a3b8]">Standard baseline</span>
              )}

              <p className="text-[9px] text-[#64748b] dark:text-[#94a3b8] truncate max-w-20" title={item.description}>
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
