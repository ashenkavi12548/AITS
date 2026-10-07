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
import { TrendingUp, PieChart as PieIcon, BarChart3, Calendar } from 'lucide-react';
import { BreedingAnalyticsData } from '@/types/breeding';

interface BreedingAnalyticsChartsProps {
  data: BreedingAnalyticsData | null;
  isLoading: boolean;
}

export const BreedingAnalyticsCharts: React.FC<BreedingAnalyticsChartsProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#2f2f2f] p-5 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs h-72 animate-pulse flex flex-col justify-between"
          >
            <div className="h-4 w-32 bg-[#f0f0f0] dark:bg-[#383838] rounded-md" />
            <div className="h-48 w-full bg-[#f0f0f0] dark:bg-[#383838] rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const hasMonthlyServices = data.monthlyTrends?.some((m) => m.totalServices > 0);
  const hasMethodComparison = data.monthlyTrends?.some((m) => m.aiServices > 0 || m.naturalServices > 0);
  const hasPregnancyData = data.pregnancyDistribution?.some((p) => p.count > 0);
  const hasCalvingForecast = data.expectedCalvingsByMonth?.some((c) => c.expectedCount > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 transition-colors duration-150">
      {/* 1. Monthly Breeding Service Trend */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-80">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Monthly Breeding Services
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e]">Volume (Attempts)</span>
        </div>

        <div className="flex-1 w-full pt-3 flex items-center justify-center">
          {hasMonthlyServices ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="breedingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10a37f" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10a37f" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-[#f0f0f0] dark:text-[#383838]" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8E8E8E', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8E8E8E', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#212121',
                    borderColor: '#383838',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    fontSize: '12px',
                    color: '#ECECEC',
                  }}
                  formatter={(val) => [`${val ?? 0} Services`, 'Total Breeding Services']}
                />
                <Area type="monotone" dataKey="totalServices" stroke="#10a37f" strokeWidth={2.5} fillOpacity={1} fill="url(#breedingGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#0d0d0d] dark:text-white">No breeding services recorded</span>
              <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] max-w-xs mt-0.5">
                Record artificial insemination or natural breeding services to see monthly volume trends.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Artificial Insemination vs Natural Breeding */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-80">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              AI vs Natural Breeding Method
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e]">Method Comparison</span>
        </div>

        <div className="flex-1 w-full pt-3 flex items-center justify-center">
          {hasMethodComparison ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-[#f0f0f0] dark:text-[#383838]" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8E8E8E', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8E8E8E', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#212121',
                    borderColor: '#383838',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    fontSize: '12px',
                    color: '#ECECEC',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="aiServices" name="Artificial Insemination (AI)" fill="#10a37f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="naturalServices" name="Natural Breeding" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#0d0d0d] dark:text-white">No method comparison data</span>
              <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] max-w-xs mt-0.5">
                Breeding method breakdown between AI and natural mating will appear here.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Pregnancy Status Distribution */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-80">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Pregnancy Status Distribution
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e]">Herd PD Status</span>
        </div>

        <div className="flex-1 w-full pt-2 flex items-center justify-center">
          {hasPregnancyData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.pregnancyDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {data.pregnancyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#212121',
                    borderColor: '#383838',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    fontSize: '12px',
                    color: '#ECECEC',
                  }}
                  formatter={(val, name) => [`${val ?? 0} Cows`, `${name ?? ''}`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center mb-2">
                <PieIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#0d0d0d] dark:text-white">No pregnancy records found</span>
              <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] max-w-xs mt-0.5">
                Log pregnancy diagnosis checks to track confirmed, pending, and recheck statuses.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Expected Calvings by Month */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-80">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Expected Calvings by Month
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e]">Gestation Timeline</span>
        </div>

        <div className="flex-1 w-full pt-3 flex items-center justify-center">
          {hasCalvingForecast ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.expectedCalvingsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-[#f0f0f0] dark:text-[#383838]" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8E8E8E', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8E8E8E', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#212121',
                    borderColor: '#383838',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    fontSize: '12px',
                    color: '#ECECEC',
                  }}
                  formatter={(val) => [`${val ?? 0} Calves Expected`, 'Birth Forecast']}
                />
                <Bar dataKey="expectedCount" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#0d0d0d] dark:text-white">No upcoming calvings scheduled</span>
              <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] max-w-xs mt-0.5">
                Calving forecasts will calculate automatically for confirmed pregnant animals.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
