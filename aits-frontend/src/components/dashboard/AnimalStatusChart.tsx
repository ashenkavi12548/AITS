"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieChartIcon, AlertCircle, RefreshCw } from "lucide-react";
import { useAnimalStatusDistribution } from "@/hooks/use-dashboard";

const STATUS_COLOR_MAP: Record<string, string> = {
  HEALTHY: "#10A37F",
  ACTIVE: "#10A37F",
  "UNDER TREATMENT": "#F59E0B",
  CALF: "#0EA5E9",
  LACTATING: "#10A37F",
  PREGNANT: "#8B5CF6",
  QUARANTINED: "#71717A",
  SOLD: "#3B82F6",
  DECEASED: "#52525B",
};

export default function AnimalStatusChart() {
  const { data, isLoading, isError, refetch } = useAnimalStatusDistribution();

  const getColor = (statusKey: string, index: number): string => {
    const key = statusKey.toUpperCase();
    if (STATUS_COLOR_MAP[key]) return STATUS_COLOR_MAP[key];
    const fallbackPalette = [
      "#10A37F",
      "#0EA5E9",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#71717A",
    ];
    return fallbackPalette[index % fallbackPalette.length];
  };

  const totalAnimals = data
    ? data.reduce((acc, curr) => acc + curr.count, 0)
    : 0;

  return (
    <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-95 transition-colors duration-150">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#e5e5e5] dark:border-[#383838]">
        <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20 shadow-2xs">
          <PieChartIcon className="w-4.5 h-4.5" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white tracking-tight">
            Herd Status Matrix
          </h2>
          <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">
            Health & lifecycle distribution
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full pt-2 min-h-57.5 flex items-center">
        {isLoading ? (
          <div className="w-full flex items-center justify-center gap-6 animate-pulse">
            <div className="w-32 h-32 rounded-full border-6 border-[#f0f0f0] dark:border-[#383838]" />
            <div className="space-y-2 w-28">
              <div className="h-3 bg-[#f0f0f0] dark:bg-[#383838] rounded-md" />
              <div className="h-3 bg-[#f0f0f0] dark:bg-[#383838] rounded-md" />
              <div className="h-3 bg-[#f0f0f0] dark:bg-[#383838] rounded-md" />
            </div>
          </div>
        ) : isError ? (
          <div className="w-full flex flex-col items-center justify-center text-center p-4 text-[#737373] dark:text-[#8e8e8e]">
            <AlertCircle className="w-7 h-7 text-rose-500 mb-2" />
            <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
              Unable to load status distribution
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#10a37f] bg-[#10a37f]/10 rounded-lg hover:bg-[#10a37f]/20 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center text-center p-4 text-[#737373] dark:text-[#8e8e8e]">
            <PieChartIcon className="w-7 h-7 text-[#737373]/50 mb-2" />
            <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
              No animal status records available
            </p>
            <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
              Register animals to view distribution.
            </p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            {/* Donut Chart */}
            <div className="relative h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColor(entry.label, index)}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#212121",
                      borderColor: "#383838",
                      borderRadius: "12px",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                      fontSize: "12px",
                      color: "#ECECEC",
                    }}
                    formatter={(val: unknown, name: unknown) => [
                      `${val ?? 0} animals`,
                      (name as string) ?? "Status",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-[#0d0d0d] dark:text-white tracking-tight leading-none">
                  {totalAnimals}
                </span>
                <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e] uppercase tracking-wider font-semibold mt-1">
                  Herd Total
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar pr-1">
              {data.map((item, index) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#f4f4f4] dark:hover:bg-[#383838]/60 transition-colors text-[12.5px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getColor(item.label, index) }}
                    />
                    <span className="font-medium text-[#0d0d0d] dark:text-[#ececec] capitalize truncate max-w-22.5">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0d0d0d] dark:text-white tabular-nums">
                      {item.count}
                    </span>
                    <span className="text-[11px] font-medium text-[#737373] dark:text-[#8e8e8e] w-9 text-right tabular-nums">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
