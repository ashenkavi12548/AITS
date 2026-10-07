import React from "react";
import { Utensils, RefreshCw } from "lucide-react";
import { AnimalDetailResponse } from "@/services/animals.service";
import { FeedingRecord } from "@/services/feeding.service";

interface CowFeedingTabProps {
  animal: AnimalDetailResponse;
  feedingRecords: FeedingRecord[];
  isLoadingFeeding: boolean;
  loadFeedingData: () => Promise<void>;
  setIsFeedingModalOpen: (open: boolean) => void;
}

export function CowFeedingTab({
  animal,
  feedingRecords,
  isLoadingFeeding,
  loadFeedingData,
  setIsFeedingModalOpen,
}: CowFeedingTabProps) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Feeding & Nutrition
            </h3>
            <p className="text-xs text-gray-500">
              Diet rations and forage consumption for #{animal.animalNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void loadFeedingData()}
            disabled={isLoadingFeeding}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 hover:border-gray-400 rounded-xl transition-all cursor-pointer"
            title="Refresh feeding records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingFeeding ? "animate-spin text-amber-500" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFeedingModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 rounded-xl transition-all shadow-xs shadow-amber-400/20 cursor-pointer"
          >
            <Utensils className="w-4 h-4" />
            <span>Log Feeding</span>
          </button>
        </div>
      </div>

      {/* Feeding KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Total Feeding Records
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block">
            {feedingRecords.length}
          </span>
          <p className="text-xs text-gray-500">Total nutrition logs recorded.</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Total Feed Intake (Logged)
          </span>
          <span className="text-2xl font-black text-[#0d0d0d] dark:text-white block">
            {feedingRecords
              .reduce((acc, a) => acc + (Number(a.quantity) || 0), 0)
              .toFixed(1)}{" "}
            kg
          </span>
          <p className="text-xs text-gray-500">
            Nutrient intake across verified feeding sessions.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Latest Feed Type
          </span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 block">
            {feedingRecords.length > 0
              ? feedingRecords[0].feedType?.name
              : "—"}
          </span>
          <p className="text-xs text-gray-500">
            Most recently recorded ration.
          </p>
        </div>
      </div>

      {/* Live Feeding Records Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Nutrition & Feeding Log ({feedingRecords.length})
          </h4>
          <span className="text-[11px] text-gray-400">
            Updated in real-time
          </span>
        </div>

        {isLoadingFeeding ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-medium">
              Loading feeding records...
            </span>
          </div>
        ) : feedingRecords.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-3">
            <Utensils className="w-10 h-10 mx-auto text-amber-500/40" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              No feeding sessions logged for this animal yet.
            </p>
            <button
              type="button"
              onClick={() => setIsFeedingModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Utensils className="w-4 h-4" />
              <span>Log First Feeding</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#1f1f1f] text-gray-500 font-bold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Feed Type</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Logged By</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {feedingRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#232323]/50 transition-colors"
                  >
                    <td className="p-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div>
                        {new Date(record.fedAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(record.fedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-3.5 text-gray-700 dark:text-gray-300">
                      <span className="font-bold">
                        {record.feedType?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-gray-900 dark:text-white whitespace-nowrap">
                      <span>
                        {record.quantity}{" "}
                        {record.unit || record.feedType?.unit || "kg"}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {record.recordedBy?.firstName}{" "}
                      {record.recordedBy?.lastName}
                    </td>
                    <td className="p-3.5 text-gray-500 max-w-xs truncate">
                      {record.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
