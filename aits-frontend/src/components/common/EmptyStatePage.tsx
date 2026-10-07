"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, Plus, ArrowLeft, Sparkles, Radio } from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface FeatureHighlight {
  title: string;
  description: string;
}

interface EmptyStatePageProps {
  title: string;
  category: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  highlights?: FeatureHighlight[];
}

export default function EmptyStatePage({
  title,
  category,
  description,
  icon: Icon,
  actionLabel = "Create First Record",
  actionHref,
  onActionClick,
  highlights = [
    {
      title: "Automated Traceability",
      description:
        "Records are cryptographically timestamped and linked to national animal identifiers.",
    },
    {
      title: "Offline Sync Ready",
      description:
        "Field officers can capture records offline; entries sync automatically once connected.",
    },
    {
      title: "Audit & Compliance",
      description:
        "Full historical audit trail maintained for veterinary and biosecurity regulations.",
    },
  ],
}: EmptyStatePageProps) {
  return (
    <DashboardLayout>
      {/* 1. Header Bar */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-[#10a37f]/20 shadow-2xs">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#10a37f] bg-[#10a37f]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#10a37f]/20">
                {category}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
              {title}
            </h1>
            <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4] bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl hover:bg-[#ececec] dark:hover:bg-[#383838] hover:text-[#0d0d0d] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>{actionLabel}</span>
            </Link>
          ) : (
            <button
              onClick={
                onActionClick ?? (() => toast(`${title}: Action initiated.`, { icon: 'ℹ️' }))
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Empty State Hero Card */}
      <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5 relative overflow-hidden transition-colors duration-150">
        {/* Visual Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20">
            <Icon className="w-8 h-8" strokeWidth={1.75} />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        {/* Text Content */}
        <div className="max-w-md space-y-1.5">
          <h2 className="text-lg md:text-xl font-semibold text-[#0d0d0d] dark:text-white tracking-tight">
            No {title} Records Yet
          </h2>
          <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
            There are currently no active entries logged in the {title.toLowerCase()}{" "}
            telemetry partition. You can register a new entry now or synchronize from field sensors.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>{actionLabel}</span>
            </Link>
          ) : (
            <button
              onClick={
                onActionClick ??
                (() => toast(`${title}: Record creation modal.`, { icon: 'ℹ️' }))
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{actionLabel}</span>
            </button>
          )}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#0d0d0d] dark:text-[#ececec] bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl hover:bg-[#ececec] dark:hover:bg-[#383838] transition-colors"
          >
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* 3. Capability Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {highlights.map((h, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#2f2f2f] p-4.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs space-y-1.5 group transition-colors duration-150"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20">
                <Radio className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <h3 className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">{h.title}</h3>
            </div>
            <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-normal">
              {h.description}
            </p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
