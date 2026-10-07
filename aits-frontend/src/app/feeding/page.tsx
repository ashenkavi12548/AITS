"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Wheat,
  Search,
  Utensils,
  RefreshCw,
  BarChart2,
  Activity,
} from "lucide-react";
import { feedingService, FeedingRecord } from "@/services/feeding.service";
import { animalsService } from "@/services/animals.service";
import AnimalFeedingModal from "@/components/animals/AnimalFeedingModal";
import { StatsCards } from "@/components/common/StatsCards";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function FeedingManagementPage() {
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [totalAnimals, setTotalAnimals] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFeedingModalOpen, setIsFeedingModalOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const [data, animalsRes] = await Promise.all([
        feedingService.getAllFeedingRecords(),
        animalsService.getAnimals({ limit: 1 }),
      ]);
      setRecords(data);
      setTotalAnimals(animalsRes.meta?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRecords();
  }, []);

  const today = new Date().toDateString();
  const recordsToday = records.filter(
    (r) => new Date(r.fedAt).toDateString() === today,
  );
  const totalFeedToday = recordsToday.reduce(
    (acc, r) => acc + (Number(r.quantity) || 0),
    0,
  );
  const uniqueAnimalsFedToday = new Set(recordsToday.map((r) => r.animalId))
    .size;

  const animalsFed = uniqueAnimalsFedToday;
  const animalsNotFed = Math.max(0, totalAnimals - animalsFed);
  const feedingPercentage = totalAnimals > 0 ? Math.round((animalsFed / totalAnimals) * 100) : 0;

  const coverageData = [
    { name: "Fed", value: animalsFed },
    { name: "Not Fed", value: animalsNotFed },
  ];
  const COVERAGE_COLORS = ["#10a37f", "#e5e7eb"];

  const filteredRecords = records.filter(
    (r) =>
      r.animal?.animalNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      r.animal?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.feedType?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Chart Data Preparation
  const chartData = useMemo(() => {
    // 1. Feed Distribution by Type (Pie Chart)
    const feedTypeMap = new Map<string, number>();
    records.forEach((r) => {
      const typeName = r.feedType?.name || "Unknown";
      const qty = Number(r.quantity) || 0;
      feedTypeMap.set(typeName, (feedTypeMap.get(typeName) || 0) + qty);
    });
    const pieData = Array.from(feedTypeMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // 2. Feed Consumption Over Time (Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    const dailyMap = new Map<string, number>();
    last7Days.forEach((date) => dailyMap.set(date, 0));

    records.forEach((r) => {
      const dateStr = new Date(r.fedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (dailyMap.has(dateStr)) {
        dailyMap.set(
          dateStr,
          dailyMap.get(dateStr)! + (Number(r.quantity) || 0),
        );
      }
    });
    const barData = Array.from(dailyMap.entries()).map(([date, quantity]) => ({
      date,
      quantity,
    }));

    return { pieData, barData };
  }, [records]);

  const COLORS = ["#f59e0b", "#10a37f", "#3b82f6", "#8b5cf6", "#ec4899"];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200 p-2 sm:p-0">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-[#10a37f]/20">
                <Wheat className="w-5 h-5" />
              </div>
              Feeding & Nutrition Dashboard
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl">
              Track feed consumption, monitor daily rations, and view feeding
              history across your farm.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-[#222] transition-colors shadow-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin text-[#10a37f]" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => {
                setSelectedAnimalId(null);
                setIsFeedingModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm shadow-amber-500/20"
            >
              <Utensils className="w-4 h-4" />
              Log Feeding
            </button>
          </div>
        </div>

        {/* Dashboard KPIs */}
        <StatsCards
          isLoading={isLoading}
          cards={[
            {
              label: "Animals Fed Today",
              value: uniqueAnimalsFedToday,
              icon: <Utensils className="w-4 h-4" />,
              color: "text-amber-600 dark:text-amber-500",
              bg: "bg-amber-500/10",
              suffix: "animals",
            },
            {
              label: "Total Feed Today",
              value: totalFeedToday.toFixed(1),
              icon: <Wheat className="w-4 h-4" />,
              color: "text-emerald-600 dark:text-emerald-500",
              bg: "bg-emerald-500/10",
              suffix: "kg",
            },
            {
              label: "Total Records",
              value: records.length,
              icon: <BarChart2 className="w-4 h-4" />,
              color: "text-[#10a37f]",
              bg: "bg-[#10a37f]/10",
              suffix: "all-time logs",
            },
          ]}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-[#1f1f1f] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 uppercase tracking-wide">
              <BarChart2 className="w-4 h-4 text-[#10a37f]" />
              7-Day Feed Consumption (kg)
            </h2>
            <div className="h-56 w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.barData}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorQuantity"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10a37f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10a37f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    stroke="#10a37f"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorQuantity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white dark:bg-[#1f1f1f] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 uppercase tracking-wide">
              <Activity className="w-4 h-4 text-amber-500" />
              Feed Type Distribution
            </h2>
            <div className="h-56 w-full mt-auto">
              {chartData.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(
                        value:
                          | number
                          | string
                          | readonly (number | string)[]
                          | undefined
                          | null,
                      ) => {
                        const numValue = Array.isArray(value)
                          ? value[0]
                          : value;
                        return [
                          `${Number(numValue || 0).toFixed(1)} kg`,
                          "Quantity",
                        ];
                      }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                  No data to display
                </div>
              )}
            </div>
          </div>

          {/* Feeding Coverage Visual */}
          <div className="lg:col-span-1 bg-white dark:bg-[#1f1f1f] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 uppercase tracking-wide">
              <Activity className="w-4 h-4 text-[#10a37f]" />
              Feeding Coverage (Today)
            </h2>
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coverageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {coverageData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COVERAGE_COLORS[index % COVERAGE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value || 0} animals`, "Count"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {feedingPercentage}%
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-400">
                  Fed
                </span>
              </div>
            </div>
            
            <div className="mt-auto pt-2 text-xs flex justify-between text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col">
                <span className="font-bold text-[#10a37f]">{animalsFed} Fed</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="font-bold text-gray-400">{animalsNotFed} Not Fed</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold text-gray-900 dark:text-gray-200">{totalAnimals} Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Recent Feeding Activity
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tag, animal, feed type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-[#141414] text-gray-500 font-bold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Animal</th>
                  <th className="p-4">Feed Type</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Logged By</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                      Loading records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-[#222] flex items-center justify-center mx-auto mb-3">
                        <Utensils className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                        No feeding records found
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        You haven&apos;t logged any feeding events yet, or no
                        records match your search.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedAnimalId(null);
                          setIsFeedingModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-bold rounded-xl"
                      >
                        <Utensils className="w-4 h-4" />
                        Log First Feeding
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {new Date(record.fedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(record.fedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px]">
                            {record.animal?.animalNumber.slice(-3)}
                          </span>
                          {record.animal?.animalNumber}
                        </div>
                        {record.animal?.name && (
                          <div className="text-xs text-gray-500 ml-8">
                            {record.animal.name}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300 font-medium text-xs">
                          {record.feedType?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-gray-900 dark:text-white">
                          {record.quantity}{" "}
                          {record.unit || record.feedType?.unit || "kg"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                          {record.recordedBy?.firstName}{" "}
                          {record.recordedBy?.lastName}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          className="text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors"
                          onClick={() => {
                            setSelectedAnimalId(record.animalId);
                            setIsFeedingModalOpen(true);
                          }}
                        >
                          Log Again
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimalFeedingModal
        isOpen={isFeedingModalOpen}
        onClose={() => setIsFeedingModalOpen(false)}
        animalId={selectedAnimalId}
        onSuccess={() => {
          setIsFeedingModalOpen(false);
          fetchRecords();
        }}
      />
    </DashboardLayout>
  );
}
