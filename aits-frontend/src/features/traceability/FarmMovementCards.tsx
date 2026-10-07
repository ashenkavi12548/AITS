'use client';

import React from 'react';
import { Truck, Clock, CheckCircle2, Navigation, AlertTriangle } from 'lucide-react';
import { FarmMovement } from '@/types/traceability.types';

interface FarmMovementCardsProps {
  movements: FarmMovement[];
  isLoading: boolean;
}

export const FarmMovementCards: React.FC<FarmMovementCardsProps> = ({ movements, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 md:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#212121] p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between h-28 animate-pulse"
          >
            <div className="h-3 w-16 bg-[#f0f0f0] dark:bg-[#383838] rounded-md" />
            <div className="h-7 w-12 bg-[#f0f0f0] dark:bg-[#383838] rounded-md mt-2" />
          </div>
        ))}
      </div>
    );
  }

  const total = movements.length;
  const scheduled = movements.filter((m) => m.status === 'SCHEDULED').length;
  const inTransit = movements.filter((m) => m.status === 'IN_TRANSIT').length;
  const arrived = movements.filter((m) => m.status === 'ARRIVED').length;
  const completed = movements.filter((m) => m.status === 'COMPLETED').length;

  const items = [
    { label: 'Total Movements', value: total, icon: Truck, color: '#10a37f' },
    { label: 'Scheduled', value: scheduled, icon: Clock, color: '#f59e0b' },
    { label: 'In Transit', value: inTransit, icon: Navigation, color: '#2563eb' },
    { label: 'Arrived', value: arrived, icon: AlertTriangle, color: '#8b5cf6' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: '#166534' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 md:gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-[#212121] p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#737373] dark:text-[#8e8e8e] truncate">
                {item.label}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.color}15`, color: item.color }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                {item.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
