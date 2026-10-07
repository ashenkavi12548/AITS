"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TriangleAlert,
  ShieldAlert,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnimalsRequiringAttention } from "@/hooks/use-dashboard";
import { dashboardService } from "@/services/dashboard.service";
import { AnimalAttentionItem } from "@/types/dashboard";
import AnimalPhoto from "@/components/common/AnimalPhoto";

export default function AnimalsAttentionTable() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useAnimalsRequiringAttention();
  const [selectedItem, setSelectedItem] = useState<AnimalAttentionItem | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  const items = data?.items ?? [];
  const summary = data?.summary ?? { high: 0, medium: 0, low: 0 };

  const getPriorityBadge = (priority: "High" | "Medium" | "Low") => {
    switch (priority) {
      case "High":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Low":
        return "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20";
    }
  };

  const handleResolveAlert = async () => {
    if (selectedItem) {
      try {
        await dashboardService.resolveAttentionAlert(selectedItem.id);
      } catch {}
    }
    setIsResolved(true);
    setTimeout(() => {
      setIsResolved(false);
      setSelectedItem(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }, 900);
  };

  return (
    <>
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-full transition-colors duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e5e5] dark:border-[#383838] mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs">
              <TriangleAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white tracking-tight">
                Urgent Attention
              </h2>
              <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">
                Actionable health & quarantine alerts
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
            {items.length} Pending
          </span>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-x-auto min-h-45 no-scrollbar">
          {isLoading ? (
            <div className="space-y-2 animate-pulse pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 bg-[#f0f0f0] dark:bg-[#383838] rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-[#737373] dark:text-[#8e8e8e]">
              <ShieldAlert className="w-6 h-6 text-rose-500 mb-1" />
              <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
                Unable to load attention alerts
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#737373] dark:text-[#8e8e8e] my-auto">
              <CheckCircle2 className="w-7 h-7 text-[#10a37f]/50 mb-2" />
              <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
                All animals in optimal condition
              </p>
              <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                No health flags or quarantine issues pending.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#e5e5e5] dark:border-[#383838] text-[#737373] dark:text-[#8e8e8e] font-medium text-[11px] uppercase">
                  <th className="pb-2 pl-2">Animal</th>
                  <th className="pb-2">Issue / Alert</th>
                  <th className="pb-2 text-right pr-2">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#383838]">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-[#f4f4f4] dark:hover:bg-[#383838]/60 transition-colors cursor-pointer group rounded-lg"
                  >
                    <td className="py-2.5 pl-2 font-medium text-[#0d0d0d] dark:text-white">
                      <div className="flex items-center gap-2.5 group-hover:opacity-80 transition-opacity">
                        <AnimalPhoto 
                          src={item.imageUrl} 
                          animalNumber={item.animalNumber} 
                          species={item.species || undefined} 
                          showBadge={false} 
                          className="w-8 h-8 rounded-lg border border-[#e5e5e5] dark:border-[#444] shrink-0" 
                        />
                        <div>
                          <div className="font-semibold group-hover:text-[#10a37f] transition-colors">#{item.animalNumber}</div>
                          <div className="text-[10px] text-[#737373] dark:text-[#8e8e8e]">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-[#0d0d0d] dark:text-[#ececec] truncate max-w-xs">
                      {item.issue}
                    </td>
                    <td className="py-2.5 text-right pr-2">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10.5px] font-bold rounded-full border ${getPriorityBadge(
                          item.priority,
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Attention Summary Bar at Bottom */}
        <div className="pt-3 border-t border-[#e5e5e5] dark:border-[#383838] mt-3 flex items-center justify-between text-[12px]">
          <span className="font-medium text-[#737373] dark:text-[#8e8e8e] text-[11px] uppercase">
            Priority Breakdown:
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-semibold text-[#0d0d0d] dark:text-white">{summary.high}</span>
              <span className="text-[#737373] dark:text-[#8e8e8e] text-[11px]">High</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-[#0d0d0d] dark:text-white">{summary.medium}</span>
              <span className="text-[#737373] dark:text-[#8e8e8e] text-[11px]">Med</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10a37f]" />
              <span className="font-semibold text-[#0d0d0d] dark:text-white">{summary.low}</span>
              <span className="text-[#737373] dark:text-[#8e8e8e] text-[11px]">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Animal Attention Action Popover Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                  <TriangleAlert className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white">
                    Veterinary Alert
                  </h3>
                  <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">
                    Tag #{selectedItem.animalNumber} • {selectedItem.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-[#737373] dark:text-[#8e8e8e] hover:bg-[#ececec] dark:hover:bg-[#383838] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isResolved ? (
              <div className="p-6 text-center flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#10a37f] animate-bounce" />
                <h4 className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white">Alert Marked as Resolved!</h4>
                <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">Updated veterinary medical record.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-[#f4f4f4] dark:bg-[#212121] rounded-xl border border-[#e5e5e5] dark:border-[#383838] space-y-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#737373] dark:text-[#8e8e8e]">Priority Level:</span>
                    <span
                      className={`px-2 py-0.5 text-[10.5px] font-bold rounded-full border ${getPriorityBadge(
                        selectedItem.priority,
                      )}`}
                    >
                      {selectedItem.priority} Priority
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737373] dark:text-[#8e8e8e]">Flagged Medical Issue:</span>
                    <p className="font-semibold text-[#0d0d0d] dark:text-white mt-0.5">{selectedItem.issue}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleResolveAlert}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Issue as Resolved
                  </button>
                  <Link
                    href={`/animals`}
                    onClick={() => setSelectedItem(null)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-[#0d0d0d] dark:text-[#ececec] bg-[#f4f4f4] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] hover:bg-[#ececec] dark:hover:bg-[#383838] rounded-xl transition-all"
                  >
                    <span>View Full Medical History</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
