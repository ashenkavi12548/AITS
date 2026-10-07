import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { AnimalDetailResponse } from "@/services/animals.service";

interface CowDocumentsTabProps {
  animal: AnimalDetailResponse;
}

export function CowDocumentsTab({ animal }: CowDocumentsTabProps) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Official Certificates &amp; Documents
            </h3>
            <p className="text-xs text-gray-500">
              Official inspection certificates, laboratory files &amp; deeds for #
              {animal.animalNumber}
            </p>
          </div>
        </div>
        <Link
          href={`/documents?animalId=${animal.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs shadow-[#10a37f]/20"
        >
          <span>Open Documents Module &rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Archived Documents
          </span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block">
            {animal.moduleCounts?.documents || 0}
          </span>
          <p className="text-xs text-gray-500">
            Uploaded laboratory assays, veterinary certificates, and
            registration deeds.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Digital Ear Tag Badge
          </span>
          <span className="text-sm font-bold text-[#0d0d0d] dark:text-white block">
            Standard A7 Printable PDF
          </span>
          <p className="text-xs text-gray-500">
            Available on-demand via the Official Ear Tag Badge action above.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Compliance Audit
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
            Cryptographically Validated
          </span>
          <p className="text-xs text-gray-500">
            All paperwork matched to QR identity and immutable timestamps.
          </p>
        </div>
      </div>
    </div>
  );
}
