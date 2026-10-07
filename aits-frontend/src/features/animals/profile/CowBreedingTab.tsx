import React from "react";
import Link from "next/link";
import { Dna, RefreshCw } from "lucide-react";
import { AnimalDetailResponse } from "@/services/animals.service";
import { BreedingRecord } from "@/types/breeding";

interface CowBreedingTabProps {
  animal: AnimalDetailResponse;
  breedingRecords: BreedingRecord[];
  isLoadingBreeding: boolean;
  loadBreedingData: (animalNumber: string) => Promise<void>;
  setIsBreedingModalOpen: (open: boolean) => void;
}

export function CowBreedingTab({
  animal,
  breedingRecords,
  isLoadingBreeding,
  loadBreedingData,
  setIsBreedingModalOpen,
}: CowBreedingTabProps) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Dna className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Breeding &amp; Genetics Ledger
            </h3>
            <p className="text-xs text-gray-500">
              Artificial insemination straws, estrus cycles &amp; pedigree for #
              {animal.animalNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void loadBreedingData(animal.animalNumber)}
            disabled={isLoadingBreeding}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 hover:border-gray-400 rounded-xl transition-all cursor-pointer"
            title="Refresh breeding records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingBreeding ? "animate-spin text-amber-500" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {animal.gender === "FEMALE" && (
            <button
              type="button"
              onClick={() => setIsBreedingModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs shadow-amber-600/20 cursor-pointer"
            >
              <Dna className="w-4 h-4" />
              <span>Log Breeding Service</span>
            </button>
          )}

          <Link
            href={`/breeding?animalId=${animal.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
          >
            <span>Breeding Module &rarr;</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            AI Services &amp; Straws
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block">
            {breedingRecords.length ||
              (animal.moduleCounts?.femaleBreedingRecords || 0) +
                (animal.moduleCounts?.maleBreedingRecords || 0)}
          </span>
          <p className="text-xs text-gray-500">
            Total artificial insemination records and reproductive services.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Registered Descendants
          </span>
          <span className="text-2xl font-black text-[#0d0d0d] dark:text-white block">
            {animal.offspringCount} Calves
          </span>
          <p className="text-xs text-gray-500">
            Direct genetic lineage verified in national herd database.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Genomic Heritage
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
            {animal.breed} Lineage
          </span>
          <p className="text-xs text-gray-500">
            Sire &amp; dam verified with tamper-proof parentage linkage.
          </p>
        </div>
      </div>

      {/* Live Breeding Services Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Insemination &amp; Breeding Records ({breedingRecords.length})
          </h4>
          <span className="text-[11px] text-gray-400">
            Updated in real-time
          </span>
        </div>

        {isLoadingBreeding ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-medium">
              Loading breeding records...
            </span>
          </div>
        ) : breedingRecords.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-3">
            <Dna className="w-10 h-10 mx-auto text-amber-500/40" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              No AI services or breeding entries recorded for this cow yet.
            </p>
            {animal.gender === "FEMALE" && (
              <button
                type="button"
                onClick={() => setIsBreedingModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Dna className="w-4 h-4" />
                <span>Log First Breeding Service</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#1f1f1f] text-gray-500 font-bold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="p-3.5">Service Date</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Semen Straw / Sire Code</th>
                  <th className="p-3.5">AI Specialist</th>
                  <th className="p-3.5">Estrus Heat Signs</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {breedingRecords.map((br) => (
                  <tr
                    key={br.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#232323]/50 transition-colors"
                  >
                    <td className="p-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {new Date(br.serviceDate).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {br.serviceMethod === "ARTIFICIAL_INSEMINATION"
                          ? "Artificial Insem (AI)"
                          : "Natural Bull"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                      {br.semenStrawId || br.bullTag || "—"}
                    </td>
                    <td className="p-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {br.technician || "—"}
                    </td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {br.notes || "—"}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300">
                        {br.status}
                      </span>
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
