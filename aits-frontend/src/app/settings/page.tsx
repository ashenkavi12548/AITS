'use client';

import React, { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SettingsHeader from '@/components/settings/SettingsHeader';
import SettingsTabsNav from '@/components/settings/SettingsTabsNav';
import ProfileTab from '@/components/settings/tabs/ProfileTab';
import FarmFacilityTab from '@/components/settings/tabs/FarmFacilityTab';
import SecurityTab from '@/components/settings/tabs/SecurityTab';
import NotificationsTab from '@/components/settings/tabs/NotificationsTab';
import PreferencesTab from '@/components/settings/tabs/PreferencesTab';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SettingsTabType } from '@/types/settings';
import { ArrowRight, Search } from 'lucide-react';

const searchIndex: { keyword: string; tab: SettingsTabType; title: string }[] = [
  { keyword: 'profile', tab: 'profile', title: 'Operator Credentials' },
  { keyword: 'name', tab: 'profile', title: 'Operator Name' },
  { keyword: 'avatar', tab: 'profile', title: 'Profile Photo & Avatar' },
  { keyword: 'phone', tab: 'profile', title: 'Contact Phone Number' },
  { keyword: 'nic', tab: 'profile', title: 'National Identity Card' },
  { keyword: 'language', tab: 'profile', title: 'Preferred Language' },
  { keyword: 'farm', tab: 'farm', title: 'Farm Facility Profile' },
  { keyword: 'facility', tab: 'farm', title: 'Livestock Facility' },
  { keyword: 'capacity', tab: 'farm', title: 'Animal Capacity Meter' },
  { keyword: 'gps', tab: 'farm', title: 'GPS Coordinates' },
  { keyword: 'location', tab: 'farm', title: 'Province & District' },
  { keyword: 'address', tab: 'farm', title: 'Physical Address' },
  { keyword: 'password', tab: 'security', title: 'Change Password' },
  { keyword: 'session', tab: 'security', title: 'Active Sessions & Devices' },
  { keyword: '2fa', tab: 'security', title: 'Account Verification' },
  { keyword: 'security', tab: 'security', title: 'Password & Security' },
  { keyword: 'notification', tab: 'notifications', title: 'Notification Channels' },
  { keyword: 'sms', tab: 'notifications', title: 'SMS Mobile Alerts' },
  { keyword: 'email', tab: 'notifications', title: 'Email Summaries' },
  { keyword: 'outbreak', tab: 'notifications', title: 'Disease Outbreak Alerts' },
  { keyword: 'vaccine', tab: 'notifications', title: 'Vaccination Reminders' },
  { keyword: 'calving', tab: 'notifications', title: 'Calving & Breeding Alerts' },
  { keyword: 'milk', tab: 'notifications', title: 'Milk Yield Drop Alerts' },
  { keyword: 'theme', tab: 'preferences', title: 'Dark / Light Mode' },
  { keyword: 'dark', tab: 'preferences', title: 'Dark Mode Appearance' },
  { keyword: 'light', tab: 'preferences', title: 'Light Mode Appearance' },
  { keyword: 'density', tab: 'preferences', title: 'Table Row Density' },
  { keyword: 'unit', tab: 'preferences', title: 'Metric / Imperial Units' },
  { keyword: 'backup', tab: 'preferences', title: 'Backup & Export JSON' },
];

export default function SettingsPage() {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery } = useSettingsStore();

  const matchingSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchIndex.filter(
      (item) => item.keyword.includes(q) || item.title.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header with Search and Status */}
        <SettingsHeader />

        {/* Search match banner if user is searching */}
        {searchQuery && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] shadow-xs animate-in fade-in space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#10a37f]" />
                Search Results for &ldquo;{searchQuery}&rdquo; ({matchingSuggestions.length} found)
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white underline cursor-pointer"
              >
                Clear search
              </button>
            </div>

            {matchingSuggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {matchingSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.tab);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === item.tab
                        ? 'bg-[#10a37f] text-white border-[#10a37f]'
                        : 'bg-[#f4f4f4] dark:bg-[#1f1f1f] text-[#0d0d0d] dark:text-white border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f]'
                    }`}
                  >
                    <span>{item.title}</span>
                    <ArrowRight className="w-3 h-3 opacity-70" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                No specific settings matched this query. Try &ldquo;password&rdquo;, &ldquo;farm&rdquo;, &ldquo;sms&rdquo;, or &ldquo;theme&rdquo;.
              </p>
            )}
          </div>
        )}

        {/* Tab Navigation Segmented Bar */}
        <SettingsTabsNav />

        {/* Active Tab View */}
        <main className="transition-all duration-200">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'farm' && <FarmFacilityTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </main>
      </div>
    </DashboardLayout>
  );
}
