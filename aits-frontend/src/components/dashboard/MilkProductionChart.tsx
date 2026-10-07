'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Milk, AlertCircle, RefreshCw } from 'lucide-react';
import { useMilkProductionTrend } from '@/hooks/use-dashboard';
import { PeriodType } from '@/types/dashboard';

export default function MilkProductionChart() {
  const [period, setPeriod] = useState<PeriodType>('daily');
  const { data, isLoading, isError, refetch } = useMilkProductionTrend(period);

  return (
    <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-95 transition-colors duration-150">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#e5e5e5] dark:border-[#383838]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center border border-[#0ea5e9]/20 shadow-2xs">
            <Milk className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white tracking-tight">
              Milk Yield Analytics
            </h2>
            <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">
              Total volume recorded across milking stalls (Liters)
            </p>
          </div>
        </div>

        {/* Period Selector Toggle */}
        <div className="inline-flex bg-[#f4f4f4] dark:bg-[#212121] p-0.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
          {(['daily', 'weekly', 'monthly'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[12px] font-medium rounded-lg capitalize transition-all cursor-pointer ${
                period === p
                  ? 'bg-[#10a37f] text-white font-semibold shadow-xs'
                  : 'text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 w-full pt-4 min-h-57.5">
        {isLoading ? (
          <div className="w-full h-full flex flex-col justify-end space-y-2 animate-pulse px-4">
            <div className="flex items-end justify-between h-44 gap-2">
              {[40, 65, 30, 85, 55, 70, 90].map((h, i) => (
                <div
                  key={i}
                  className="bg-[#f0f0f0] dark:bg-[#383838] rounded-t-lg w-full"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-md w-full" />
          </div>
        ) : isError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-[#737373] dark:text-[#8e8e8e]">
            <AlertCircle className="w-7 h-7 text-rose-500 mb-2" />
            <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">Unable to load milk trends</p>
            <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">Please check network or backend connection.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#10a37f] bg-[#10a37f]/10 rounded-lg hover:bg-[#10a37f]/20 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-[#737373] dark:text-[#8e8e8e]">
            <Milk className="w-7 h-7 text-[#737373]/50 mb-2" />
            <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">No milk records available</p>
            <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">Record yields to visualize trends.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-[#f0f0f0] dark:text-[#383838]"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8E8E8E', fontSize: 11, fontWeight: 400 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8E8E8E', fontSize: 11, fontWeight: 400 }}
              />
              <Tooltip
                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                contentStyle={{
                  backgroundColor: '#212121',
                  borderColor: '#383838',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                  fontSize: '12px',
                  color: '#ECECEC',
                }}
                itemStyle={{ color: '#10A37F', fontWeight: 600 }}
                labelStyle={{ color: '#B4B4B4', fontWeight: 600 }}
                formatter={(value: unknown) => [`${value ?? 0} Liters`, 'Milk Yield']}
              />
              <Bar dataKey="quantityLiters" radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === data.length - 1 ? '#0ea5e9' : '#10a37f'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
