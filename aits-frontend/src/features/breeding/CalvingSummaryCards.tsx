'use client';

import React from 'react';
import { Baby, Clock, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { CalvingSummaryStats } from '@/types/breeding';
import { StatsCards } from '@/components/common/StatsCards';

interface CalvingSummaryCardsProps {
  stats: CalvingSummaryStats | null;
  isLoading: boolean;
}

export const CalvingSummaryCards: React.FC<CalvingSummaryCardsProps> = ({ stats, isLoading }) => {
  const items = [
    {
      label: 'Expected This Week',
      value: stats?.expectedThisWeek ?? 0,
      unit: 'Births',
      icon: Baby,
    },
    {
      label: 'Expected This Month',
      value: stats?.expectedThisMonth ?? 0,
      unit: 'Calves',
      icon: Clock,
    },
    {
      label: 'Completed Calvings',
      value: stats?.completedCalvings ?? 0,
      unit: 'Births',
      icon: CheckCircle2,
    },
    {
      label: 'Overdue Calvings',
      value: stats?.overdueCalvings ?? 0,
      unit: 'Cows',
      icon: AlertTriangle,
    },
    {
      label: 'Complications',
      value: stats?.complicatedCalvings ?? 0,
      unit: 'Cases',
      icon: ShieldAlert,
    },
  ];

  return (
    <StatsCards
      isLoading={isLoading}
      cards={items.map((card) => {
        const Icon = card.icon;
        
        let colorCls = '';
        let bgCls = '';
        
        switch (card.label) {
          case 'Expected This Week':
            colorCls = 'text-sky-600 dark:text-sky-400';
            bgCls = 'bg-sky-100 dark:bg-sky-500/10';
            break;
          case 'Expected This Month':
            colorCls = 'text-amber-600 dark:text-amber-400';
            bgCls = 'bg-amber-100 dark:bg-amber-500/10';
            break;
          case 'Completed Calvings':
            colorCls = 'text-[#10a37f]';
            bgCls = 'bg-[#10a37f]/10';
            break;
          case 'Overdue Calvings':
            colorCls = 'text-red-600 dark:text-red-400';
            bgCls = 'bg-red-100 dark:bg-red-500/10';
            break;
          case 'Complications':
            colorCls = 'text-purple-600 dark:text-purple-400';
            bgCls = 'bg-purple-100 dark:bg-purple-500/10';
            break;
        }

        return {
          label: card.label,
          value: card.value,
          icon: <Icon className="w-4 h-4" />,
          color: colorCls,
          bg: bgCls,
          suffix: card.unit,
        };
      })}
    />
  );
};
