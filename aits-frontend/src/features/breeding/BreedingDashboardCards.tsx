'use client';

import React from 'react';
import { Activity, Clock, CheckCircle2, Baby, AlertTriangle, Award } from 'lucide-react';
import { BreedingSummaryStats } from '@/types/breeding';
import { StatsCards } from '@/components/common/StatsCards';

interface BreedingDashboardCardsProps {
  stats: BreedingSummaryStats | null;
  isLoading: boolean;
}

export const BreedingDashboardCards: React.FC<BreedingDashboardCardsProps> = ({ stats, isLoading }) => {
  const items = [
    {
      label: 'Total Services',
      value: stats?.totalBreedingServices ?? 0,
      unit: 'Logs',
      icon: Activity,
    },
    {
      label: 'Checks Pending',
      value: stats?.pregnancyChecksPending ?? 0,
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
      label: 'Expected Calvings',
      value: stats?.expectedCalvings ?? 0,
      unit: 'Calves',
      icon: Baby,
    },
    {
      label: 'Overdue Activities',
      value: stats?.overdueActivities ?? 0,
      unit: 'Alerts',
      icon: AlertTriangle,
    },
    {
      label: 'Success Rate',
      value: `${stats?.breedingSuccessRate ?? 0}%`,
      unit: '',
      icon: Award,
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
          case 'Total Services':
            colorCls = 'text-[#10a37f]';
            bgCls = 'bg-[#10a37f]/10';
            break;
          case 'Checks Pending':
            colorCls = 'text-amber-600 dark:text-amber-400';
            bgCls = 'bg-amber-100 dark:bg-amber-500/10';
            break;
          case 'Confirmed Pregnant':
            colorCls = 'text-[#10a37f]';
            bgCls = 'bg-[#10a37f]/10';
            break;
          case 'Expected Calvings':
            colorCls = 'text-sky-600 dark:text-sky-400';
            bgCls = 'bg-sky-100 dark:bg-sky-500/10';
            break;
          case 'Overdue Activities':
            colorCls = 'text-red-600 dark:text-red-400';
            bgCls = 'bg-red-100 dark:bg-red-500/10';
            break;
          case 'Success Rate':
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
