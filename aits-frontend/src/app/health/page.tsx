"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  HeartPulse,
  Syringe,
  Pill,
  ShieldAlert,
  FileCheck2,
  Stethoscope,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Thermometer,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import {
  healthService,
  HealthOverviewResponse,
} from "@/services/health.service";
import { StatsCards } from "@/components/common/StatsCards";

export default function HealthPage() {
  const [data, setData] = useState<HealthOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await healthService.getHealthOverview();
      setData(res);
    } catch (err: unknown) {
      console.error("Failed to load health overview", err);
      setError("Could not load live health data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    healthService
      .getHealthOverview()
      .then((res) => {
        if (!ignore) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error("Failed to load health overview", err);
          setError("Could not load live health data. Please try again.");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const kpiConfigs = [
    {
      key: "total",
      icon: Activity,
      color: "text-[#10a37f]",
      bg: "bg-[#10a37f]/10",
      border: "border-[#10a37f]/20",
    },
    {
      key: "healthy",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      key: "treatment",
      icon: Pill,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      key: "quarantine",
      icon: ShieldAlert,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  ];

  return (
    <DashboardLayout>
      {/* ── Page Header ── */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-[#10a37f]/20 shadow-2xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-[#10a37f] bg-[#10a37f]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#10a37f]/20">
                Biosecurity & Clinical Logs
              </span>
              {data && data.criticalAlertsCount > 0 && (
                <span className="text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
                  {data.criticalAlertsCount} Critical Alerts
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
              Health & Veterinary Management
            </h1>
            <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
              Clinical diagnostics, vaccinations, treatments, quarantine, and
              health clearances
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/health/diagnoses"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs active:scale-[0.98]"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Log Health Check</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchOverview}
            className="underline font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Active Outbreak Alert Banner ── */}
      {data?.outbreakAlerts && data.outbreakAlerts.count > 0 && (
        <div className="p-4 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-700 dark:text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight uppercase">
                Active Epidemiological Alert: {data.outbreakAlerts.count} Disease Clusters Detected
              </h4>
              <p className="text-xs text-red-800 dark:text-red-200 mt-0.5">
                Clustered cases detected across herd in the last 14 days. Strict quarantine and biosecurity protocols must be maintained.
              </p>
            </div>
          </div>
          <Link
            href="/health/quarantine"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shrink-0 transition-colors shadow-xs"
          >
            <span>Enforce Biosecurity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Food Safety & Biosecurity Control Strip ── */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Milk Withholding Active</p>
                <p className="text-lg font-bold text-amber-900 dark:text-amber-200 leading-tight">
                  {data.milkWithheld ?? 0} <span className="text-xs font-normal">animals</span>
                </p>
              </div>
            </div>
            <Link
              href="/health/treatments"
              className="text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline"
            >
              View &rarr;
            </Link>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-orange-800 dark:text-orange-300 font-medium">Meat Withdrawal Active</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-200 leading-tight">
                  {data.meatWithheld ?? 0} <span className="text-xs font-normal">animals</span>
                </p>
              </div>
            </div>
            <Link
              href="/health/treatments"
              className="text-xs text-orange-700 dark:text-orange-300 font-semibold hover:underline"
            >
              View &rarr;
            </Link>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-red-800 dark:text-red-300 font-medium">Movement Restrictions</p>
                <p className="text-lg font-bold text-red-900 dark:text-red-200 leading-tight">
                  {data.movementRestricted ?? 0} <span className="text-xs font-normal">animals</span>
                </p>
              </div>
            </div>
            <Link
              href="/health/quarantine"
              className="text-xs text-red-700 dark:text-red-300 font-semibold hover:underline"
            >
              View &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <StatsCards
        isLoading={loading}
        cards={(
          data?.kpis || [
            {
              label: "Total Animals",
              value: "—",
              sub: "Loading…",
              type: "total" as const,
            },
            {
              label: "Healthy Animals",
              value: "—",
              sub: "Loading…",
              type: "healthy" as const,
            },
            {
              label: "Under Treatment",
              value: "—",
              sub: "Loading…",
              type: "treatment" as const,
            },
            {
              label: "In Quarantine",
              value: "—",
              sub: "Loading…",
              type: "quarantine" as const,
            },
          ]
        ).map((kpi, i) => {
          const cfg = kpiConfigs[i] || kpiConfigs[0];
          const Icon = cfg.icon;
          return {
            label: kpi.label,
            value: kpi.value,
            icon: <Icon className="w-4 h-4" />,
            color: cfg.color,
            bg: cfg.bg,
            suffix: kpi.sub,
          };
        })}
      />

      {/* ── Module Grid + Recent Alerts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Module Cards */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Clinical Diagnoses */}
          <Link
            href="/health/diagnoses"
            className="group bg-white dark:bg-[#2f2f2f] p-5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs hover:border-[#10a37f]/30 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                {data?.moduleStats.diagnoses.badge || "Active"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f] transition-colors">
                Clinical Diagnoses
              </h3>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-0.5 leading-relaxed line-clamp-2">
                Record clinical examination findings, diagnose conditions, and
                track severity ratings for each animal.
              </p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex gap-3">
                <div className="text-center">
                  <p className="text-[13px] font-bold text-[#0d0d0d] dark:text-white">
                    {data?.moduleStats.diagnoses.activeCount ?? "—"}
                  </p>
                  <p className="text-[10px] text-[#8e8e8e] leading-tight">
                    Active Cases
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8e8e8e] group-hover:text-[#10a37f] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* Vaccinations */}
          <Link
            href="/health/vaccinations"
            className="group bg-white dark:bg-[#2f2f2f] p-5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs hover:border-[#10a37f]/30 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/20">
                <Syringe className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                {data?.moduleStats.vaccinations.badge || "Coverage"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f] transition-colors">
                Vaccinations
              </h3>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-0.5 leading-relaxed line-clamp-2">
                Administer and record scheduled vaccination programs. Track FMD,
                Anthrax, Blackleg, and Rabies coverage.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                {data?.moduleStats.vaccinations.stats
                  ?.slice(0, 3)
                  .map((s, si) => (
                    <div key={si} className="text-center">
                      <p className="text-[13px] font-bold text-[#0d0d0d] dark:text-white">
                        {s.count}
                      </p>
                      <p className="text-[10px] text-[#8e8e8e] dark:text-[#737373] leading-tight truncate max-w-15">
                        {s.label.split(" ")[0]}
                      </p>
                    </div>
                  ))}
              </div>
              <ArrowRight className="w-4 h-4 text-[#8e8e8e] group-hover:text-[#10a37f] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* Treatments */}
          <Link
            href="/health/treatments"
            className="group bg-white dark:bg-[#2f2f2f] p-5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs hover:border-[#10a37f]/30 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
                <Pill className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                {data?.moduleStats.treatments.badge || "Prescriptions"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f] transition-colors">
                Treatments & Prescriptions
              </h3>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-0.5 leading-relaxed line-clamp-2">
                Prescribe medications, log dosages, and enforce antibiotic
                withdrawal periods before milk collection.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                {data?.moduleStats.treatments.stats?.map((s, si) => (
                  <div key={si} className="text-center">
                    <p className="text-[13px] font-bold text-[#0d0d0d] dark:text-white">
                      {s.count}
                    </p>
                    <p className="text-[10px] text-[#8e8e8e] dark:text-[#737373] leading-tight truncate max-w-17.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <ArrowRight className="w-4 h-4 text-[#8e8e8e] group-hover:text-[#10a37f] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* Quarantine & Biosecurity */}
          <Link
            href="/health/quarantine"
            className="group bg-white dark:bg-[#2f2f2f] p-5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs hover:border-[#10a37f]/30 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                {data?.moduleStats.quarantine.badge || "Isolated"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f] transition-colors">
                Quarantine & Biosecurity
              </h3>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-0.5 leading-relaxed line-clamp-2">
                Enforce biosecurity isolation protocols for suspected or
                confirmed disease outbreaks across farm zones.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                {data?.moduleStats.quarantine.stats?.map((s, si) => (
                  <div key={si} className="text-center">
                    <p className="text-[13px] font-bold text-[#0d0d0d] dark:text-white">
                      {s.count}
                    </p>
                    <p className="text-[10px] text-[#8e8e8e] dark:text-[#737373] leading-tight truncate max-w-17.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <ArrowRight className="w-4 h-4 text-[#8e8e8e] group-hover:text-[#10a37f] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* Health Clearances */}
          <Link
            href="/health/clearances"
            className="group bg-white dark:bg-[#2f2f2f] p-5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs hover:border-[#10a37f]/30 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-[#10a37f]/20">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                {data?.moduleStats.clearances.badge || "Permits"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f] transition-colors">
                Health Clearances
              </h3>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-0.5 leading-relaxed line-clamp-2">
                Issue veterinary health clearance certificates for animal
                transit, trade, and cross-district transport.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="text-center">
                  <p className="text-[13px] font-bold text-[#0d0d0d] dark:text-white">
                    {data?.moduleStats.clearances.issuedThisMonth ?? "—"}
                  </p>
                  <p className="text-[10px] text-[#8e8e8e] leading-tight">
                    This Month
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-[#0d0d0d] dark:text-white">
                    {data?.moduleStats.clearances.pendingApproval ?? "—"}
                  </p>
                  <p className="text-[10px] text-[#8e8e8e] leading-tight">
                    Pending
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8e8e8e] group-hover:text-[#10a37f] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* Lab Results */}
          <Link
            href="/health/lab-results"
            className="group bg-white dark:bg-[#2f2f2f] p-5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs hover:border-[#10a37f]/30 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0 border border-teal-500/20">
                <FlaskConical className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20">
                {data?.moduleStats.labResults.badge || "Diagnostics"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f] transition-colors">
                Lab Results & Reports
              </h3>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-0.5 leading-relaxed line-clamp-2">
                Upload and review laboratory test results, blood work, milk
                quality tests, and disease screening reports.
              </p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex gap-3">
                <div className="text-center">
                  <p className="text-[13px] font-bold text-[#0d0d0d] dark:text-white">
                    {data?.moduleStats.labResults.flaggedCount ?? "—"}
                  </p>
                  <p className="text-[10px] text-[#8e8e8e] leading-tight">
                    Flagged Results
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8e8e8e] group-hover:text-[#10a37f] group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        </div>

        {/* Recent Alerts Panel */}
        <div className="bg-white dark:bg-[#2f2f2f] rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#e5e5e5] dark:border-[#383838]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#10a37f]" />
              <span className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
                Recent Health Alerts
              </span>
            </div>
            <Link
              href="/notifications"
              className="text-[11px] text-[#10a37f] hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <div className="flex-1 divide-y divide-[#e5e5e5] dark:divide-[#383838]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#8e8e8e]">
                Loading alerts…
              </div>
            ) : data && data.recentAlerts.length > 0 ? (
              data.recentAlerts.map((alert, i) => {
                const isCrit = alert.type === "critical";
                const isWarn = alert.type === "warning";
                const Icon = isCrit
                  ? AlertTriangle
                  : isWarn
                    ? Clock
                    : Thermometer;
                const color = isCrit
                  ? "text-red-500"
                  : isWarn
                    ? "text-amber-500"
                    : "text-sky-500";
                const bg = isCrit
                  ? "bg-red-500/10"
                  : isWarn
                    ? "bg-amber-500/10"
                    : "bg-sky-500/10";

                return (
                  <div
                    key={i}
                    className="p-3.5 flex items-start gap-3 hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#0d0d0d] dark:text-[#ececec] leading-snug">
                        {alert.msg}
                      </p>
                      <p className="text-[11px] text-[#8e8e8e] mt-0.5">
                        {new Date(alert.time).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[#8e8e8e]">
                No active health alerts.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
