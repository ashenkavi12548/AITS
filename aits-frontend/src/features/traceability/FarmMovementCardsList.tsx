'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import { FarmMovement } from '@/types/traceability.types';
import { MOVEMENT_STATUS_LABELS, MOVEMENT_REASON_LABELS } from '@/constants/traceability.constants';
import AnimalPhoto from '@/components/common/AnimalPhoto';

interface FarmMovementCardsListProps {
  movements: FarmMovement[];
  isLoading: boolean;
  onOpenActionsModal: (movement: FarmMovement) => void;
}

export const FarmMovementCardsList: React.FC<FarmMovementCardsListProps> = ({
  movements,
  isLoading,
  onOpenActionsModal,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030]" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) return null;

  return (
    <div className="space-y-3">
      {movements.map((mov) => {
        const badge = MOVEMENT_STATUS_LABELS[mov.status];
        return (
          <div
            key={mov.id}
            className="bg-white dark:bg-[#2f2f2f] p-5 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-sm hover:shadow-md transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Animal Photo */}
              <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-xs border border-[#e5e5e5] dark:border-[#444]">
                <AnimalPhoto 
                  src={mov.imageUrl} 
                  animalNumber={mov.animalTag} 
                  species={mov.species} 
                  showBadge={false} 
                  className="w-full h-full"
                />
                <div className="absolute -top-1 -right-1">
                  <div
                    className={`w-7 h-7 rounded-bl-lg rounded-tr-lg ${badge.bg} ${badge.text} flex items-center justify-center border-b border-l shadow-xs backdrop-blur-sm bg-opacity-90`}
                    title={`Status: ${badge.label}`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Movement Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/traceability/lifetime/${mov.animalId}`}
                      className="text-[14px] font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] transition-colors"
                    >
                      #{mov.animalTag} <span className="text-[12px] font-medium text-[#737373] ml-1">({mov.animalName})</span>
                    </Link>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0d0d0d] dark:text-white mt-2">
                    <span className="truncate">{mov.fromFarmName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#10a37f] shrink-0" />
                    <span className="truncate">{mov.toFarmName}</span>
                  </div>

                  <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-2 space-y-1">
                    <div>Reason: <strong className="text-[#0d0d0d] dark:text-[#ececec]">{MOVEMENT_REASON_LABELS[mov.reason]}</strong></div>
                    <div>Departure: {mov.departureDate} <span className="opacity-70">({mov.departureTime})</span></div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-[#f0f0f0] dark:border-[#383838]">
                  <button
                    onClick={() => onOpenActionsModal(mov)}
                    className="w-full py-2 bg-[#f9f9f9] hover:bg-[#f0f0f0] dark:bg-[#252525] dark:hover:bg-[#303030] border border-[#e5e5e5] dark:border-[#444] text-[12px] font-bold text-[#0d0d0d] dark:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Manage Status & Actions
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
