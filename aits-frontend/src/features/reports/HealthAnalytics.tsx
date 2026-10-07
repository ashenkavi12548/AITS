"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  HealthAnalyticsResponse,
  HealthRecordRow,
  ReportTableColumn,
} from "@/types/report.types";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChartCard } from "./ReportChartCard";
import { ReportDataTable } from "./ReportDataTable";
import { CHART_COLORS } from "@/constants/report.constants";

interface HealthAnalyticsProps {
  data?: HealthAnalyticsResponse;
  isLoading?: boolean;
  isError?: boolean;
  isAccessDenied?: boolean;
  onRetry?: () => void;
  compareWithPrevious?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onPageChange?: (page: number) => void;
}

export const HealthAnalytics: React.FC<HealthAnalyticsProps> = ({
  data,
  isLoading,
  isError,
  isAccessDenied,
  onRetry,
  compareWithPrevious,
  searchQuery,
  onSearchChange,
  onPageChange,
}) => {
  const tableColumns: ReportTableColumn<HealthRecordRow>[] = [
    {
      key: "animalTag",
      header: "Animal Tag",
      sortable: true,
      width: "140px",
      accessor: (r) => (
        <span className="font-mono font-bold text-[#166534] dark:text-[#22C55E] bg-[#166534]/10 dark:bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#166534]/20 dark:border-[#22C55E]/20 whitespace-nowrap inline-block text-[11px]">
          {r.animalTag}
        </span>
      ),
    },
    {
      key: "animalName",
      header: "Animal Name",
      sortable: true,
      width: "130px",
      accessor: (r) => (
        <span className="font-semibold text-[#0d0d0d] dark:text-white">
          {r.animalName}
        </span>
      ),
    },
    {
      key: "farmName",
      header: "Farm Location",
      sortable: true,
      width: "190px",
      accessor: (r) => (
        <span className="text-[#737373] dark:text-[#a3a3a3] truncate max-w-45 block">
          {r.farmName}
        </span>
      ),
    },
    { key: "diagnosis", header: "Clinical Diagnosis", sortable: true },
    { key: "caseDate", header: "Case Date", sortable: true, width: "110px" },
    {
      key: "severity",
      header: "Severity",
      sortable: true,
      align: "center",
      width: "110px",
      accessor: (r) => {
        let badgeColor = "bg-slate-500/10 text-slate-600 border-slate-500/20";
        if (r.severity === "MEDIUM")
          badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
        if (r.severity === "HIGH")
          badgeColor = "bg-orange-500/10 text-orange-600 border-orange-500/20";
        if (r.severity === "CRITICAL")
          badgeColor =
            "bg-rose-500/10 text-rose-600 border-rose-500/20 font-black";
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${badgeColor}`}
          >
            {r.severity}
          </span>
        );
      },
    },
    {
      key: "treatmentStatus",
      header: "Treatment Status",
      sortable: true,
      align: "center",
      width: "140px",
      accessor: (r) => {
        let badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
        if (r.treatmentStatus === "RECOVERED")
          badgeColor =
            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        if (r.treatmentStatus === "CLOSED")
          badgeColor = "bg-slate-500/10 text-slate-600 border-slate-500/20";
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${badgeColor}`}
          >
            {r.treatmentStatus}
          </span>
        );
      },
    },
    {
      key: "treatment",
      header: "Treatment / Protocol",
      width: "150px",
      accessor: (r) => r.treatment || "Clinical Observation",
    },
    {
      key: "veterinarian",
      header: "Attending Vet",
      sortable: true,
      width: "160px",
    },
    {
      key: "clinicalRemarks",
      header: "Clinical Remarks",
      accessor: (r) => r.clinicalRemarks || r.outcome || "N/A",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <ReportSummaryCards
        items={data?.summary || []}
        isLoading={isLoading}
        compareWithPrevious={compareWithPrevious}
      />

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases by Diagnosis */}
        <div className="lg:col-span-6">
          <ReportChartCard
            title="Clinical Cases by Diagnosis"
            description="Proportional disease breakdown across herds."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.casesByDiagnosis || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                >
                  {(data?.casesByDiagnosis || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || CHART_COLORS.rose}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#303030",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Vaccination Compliance */}
        <div className="lg:col-span-6">
          <ReportChartCard
            title="Vaccination Compliance Rates"
            description="Herd vaccination coverage percentages."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.vaccinationCompliance || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.15}
                />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#303030",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  name="Compliance %"
                  fill={CHART_COLORS.primary}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Health Cases by Farm */}
        <div className="lg:col-span-6">
          <ReportChartCard
            title="Health Cases by Farm"
            description="Total medical incidents recorded per farm."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.casesByFarm || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.15}
                />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#303030",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  name="Cases Count"
                  fill={CHART_COLORS.secondary}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Treatment Outcomes */}
        <div className="lg:col-span-6">
          <ReportChartCard
            title="Treatment Outcomes & Resolution"
            description="Distribution of resolution statuses."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.treatmentOutcomes || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {(data?.treatmentOutcomes || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || CHART_COLORS.primary}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#303030",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>
      </div>

      {/* 3. Detailed Table */}
      <ReportDataTable
        title="Clinical Health & Treatment Audit Table"
        subtitle="Complete medical logs matching active search and filters."
        columns={tableColumns}
        paginatedData={data?.tableData}
        isLoading={isLoading}
        isError={isError}
            isAccessDenied={isAccessDenied}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onPageChange={onPageChange}
        onRetry={onRetry}
      />
    </div>
  );
};



