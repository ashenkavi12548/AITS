"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
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
import { ReportsOverviewResponse } from "@/types/report.types";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportChartCard } from "./ReportChartCard";
import { CHART_COLORS } from "@/constants/report.constants";

interface ReportsOverviewProps {
  data?: ReportsOverviewResponse;
  isLoading?: boolean;
  isError?: boolean;
  isAccessDenied?: boolean;
  onRetry?: () => void;
  compareWithPrevious?: boolean;
}

const tooltipStyle = {
  backgroundColor: "rgba(17, 24, 39, 0.95)",
  borderColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  color: "#f8fafc",
  fontSize: "13px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  backdropFilter: "blur(8px)",
  padding: "12px",
};

export const ReportsOverview: React.FC<ReportsOverviewProps> = ({
  data,
  isLoading,
  isError,
  isAccessDenied,
  onRetry,
  compareWithPrevious,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Summary Cards */}
      <ReportSummaryCards
        items={data?.summary || []}
        isLoading={isLoading}
        compareWithPrevious={compareWithPrevious}
      />

      {/* 2. Overview Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Milk Production Trend */}
        <div className="lg:col-span-8">
          <ReportChartCard
            title="Milk Production Volume Trend"
            description="Daily aggregated milk yield vs previous period baseline."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            isEmpty={
              !isLoading &&
              !isError &&
              (!data?.milkProductionTrend ||
                data.milkProductionTrend.length === 0)
            }
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data?.milkProductionTrend || []}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="colorMilkCurrent"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                  tickFormatter={(val: string) => {
                    if (val.startsWith("Wk of "))
                      return val.replace("Wk of ", "Wk ");
                    return val.slice(5); // e.g. '08-21' for daily
                  }}
                  dy={10}
                />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  labelFormatter={(label) =>
                    String(label).startsWith("Wk") ? label : `Date: ${label}`
                  }
                  contentStyle={tooltipStyle}
                />
                <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "20px" }} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Current Yield (L)"
                  stroke={CHART_COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorMilkCurrent)"
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: CHART_COLORS.primary, stroke: "#fff", strokeWidth: 2 }}
                />
                {compareWithPrevious && (
                  <Line
                    type="monotone"
                    dataKey="previousValue"
                    name="Previous Period (L)"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Animal Status Distribution */}
        <div className="lg:col-span-4">
          <ReportChartCard
            title="Animal Inventory Status"
            description="Proportional breakdown across active herd categories."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            isEmpty={
              !isLoading &&
              !isError &&
              (!data?.animalStatusDistribution ||
                data.animalStatusDistribution.length === 0)
            }
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {(data?.animalStatusDistribution || []).map((entry, index) => (
                    <linearGradient key={`grad-${index}`} id={`gradStatus-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.color || CHART_COLORS.primary} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color || CHART_COLORS.primary} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={data?.animalStatusDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  stroke="none"
                  cornerRadius={6}
                >
                  {(data?.animalStatusDistribution || []).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#gradStatus-${index})`}
                      />
                    ),
                  )}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Health Cases by Category */}
        <div className="lg:col-span-6">
          <ReportChartCard
            title="Active Health Cases by Diagnosis"
            description="Frequency of recorded clinical cases across herds."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            isEmpty={
              !isLoading &&
              !isError &&
              (!data?.healthCasesByCategory ||
                data.healthCasesByCategory.length === 0)
            }
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data?.healthCasesByCategory || []}
                margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorHealthBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={CHART_COLORS.rose} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={CHART_COLORS.rose} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  opacity={0.2}
                  horizontal={false}
                />
                <XAxis type="number" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar dataKey="value" name="Cases Count" radius={[0, 6, 6, 0]} barSize={24} fill="url(#colorHealthBar)" />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Pregnancy Status Distribution */}
        <div className="lg:col-span-6">
          <ReportChartCard
            title="Reproductive & Pregnancy Status"
            description="Breeding confirmation status across female stock."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            isEmpty={
              !isLoading &&
              !isError &&
              (!data?.pregnancyStatusDistribution ||
                data.pregnancyStatusDistribution.length === 0)
            }
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {(data?.pregnancyStatusDistribution || []).map((entry, index) => (
                    <linearGradient key={`gradPreg-${index}`} id={`gradPreg-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.color || CHART_COLORS.primary} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color || CHART_COLORS.primary} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={data?.pregnancyStatusDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="none"
                  label={({ name, percent }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {(data?.pregnancyStatusDistribution || []).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#gradPreg-${index})`}
                      />
                    ),
                  )}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Farm Movement Trend */}
        <div className="lg:col-span-6">
          <ReportChartCard
            title="Inter-Farm Animal Movement Trend"
            description="Weekly volume of registered stock transfers."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            isEmpty={
              !isLoading &&
              !isError &&
              (!data?.farmMovementTrend || data.farmMovementTrend.length === 0)
            }
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.farmMovementTrend || []}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorMovementBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={1} />
                    <stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  minTickGap={30}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: string) => {
                    if (val.startsWith("Wk of "))
                      return val.replace("Wk of ", "Wk ");
                    return val.slice(5);
                  }}
                  dy={10}
                />
                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip
                  labelFormatter={(label) => {
                    if (!label) return "";
                    const strLabel = String(label);
                    return strLabel.startsWith("Wk") ? strLabel : `Date: ${strLabel}`;
                  }}
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar
                  dataKey="value"
                  name="Movements"
                  fill="url(#colorMovementBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Animals by Farm */}
        <div className="lg:col-span-6">
          <ReportChartCard
            title="Stock Distribution Across Farms"
            description="Total registered livestock per farm location."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            isEmpty={
              !isLoading &&
              !isError &&
              (!data?.animalsByFarm || data.animalsByFarm.length === 0)
            }
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.animalsByFarm || []}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  {(data?.animalsByFarm || []).map((entry, index) => (
                    <linearGradient key={`gradFarm-${index}`} id={`gradFarm-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color || CHART_COLORS.primary} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color || CHART_COLORS.primary} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                />
                <Bar
                  dataKey="value"
                  name="Livestock Count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                >
                  {(data?.animalsByFarm || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#gradFarm-${index})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>
      </div>
    </div>
  );
};
