'use client';

import React from 'react';
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
} from 'recharts';
import { BreedingAnalyticsResponse, BreedingRecordRow, ReportTableColumn } from '@/types/report.types';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportChartCard } from './ReportChartCard';
import { ReportDataTable } from './ReportDataTable';
import { CHART_COLORS } from '@/constants/report.constants';

interface BreedingAnalyticsProps {
  data?: BreedingAnalyticsResponse;
  isLoading?: boolean;
  isError?: boolean;
  isAccessDenied?: boolean;
  onRetry?: () => void;
  compareWithPrevious?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onPageChange?: (page: number) => void;
}

export const BreedingAnalytics: React.FC<BreedingAnalyticsProps> = ({
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
  const tableColumns: ReportTableColumn<BreedingRecordRow>[] = [
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
    { key: 'farmName', header: 'Farm Location', sortable: true },
    { key: 'serviceDate', header: 'Service Date', sortable: true },
    {
      key: 'breedingMethod',
      header: 'Breeding Method',
      sortable: true,
      accessor: (r) => (r.breedingMethod === 'ARTIFICIAL_INSEMINATION' ? 'AI Straw Insemination' : 'Natural Bull Mating'),
    },
    { key: 'sireInfo', header: 'Sire / Straw', sortable: true, accessor: (r) => r.sireInfo || 'AI Straw Batch' },
    { key: 'technician', header: 'Technician', sortable: true },
    {
      key: 'pregnancyStatus',
      header: 'Pregnancy Status',
      sortable: true,
      accessor: (r) => {
        let badgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (r.pregnancyStatus === 'PENDING') badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        if (r.pregnancyStatus === 'NEGATIVE') badgeColor = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeColor}`}>{r.pregnancyStatus}</span>;
      },
    },
    { key: 'expectedCalvingDate', header: 'Expected Calving', accessor: (r) => r.expectedCalvingDate || 'N/A' },
    {
      key: 'calvingStatus',
      header: 'Calving Outcome',
      sortable: true,
      accessor: (r) => {
        const outcome = r.calvingOutcome || r.calvingStatus;
        let badgeColor = 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        if (outcome === 'EXPECTED_SOON') badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        if (outcome === 'COMPLETED' || outcome === 'NORMAL') badgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (outcome === 'FAILED') badgeColor = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeColor}`}>{outcome || 'NOT_DUE'}</span>;
      },
    },
    { key: 'notes', header: 'Notes', accessor: (r) => r.notes || '-' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <ReportSummaryCards items={data?.summary || []} isLoading={isLoading} compareWithPrevious={compareWithPrevious} />

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Breeding Services */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Monthly Breeding Services Volume" description="Trend of registered services per month." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyServices || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" name="Services Count" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* AI vs Natural Mating */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Artificial Insemination vs Natural Mating" description="Proportional method distribution." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.aiVsNatural || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {(data?.aiVsNatural || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Breeding Success Rate by Farm */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Breeding Conception Rate by Farm (%)" description="Conception success rate per service attempt." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.breedingSuccessRate || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" name="Success Rate %" fill={CHART_COLORS.emerald} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Expected Calvings Forecast */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Forecasted Calvings Schedule" description="Expected live births per month." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.expectedCalvingsByMonth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" name="Forecasted Calvings" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>
      </div>

      {/* 3. Detailed Table */}
      <ReportDataTable
        title="Breeding & Reproductive Audit Table"
        subtitle="Individual insemination, pregnancy diagnosis, and calving records."
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



