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
import { TraceabilityAnalyticsResponse, TraceabilityRecordRow, ReportTableColumn } from '@/types/report.types';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportChartCard } from './ReportChartCard';
import { ReportDataTable } from './ReportDataTable';
import { CHART_COLORS } from '@/constants/report.constants';

interface TraceabilityAnalyticsProps {
  data?: TraceabilityAnalyticsResponse;
  isLoading?: boolean;
  isError?: boolean;
  isAccessDenied?: boolean;
  onRetry?: () => void;
  compareWithPrevious?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onPageChange?: (page: number) => void;
}

export const TraceabilityAnalytics: React.FC<TraceabilityAnalyticsProps> = ({
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
  const tableColumns: ReportTableColumn<TraceabilityRecordRow>[] = [
    { key: 'dateTime', header: 'Dispatched / Date', sortable: true },
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
    {
      key: 'farmName',
      header: 'Route / Location',
      sortable: true,
      accessor: (r) => (
        <div className="text-xs">
          {r.originFarm && r.destinationFarm ? (
            <span className="font-semibold text-white">
              {r.originFarm} <span className="text-zinc-500 font-normal">→</span> {r.destinationFarm}
            </span>
          ) : (
            <span className="text-zinc-300">{r.farmName}</span>
          )}
        </div>
      ),
    },
    {
      key: 'movementReason',
      header: 'Reason / Category',
      sortable: true,
      accessor: (r) => {
        const text = r.movementReason || r.eventType || 'TRANSFER';
        let badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
        if (text.includes('SALE') || text.includes('PURCHASE')) badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        if (text.includes('HEALTH') || text.includes('QUARANTINE')) badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeColor}`}>{text}</span>;
      },
    },
    {
      key: 'transportInfo',
      header: 'Transport / Manifest',
      accessor: (r) => (
        <div className="text-xs text-zinc-300 max-w-xs truncate" title={r.transportInfo || r.eventDescription || ''}>
          {r.transportInfo || r.eventDescription || 'Standard Transport'}
        </div>
      ),
    },
    {
      key: 'movementStatus',
      header: 'Movement Status',
      accessor: (r) => {
        const st = r.movementStatus || 'N/A';
        if (st === 'N/A') return <span className="text-zinc-500 text-xs">N/A</span>;
        let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (st === 'IN_TRANSIT') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        if (st === 'SCHEDULED') badgeColor = 'bg-[#10a37f]/10 text-[#12b88f] border-[#10a37f]/20';
        if (st === 'CANCELLED') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeColor}`}>{st}</span>;
      },
    },
    {
      key: 'authorizedBy',
      header: 'Authorized By',
      sortable: true,
      accessor: (r) => r.authorizedBy || r.recordedBy,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <ReportSummaryCards items={data?.summary || []} isLoading={isLoading} compareWithPrevious={compareWithPrevious} />

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Activities Over Time */}
        <div className="lg:col-span-8">
          <ReportChartCard title="Daily Activity Telemetry Volume" description="Daily audit events logged across active modules." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.activitiesOverTime || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Line type="monotone" dataKey="value" name="Activity Events" stroke={CHART_COLORS.primary} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Daily Activities by Type */}
        <div className="lg:col-span-4">
          <ReportChartCard title="Activities by Category" description="Proportional breakdown of logged activity types." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.dailyActivitiesByType || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {(data?.dailyActivitiesByType || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Monthly Farm Movements */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Monthly Inter-Farm Transfers" description="Historical volume of stock relocations." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyFarmMovements || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" name="Transfers Count" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>

        {/* Farm Movement Reasons */}
        <div className="lg:col-span-6">
          <ReportChartCard title="Transfer Reasons & Justifications" description="Recorded rationale for inter-farm relocations." isLoading={isLoading} isError={isError}
            isAccessDenied={isAccessDenied} onRetry={onRetry}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.movementReasons || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                  {(data?.movementReasons || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.secondary} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#303030', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartCard>
        </div>
      </div>

      {/* 3. Detailed Table */}
      <ReportDataTable
        title="Activity & Traceability Audit Log"
        subtitle="Chronological trail of daily farm events and animal movement history."
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



