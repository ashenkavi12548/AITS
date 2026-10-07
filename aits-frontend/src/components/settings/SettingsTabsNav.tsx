'use client';

import React from 'react';
import {
  User,
  Building2,
  Lock,
  Bell,
  Sliders,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SettingsTabType } from '@/types/settings';

interface TabItem {
  id: SettingsTabType;
  label: string;
  subLabel: string;
  icon: React.ElementType;
}

const tabs: TabItem[] = [
  {
    id: 'profile',
    label: 'Profile & Account',
    subLabel: 'Name, phone & photo',
    icon: User,
  },
  {
    id: 'farm',
    label: 'Farm Facility',
    subLabel: 'Location & farm details',
    icon: Building2,
  },
  {
    id: 'security',
    label: 'Password & Security',
    subLabel: 'Password & active devices',
    icon: Lock,
  },
  {
    id: 'notifications',
    label: 'Alerts & Notifications',
    subLabel: 'Email, SMS & farm alerts',
    icon: Bell,
  },
  {
    id: 'preferences',
    label: 'Display & Preferences',
    subLabel: 'Theme, density & backup',
    icon: Sliders,
  },
];

export default function SettingsTabsNav() {
  const { activeTab, setActiveTab } = useSettingsStore();

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#f4f4f4] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#303030] min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer text-left relative ${
                isActive
                  ? 'bg-white dark:bg-[#2b2b2b] text-[#0d0d0d] dark:text-white shadow-sm border border-[#e0e0e0] dark:border-[#404040]'
                  : 'text-[#737373] dark:text-[#999999] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#252525]/50'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#10a37f]/15 text-[#10a37f]'
                    : 'bg-transparent text-[#737373] dark:text-[#8e8e8e] group-hover:text-[#0d0d0d] dark:group-hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
              </div>

              <div>
                <span className={`font-semibold block ${isActive ? 'text-[#0d0d0d] dark:text-white' : ''}`}>
                  {tab.label}
                </span>
                <p className="text-[10.5px] text-[#737373] dark:text-[#8e8e8e] line-clamp-1">
                  {tab.subLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
