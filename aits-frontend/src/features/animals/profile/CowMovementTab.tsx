import React from "react";
import Link from "next/link";
import { Route, RefreshCw } from "lucide-react";
import { AnimalDetailResponse } from "@/services/animals.service";
import { FarmMovement } from "@/types/traceability.types";

interface CowMovementTabProps {
  animal: AnimalDetailResponse;
  farmMovements: FarmMovement[];
  isLoadingMovements: boolean;
  loadMovementsData: () => Promise<void>;
  setIsMovementModalOpen: (open: boolean) => void;
}

export function CowMovementTab({
  animal,
  farmMovements,
  isLoadingMovements,
  loadMovementsData,
  setIsMovementModalOpen,
}: CowMovementTabProps) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Movements, Permits &amp; Biosecurity Checkpoints
            </h3>
            <p className="text-xs text-gray-500">
              Dispatch permits, inter-facility transit &amp; relocation permits
              for #{animal.animalNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void loadMovementsData()}
            disabled={isLoadingMovements}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 hover:border-gray-400 rounded-xl transition-all cursor-pointer"
            title="Refresh movements"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingMovements ? "animate-spin text-purple-500" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMovementModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs shadow-purple-600/20 cursor-pointer"
          >
            <Route className="w-4 h-4" />
            <span>Record Movement</span>
          </button>

          <Link
            href={`/movement?animalId=${animal.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs"
          >
            <span>Movement Module &rarr;</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Recorded Movements
          </span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block">
            {farmMovements.length || animal.moduleCounts?.movements || 0}
          </span>
          <p className="text-xs text-gray-500">
            Registered transit logs, dispatch permits and checkpoint scans.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Current Facility
          </span>
          <span className="text-sm font-bold text-[#0d0d0d] dark:text-white block truncate">
            {animal.farm?.name || "Central Facility"}
          </span>
          <p className="text-xs text-gray-500">
            {animal.farm?.city || "Central"},{" "}
            {animal.farm?.province || "Province"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Transit Biosecurity
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
            Permitted for Transport
          </span>
          <p className="text-xs text-gray-500">
            No epidemiological travel restrictions or quarantine lockdowns.
          </p>
        </div>
      </div>

      {/* Live Farm Movements Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Transit &amp; Relocation History ({farmMovements.length})
          </h4>
          <span className="text-[11px] text-gray-400">
            Updated in real-time
          </span>
        </div>

        {isLoadingMovements ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
            <span className="text-xs font-medium">Loading movements...</span>
          </div>
        ) : farmMovements.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-3">
            <Route className="w-10 h-10 mx-auto text-purple-500/40" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              No farm movement records logged for this animal yet.
            </p>
            <button
              type="button"
              onClick={() => setIsMovementModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Route className="w-4 h-4" />
              <span>Schedule Farm Movement</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#1f1f1f] text-gray-500 font-bold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="p-3.5">Departure Date</th>
                  <th className="p-3.5">Route (From &rarr; To)</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Transit Status</th>
                  <th className="p-3.5">Transport Info</th>
                  <th className="p-3.5">Expected Arrival</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {farmMovements.map((mov) => (
                  <tr
                    key={mov.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#232323]/50 transition-colors"
                  >
                    <td className="p-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div>{mov.departureDate}</div>
                      <div className="text-[10px] text-gray-400">
                        {mov.departureTime}
                      </div>
                    </td>
                    <td className="p-3.5 text-gray-800 dark:text-gray-200">
                      <span className="font-semibold">{mov.fromFarmName}</span>
                      <span className="text-gray-400 mx-1.5">&rarr;</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {mov.toFarmName}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {mov.reason.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          mov.status === "COMPLETED" || mov.status === "ARRIVED"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                            : mov.status === "IN_TRANSIT"
                              ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200"
                        }`}
                      >
                        {mov.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-300 text-[11px] whitespace-nowrap">
                      {mov.vehicleNumber ? (
                        <div>
                          <span className="font-mono font-bold">
                            {mov.vehicleNumber}
                          </span>
                          {mov.driverName && (
                            <span className="text-gray-400 block">
                              {mov.driverName}
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3.5 text-gray-500 whitespace-nowrap">
                      {mov.expectedArrivalDate} {mov.expectedArrivalTime}
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
