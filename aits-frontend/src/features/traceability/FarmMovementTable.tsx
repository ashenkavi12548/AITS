"use client";

import React from "react";
import Link from "next/link";
import { Tag, ArrowRight } from "lucide-react";
import { FarmMovement } from "@/types/traceability.types";
import {
  MOVEMENT_STATUS_LABELS,
  MOVEMENT_REASON_LABELS,
} from "@/constants/traceability.constants";
import AnimalPhoto from "@/components/common/AnimalPhoto";

interface FarmMovementTableProps {
  movements: FarmMovement[];
  isLoading: boolean;
  canManage: boolean;
  onOpenActionsModal: (movement: FarmMovement) => void;
}

export const FarmMovementTable: React.FC<FarmMovementTableProps> = ({
  movements,
  isLoading,
  canManage: _canManage,
  onOpenActionsModal,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-[#f0f0f0] dark:bg-[#303030] rounded-md" />
        <div className="h-40 bg-[#f0f0f0] dark:bg-[#303030] rounded-xl" />
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] p-12 text-center">
        <p className="text-sm font-semibold text-[#0d0d0d] dark:text-white">
          No farm movements found
        </p>
        <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1">
          Record a new farm-to-farm relocation or adjust your search.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-[#303030] bg-[#f9f9f9] dark:bg-[#282828] text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
              <th className="py-3 px-4">Animal</th>
              <th className="py-3 px-4">From → To Farm</th>
              <th className="py-3 px-4">Departure</th>
              <th className="py-3 px-4">Expected Arrival</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#2d2d2d] text-xs">
            {movements.map((mov) => {
              const statusBadge = MOVEMENT_STATUS_LABELS[mov.status] || {
                label: mov.status,
                bg: "bg-gray-100",
                text: "text-gray-800",
              };

              return (
                <tr
                  key={mov.id}
                  className="hover:bg-[#f9f9f9] dark:hover:bg-[#282828] transition-colors"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Link
                      href={`/traceability/lifetime/${mov.animalId}`}
                      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                    >
                      <AnimalPhoto
                        src={mov.imageUrl}
                        animalNumber={mov.animalTag}
                        species={mov.species || undefined}
                        showBadge={false}
                        className="w-8 h-8 rounded-lg border border-[#e5e5e5] dark:border-[#444] shrink-0"
                      />
                      <div>
                        <div className="font-bold text-[#10a37f] flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>{mov.animalTag}</span>
                        </div>
                        <div className="text-[10px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                          {mov.animalName}
                        </div>
                      </div>
                    </Link>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-medium text-[#0d0d0d] dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[#5d5d5d] dark:text-[#b4b4b4] truncate max-w-30"
                        title={mov.fromFarmName}
                      >
                        {mov.fromFarmName}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#10a37f] shrink-0" />
                      <span
                        className="font-semibold text-[#0d0d0d] dark:text-white truncate max-w-30"
                        title={mov.toFarmName}
                      >
                        {mov.toFarmName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-[#5d5d5d] dark:text-[#b4b4b4]">
                    {mov.departureDate} ({mov.departureTime})
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-[#5d5d5d] dark:text-[#b4b4b4]">
                    {mov.actualArrivalDate
                      ? `${mov.actualArrivalDate} (${mov.actualArrivalTime})`
                      : `${mov.expectedArrivalDate} (${mov.expectedArrivalTime})`}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-medium text-[#0d0d0d] dark:text-white">
                    {MOVEMENT_REASON_LABELS[mov.reason] || mov.reason}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text}`}
                    >
                      {statusBadge.label}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => onOpenActionsModal(mov)}
                      className="px-3 py-1.5 bg-[#f9f9f9] dark:bg-[#2d2d2d] hover:bg-[#ececec] border border-[#e5e5e5] dark:border-[#383838] text-[11px] font-semibold text-[#0d0d0d] dark:text-white rounded-xl transition-all cursor-pointer"
                    >
                      Manage Status
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
