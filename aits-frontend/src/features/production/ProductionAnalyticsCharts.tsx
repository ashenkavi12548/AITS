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
import { TrendingUp, PieChart as PieIcon, BarChart3, Award } from 'lucide-react';
import { ProductionAnalyticsData } from '@/types/production';

interface ProductionAnalyticsChartsProps {
  data: ProductionAnalyticsData | null;
  isLoading: boolean;
}

export const ProductionAnalyticsCharts: React.FC<ProductionAnalyticsChartsProps> = ({ data, isLoading }) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 transition-colors duration-150">
      {/* 1. Daily Production Trend Chart */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-80">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Daily Production Trend (7 Days)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e]">Volume (Liters)</span>
        </div>

        <div className="flex-1 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10a37f" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10a37f" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-[#f0f0f0] dark:text-[#383838]" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8E8E8E', fontSize: 11 }} />
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
                formatter={(val) => [`${val ?? 0} Liters`, 'Total Milk']}
              />
              <Area type="monotone" dataKey="totalLiters" stroke="#10a37f" strokeWidth={2.5} fillOpacity={1} fill="url(#trendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Morning vs Evening Session Chart */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-80">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Morning vs Evening Yield
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e]">Session Comparison</span>
        </div>

        <div className="flex-1 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-[#f0f0f0] dark:text-[#383838]" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8E8E8E', fontSize: 11 }} />
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
              <Bar dataKey="morningLiters" name="Morning Session" fill="#10a37f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="eveningLiters" name="Evening Session" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Top Producing Animals */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-80">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Top Producing Cows
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e]">Highest Milk Yields</span>
        </div>

        <div className="flex-1 w-full pt-3 overflow-y-auto space-y-2.5">
          {data.topProducers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#737373] dark:text-[#8e8e8e] text-xs py-10">
              No production yields recorded yet.
            </div>
          ) : (
            data.topProducers.map((animal, idx) => (
              <div
                key={animal.animalId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#166534]/10 text-[#166534] dark:text-[#22C55E] text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="font-mono font-bold text-xs text-[#166534] dark:text-[#22C55E]">{animal.animalTag}</span>
                    <p className="text-xs font-semibold text-[#0d0d0d] dark:text-white">{animal.animalName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#0d0d0d] dark:text-white">{animal.totalLiters} L</span>
                  <p className="text-[10.5px] text-[#737373] dark:text-[#8e8e8e]">Avg {animal.averagePerSession} L/session</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Production Share by Farm */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-80">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Production Share by Farm
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e]">Facility Yield Distribution</span>
        </div>

        <div className="flex-1 w-full pt-2 flex items-center justify-center">
          {data.farmShares.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#737373] dark:text-[#8e8e8e] text-xs">
              No farm distribution data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.farmShares}
                  dataKey="liters"
                  nameKey="farmName"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {data.farmShares.map((entry, index) => (
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
                  formatter={(val, name) => [`${val ?? 0} Liters`, `${name ?? ''}`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
