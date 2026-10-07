'use client';

import React from 'react';
import { Milk, Sun, Moon, PawPrint, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { ProductionSummaryStats } from '@/types/production';
import { StatsCards } from '@/components/common/StatsCards';

interface ProductionSummaryCardsProps {
  stats: ProductionSummaryStats | null;
  isLoading: boolean;
}

export const ProductionSummaryCards: React.FC<ProductionSummaryCardsProps> = ({ stats, isLoading }) => {
  const items = [
    {
      label: "Today's Yield",
      value: stats?.todayTotalLiters ?? 0,
      unit: 'Liters',
      icon: Milk,
    },
    {
      label: 'Morning Yield',
      value: stats?.morningTotalLiters ?? 0,
      unit: 'Liters',
      icon: Sun,
    },
    {
      label: 'Evening Yield',
      value: stats?.eveningTotalLiters ?? 0,
      unit: 'Liters',
      icon: Moon,
    },
    {
      label: 'Animals Milked',
      value: stats?.animalsMilked ?? 0,
      unit: 'Cows',
      icon: PawPrint,
    },
    {
      label: 'Avg / Animal',
      value: stats?.averagePerAnimal ?? 0,
      unit: 'L/cow',
      icon: Scale,
    },
    {
      label: 'Vs Yesterday',
      value: `${stats?.percentageChangeVsYesterday ?? 0}%`,
      unit: '',
      icon: (stats?.percentageChangeVsYesterday ?? 0) >= 0 ? TrendingUp : TrendingDown,
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
          case "Today's Yield":
            colorCls = 'text-[#10a37f]';
            bgCls = 'bg-[#10a37f]/10';
            break;
          case 'Morning Yield':
            colorCls = 'text-amber-600 dark:text-amber-400';
            bgCls = 'bg-amber-100 dark:bg-amber-500/10';
            break;
          case 'Evening Yield':
            colorCls = 'text-sky-600 dark:text-sky-400';
            bgCls = 'bg-sky-100 dark:bg-sky-500/10';
            break;
          case 'Animals Milked':
            colorCls = 'text-purple-600 dark:text-purple-400';
            bgCls = 'bg-purple-100 dark:bg-purple-500/10';
            break;
          case 'Avg / Animal':
            colorCls = 'text-emerald-600 dark:text-emerald-400';
            bgCls = 'bg-emerald-100 dark:bg-emerald-500/10';
            break;
          case 'Vs Yesterday':
            const isUp = (stats?.percentageChangeVsYesterday ?? 0) >= 0;
            colorCls = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
            bgCls = isUp ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-red-100 dark:bg-red-500/10';
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
