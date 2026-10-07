'use client';

import { PawPrint, HeartPulse, ShieldAlert, Activity } from 'lucide-react';
import type { HerdStatsResponse } from '@/types/animals';

interface HerdStatsCardsProps {
  stats: HerdStatsResponse | null | undefined;
  isLoading: boolean;
}

interface StatCard {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function StatSkeleton() {
  return (
    <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e2e8f0] dark:border-[#333333] p-4 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

export function HerdStatsCards({ stats, isLoading }: HerdStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards: StatCard[] = [
    {
      label: 'Total Herd',
      value: stats?.totalAnimals,
      icon: <PawPrint className="w-4 h-4" />,
      color: 'text-[#10a37f]',
      bg: 'bg-[#10a37f]/10',
    },
    {
      label: 'Active',
      value: stats?.activeAnimals,
      icon: <Activity className="w-4 h-4" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Quarantined',
      value: stats?.quarantinedAnimals,
      icon: <ShieldAlert className="w-4 h-4" />,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      label: 'Sold',
      value: stats?.soldAnimals,
      icon: <HeartPulse className="w-4 h-4" />,
      color: 'text-[#10a37f] dark:text-[#12b88f]',
      bg: 'bg-[#10a37f]/10',
    },
    {
      label: 'Transferred',
      value: stats?.transferredAnimals,
      icon: <Activity className="w-4 h-4" />,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Deceased',
      value: stats?.deceasedAnimals,
      icon: <HeartPulse className="w-4 h-4" />,
      color: 'text-zinc-500',
      bg: 'bg-zinc-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e2e8f0] dark:border-[#333333] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
              {card.icon}
            </span>
          </div>
          <p className="text-[11px] font-medium text-[#64748b] dark:text-[#94a3b8]">
            {card.label}
          </p>
          <p className={`text-2xl font-bold mt-0.5 ${card.color}`}>
            {card.value ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}
