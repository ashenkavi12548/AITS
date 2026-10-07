'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { FeedingAnalyticsResponse, FeedingRecordRow, ReportTableColumn } from '@/types/report.types';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportChartCard } from './ReportChartCard';
import { ReportDataTable } from './ReportDataTable';
import { CHART_COLORS } from '@/constants/report.constants';

interface FeedingAnalyticsProps {
  data?: FeedingAnalyticsResponse;
  isLoading?: boolean;
  isError?: boolean;
  isAccessDenied?: boolean;
  onRetry?: () => void;
  compareWithPrevious?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onPageChange?: (page: number) => void;
}

export const FeedingAnalytics: React.FC<FeedingAnalyticsProps> = ({
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
  const tableColumns: ReportTableColumn<FeedingRecordRow>[] = [
    { key: 'date', header: 'Date', sortable: true },
    {
      key: 'animalTag',
      header: 'Animal Tag',
      sortable: true,
      accessor: (r) => (
        <span className="font-bold text-[#10a37f] bg-[#10a37f]/10 px-2 py-0.5 rounded border border-[#10a37f]/20">
          {r.animalTag}
        </span>
      ),
    },
    { key: 'animalName', header: 'Animal Name', sortable: true },
    { key: 'farmName', header: 'Facility Barn', sortable: true },
    {
      key: 'feedingSession',
      header: 'Shift',
      sortable: true,
      accessor: (r) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#10a37f]/10 text-[#12b88f] border border-[#10a37f]/20">
          {r.feedingSession}
        </span>
      ),
    },
    {
      key: 'feedCategory',
      header: 'Category',
      sortable: true,
      accessor: (r) => r.feedCategory || 'Ration',
    },
    { key: 'feedType', header: 'Feed Formula', sortable: true },
    {
      key: 'actualQuantity',
      header: 'Intake Qty',
      sortable: true,
      accessor: (r) => (
        <span className="font-semibold text-white">
          {r.actualQuantity ?? r.quantity ?? 0} {r.unit || 'kg'}
        </span>
      ),
    },
    {
      key: 'milkYield',
      header: 'Milk Yield',
      sortable: true,
      accessor: (r) =>
        r.milkYield !== null && r.milkYield !== undefined ? (
          <span className="text-[#10a37f] font-semibold">{r.milkYield} L</span>
        ) : (
          <span className="text-zinc-500 text-xs">—</span>
        ),
    },
    {
      key: 'feedEfficiency',
      header: 'Efficiency Ratio',
      sortable: true,
      accessor: (r) =>
        r.feedEfficiency !== null && r.feedEfficiency !== undefined ? (
          <span className="font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 text-xs">
            {r.feedEfficiency} L/kg
          </span>
        ) : (
          <span className="text-zinc-500 text-xs">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (r) => {
        let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (r.status === 'PARTIAL') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        if (r.status === 'MISSED' || r.status === 'CANCELLED') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeColor}`}>{r.status}</span>;
      },
    },
    { key: 'recordedBy', header: 'Logged By', sortable: true },
    { key: 'remarks', header: 'Remarks / Notes', accessor: (r) => r.remarks || r.notes || '-' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <ReportSummaryCards items={data?.summary || []} isLoading={isLoading} compareWithPrevious={compareWithPrevious} />

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feed Consumption vs Milk Production Comparison */}
        <div className="lg:col-span-8">
          <ReportChartCard
            title="Feed Consumption vs Milk Yield Comparison"
            description="Parallel trends of feed intake volume vs milk yield. (Note: Visual comparison only, does not imply direct causation)."
            isLoading={isLoading}
            isError={isError}
            isAccessDenied={isAccessDenied}
            onRetry={onRetry}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.feedVsMilkComparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="feed" name="Feed Intake (Tons)" stroke={CHART_COLORS.primary} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="milk" name="Milk Output (100L)" stroke={CHART_COLORS.secondary} strokeWidth={2.5} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Feed Consumption by Type */}
        <div className="lg:col-span-4">
          <ReportChartCard title="Feed Consumption by Type" description="Distribution of forage vs concentrates." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.feedConsumptionByType || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {(data?.feedConsumptionByType || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Morning vs Evening Feeding by Farm */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Morning vs Evening Feed Allocations" description="Ration weight distributed across shifts per farm." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.morningVsEveningFeeding || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="morning" name="Morning Ration (Tons)" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="evening" name="Evening Ration (Tons)" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Feed Usage by Farm */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Total Feed Volume by Farm" description="Consolidated feed tonnage disbursed." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.feedUsageByFarm || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" name="Tonnage (Tons)" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>
      </div>

      {/* 3. Detailed Data Table */}
      <ReportDataTable
        title="Feed Disbursement Audit Table"
        subtitle="Individual ration distribution logs across all assigned farms."
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



