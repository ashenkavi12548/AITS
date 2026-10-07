import React from "react";
import Link from "next/link";
import { Milk, RefreshCw } from "lucide-react";
import { AnimalDetailResponse } from "@/services/animals.service";
import { ProductionRecord } from "@/types/production";

interface CowProductionTabProps {
  animal: AnimalDetailResponse;
  productionRecords: ProductionRecord[];
  isLoadingProduction: boolean;
  loadProductionData: () => Promise<void>;
  setIsProductionModalOpen: (open: boolean) => void;
}

export function CowProductionTab({
  animal,
  productionRecords,
  isLoadingProduction,
  loadProductionData,
  setIsProductionModalOpen,
}: CowProductionTabProps) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/20">
            <Milk className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Milk Yield &amp; Lactation Performance
            </h3>
            <p className="text-xs text-gray-500">
              Yield monitoring, laboratory assays &amp; milking session logs for
              #{animal.animalNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void loadProductionData()}
            disabled={isLoadingProduction}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 hover:border-gray-400 rounded-xl transition-all cursor-pointer"
            title="Refresh production records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingProduction ? "animate-spin text-sky-500" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProductionModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs shadow-sky-600/20 cursor-pointer"
          >
            <Milk className="w-4 h-4" />
            <span>Log Milk Yield</span>
          </button>

          <Link
            href={`/production?animalId=${animal.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#444] rounded-xl transition-all"
          >
            <span>Production Module &rarr;</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Logged Milking Sessions
          </span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 block">
            {productionRecords.length ||
              animal.moduleCounts?.milkProduction ||
              0}
          </span>
          <p className="text-xs text-gray-500">
            Total production sessions captured on farm meters and scales.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Cumulative Yield (Recent Logs)
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
            {productionRecords
              .reduce((acc, r) => acc + (Number(r.quantityLiters) || 0), 0)
              .toFixed(1)}{" "}
            L
          </span>
          <p className="text-xs text-gray-500">
            {productionRecords.length > 0
              ? `Average ${(
                  productionRecords.reduce(
                    (acc, r) => acc + (Number(r.quantityLiters) || 0),
                    0,
                  ) / productionRecords.length
                ).toFixed(1)} L per session.`
              : "Ready for session log entry."}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Animal Role &amp; Quality
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
            {animal.gender === "FEMALE"
              ? "Dairy Lactation (Grade A)"
              : "Sire Breeding Lineage"}
          </span>
          <p className="text-xs text-gray-500">
            {animal.gender === "FEMALE"
              ? "Active milking eligibility verified."
              : "Lineage tracking only."}
          </p>
        </div>
      </div>

      {/* Live Milk Yield Records Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Recent Milking Sessions ({productionRecords.length})
          </h4>
          <span className="text-[11px] text-gray-400">
            Updated in real-time
          </span>
        </div>

        {isLoadingProduction ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
            <span className="text-xs font-medium">Loading milk records...</span>
          </div>
        ) : productionRecords.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-3">
            <Milk className="w-10 h-10 mx-auto text-sky-500/40" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              No milk yield entries recorded for this cow yet.
            </p>
            <button
              type="button"
              onClick={() => setIsProductionModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Milk className="w-4 h-4" />
              <span>Log First Milk Yield</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#1f1f1f] text-gray-500 font-bold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="p-3.5">Milking Date</th>
                  <th className="p-3.5">Session</th>
                  <th className="p-3.5">Yield (Liters)</th>
                  <th className="p-3.5">Quality Grading</th>
                  <th className="p-3.5">Recorded By</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {productionRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#232323]/50 transition-colors"
                  >
                    <td className="p-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {new Date(rec.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {rec.session}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-sky-600 dark:text-sky-400 whitespace-nowrap text-sm">
                      {Number(rec.quantityLiters).toFixed(1)} L
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          rec.qualityStatus === "ACCEPTED"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                            : rec.qualityStatus === "REJECTED"
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200"
                        }`}
                      >
                        {rec.qualityStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap text-[11px]">
                      {rec.recordedBy || "Operator"}
                    </td>
                    <td className="p-3.5 text-gray-500 max-w-xs truncate">
                      {rec.notes || "—"}
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
