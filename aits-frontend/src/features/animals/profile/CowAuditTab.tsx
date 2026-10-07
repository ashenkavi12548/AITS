import React from "react";
import { History } from "lucide-react";
import { AnimalHistoryItem } from "@/services/animals.service";
import { HumanAuditTimeline } from "./HumanAuditTimeline";

interface CowAuditTabProps {
  history: AnimalHistoryItem[];
}

export function CowAuditTab({ history }: CowAuditTabProps) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#10a37f]" />
            <span>Complete Identity &amp; Lifecycle Audit Trail</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable timeline of all state changes, identity updates, and tag
            issuances.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
          {history.length} Events Verified
        </span>
      </div>

      <HumanAuditTimeline logs={history} />
    </div>
  );
}
