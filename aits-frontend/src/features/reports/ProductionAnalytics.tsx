'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
} from 'recharts';
import { ProductionAnalyticsResponse, ProductionRecordRow, ReportTableColumn } from '@/types/report.types';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportChartCard } from './ReportChartCard';
import { ReportDataTable } from './ReportDataTable';
import { CHART_COLORS } from '@/constants/report.constants';

interface ProductionAnalyticsProps {
  data?: ProductionAnalyticsResponse;
  isLoading?: boolean;
  isError?: boolean;
  isAccessDenied?: boolean;
  onRetry?: () => void;
  compareWithPrevious?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onPageChange?: (page: number) => void;
}

export const ProductionAnalytics: React.FC<ProductionAnalyticsProps> = ({
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
  const tableColumns: ReportTableColumn<ProductionRecordRow>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      width: '110px',
      accessor: (r) => <span className="font-medium text-[#737373] dark:text-[#a3a3a3]">{r.date}</span>,
    },
    {
      key: 'animalTag',
      header: 'Animal Tag',
      sortable: true,
      width: '140px',
      accessor: (row) => (
        <span className="font-mono font-bold text-[#166534] dark:text-[#22C55E] bg-[#166534]/10 dark:bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#166534]/20 dark:border-[#22C55E]/20 whitespace-nowrap inline-block text-[11px]">
          {row.animalTag}
        </span>
      ),
    },
    {
      key: 'animalName',
      header: 'Animal Name',
      sortable: true,
      width: '130px',
      accessor: (r) => <span className="font-semibold text-[#0d0d0d] dark:text-white">{r.animalName}</span>,
    },
    {
      key: 'farmName',
      header: 'Farm Location',
      sortable: true,
      width: '200px',
      accessor: (r) => <span className="text-[#737373] dark:text-[#a3a3a3] truncate max-w-[190px] block">{r.farmName}</span>,
    },
    {
      key: 'morningYield',
      header: 'Morning (L)',
      sortable: true,
      align: 'right',
      width: '100px',
      accessor: (r) => `${r.morningYield} L`,
    },
    {
      key: 'eveningYield',
      header: 'Evening (L)',
      sortable: true,
      align: 'right',
      width: '100px',
      accessor: (r) => `${r.eveningYield} L`,
    },
    {
      key: 'totalYield',
      header: 'Total Yield (L)',
      sortable: true,
      align: 'right',
      width: '120px',
      accessor: (r) => <span className="font-bold text-[#0d0d0d] dark:text-white tabular-nums">{r.totalYield} L</span>,
    },
    {
      key: 'qualityStatus',
      header: 'Quality Status',
      sortable: true,
      align: 'center',
      width: '130px',
      accessor: (r) => {
        let badgeColor = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
        if (r.qualityStatus === 'GOOD') badgeColor = 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20';
        if (r.qualityStatus === 'FAIR') badgeColor = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
        if (r.qualityStatus === 'REJECTED') badgeColor = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badgeColor}`}>
            {r.qualityStatus}
          </span>
        );
      },
    },
    {
      key: 'recordedBy',
      header: 'Recorded By',
      sortable: true,
      width: '160px',
      accessor: (r) => <span className="text-[#737373] dark:text-[#a3a3a3] text-[11px]">{r.recordedBy}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <ReportSummaryCards items={data?.summary || []} isLoading={isLoading} compareWithPrevious={compareWithPrevious} />

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Milk Production Trend */}
        <div className="lg:col-span-8">
          <ReportChartCard title="Daily Milk Yield Trend" description="Morning vs Evening yield volume curves." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMorning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEvening" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="morning" name="Morning Yield (L)" stroke={CHART_COLORS.primary} fill="url(#colorMorning)" strokeWidth={2} />
                <Area type="monotone" dataKey="evening" name="Evening Yield (L)" stroke={CHART_COLORS.secondary} fill="url(#colorEvening)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Milk Quality Distribution */}
        <div className="lg:col-span-4">
          <ReportChartCard title="Milk Quality Distribution" description="Quality grade acceptance breakdown." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.qualityDistribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {(data?.qualityDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Morning vs Evening Production by Farm */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Shift Volume by Farm" description="Morning vs Evening session volumes per farm." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.morningVsEvening || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="morning" name="Morning Shift (L)" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="evening" name="Evening Shift (L)" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Top Producing Animals */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Top Milk-Producing Animals" description="Single-day peak lactation leaders." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data?.topProducingAnimals || []} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" name="Daily Yield (L)" fill={CHART_COLORS.accent} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>
      </div>

      {/* 3. Detailed Data Table */}
      <ReportDataTable
        title="Milk Production Records"
        subtitle="Individual milking session logs matching current filters."
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



