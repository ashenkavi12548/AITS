'use client';

import React from 'react';
import { CalendarCheck, Clock, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { PregnancySummaryStats } from '@/types/breeding';
import { StatsCards } from '@/components/common/StatsCards';

interface PregnancySummaryCardsProps {
  stats: PregnancySummaryStats | null;
  isLoading: boolean;
}

export const PregnancySummaryCards: React.FC<PregnancySummaryCardsProps> = ({ stats, isLoading }) => {
  const items = [
    {
      label: 'Due Today',
      value: stats?.checksDueToday ?? 0,
      unit: 'PD Checks',
      icon: CalendarCheck,
    },
    {
      label: 'Due This Week',
      value: stats?.checksDueThisWeek ?? 0,
      unit: 'Cows',
      icon: Clock,
    },
    {
      label: 'Confirmed Pregnant',
      value: stats?.confirmedPregnancies ?? 0,
      unit: 'Cows',
      icon: CheckCircle2,
    },
    {
      label: 'Rechecks Required',
      value: stats?.rechecksRequired ?? 0,
      unit: 'Rechecks',
      icon: RefreshCw,
    },
    {
      label: 'Overdue Checks',
      value: stats?.overdueChecks ?? 0,
      unit: 'Alerts',
      icon: AlertTriangle,
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
          case 'Due Today':
            colorCls = 'text-amber-600 dark:text-amber-400';
            bgCls = 'bg-amber-100 dark:bg-amber-500/10';
            break;
          case 'Due This Week':
            colorCls = 'text-sky-600 dark:text-sky-400';
            bgCls = 'bg-sky-100 dark:bg-sky-500/10';
            break;
          case 'Confirmed Pregnant':
            colorCls = 'text-[#10a37f]';
            bgCls = 'bg-[#10a37f]/10';
            break;
          case 'Rechecks Required':
            colorCls = 'text-purple-600 dark:text-purple-400';
            bgCls = 'bg-purple-100 dark:bg-purple-500/10';
            break;
          case 'Overdue Checks':
            colorCls = 'text-red-600 dark:text-red-400';
            bgCls = 'bg-red-100 dark:bg-red-500/10';
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
