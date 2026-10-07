import React from 'react';

export interface StatCardData {
  label: string;
  value: string | number | React.ReactNode;
  icon: React.ReactNode;
  color: string;
  bg: string;
  suffix?: string;
}

interface StatsCardsProps {
  cards: StatCardData[];
  isLoading?: boolean;
}

export function StatsCards({ cards, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(cards.length || 4, 6)} gap-3`}>
        {Array.from({ length: cards.length || 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e2e8f0] dark:border-[#333333] p-4 animate-pulse">
            <div className="h-6 w-6 bg-gray-200 dark:bg-[#333333] rounded-lg mb-3" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-[#333333] rounded mb-2" />
            <div className="h-6 w-12 bg-gray-200 dark:bg-[#333333] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(cards.length, 6)} gap-3`}>
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-[#242424] rounded-xl border border-[#e2e8f0] dark:border-[#333333] p-3 flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`p-1 rounded-lg ${card.bg} ${card.color}`}>
              {card.icon}
            </span>
          </div>
          <p className="text-[10px] font-medium text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wider line-clamp-1">
            {card.label}
          </p>
          <div className={`text-lg font-bold mt-0.5 flex items-baseline gap-1 ${card.color}`}>
            {card.value ?? 0}
            {card.suffix && <span className="text-[10px] opacity-70 font-semibold">{card.suffix}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
