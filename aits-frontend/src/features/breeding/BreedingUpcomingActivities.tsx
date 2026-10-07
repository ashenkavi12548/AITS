'use client';

import React from 'react';
import { CalendarCheck, Baby, AlertTriangle, Activity } from 'lucide-react';
import { UpcomingActivityItem } from '@/types/breeding';

interface BreedingUpcomingActivitiesProps {
  activities: UpcomingActivityItem[];
  isLoading: boolean;
}

export const BreedingUpcomingActivities: React.FC<BreedingUpcomingActivitiesProps> = ({ activities, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs space-y-3 animate-pulse">
        <div className="h-4 w-40 bg-[#f0f0f0] dark:bg-[#383838] rounded-md mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-[#f0f0f0] dark:bg-[#383838] rounded-xl" />
        ))}
      </div>
    );
  }

  const getActivityIcon = (type: UpcomingActivityItem['type']) => {
    switch (type) {
      case 'PREGNANCY_CHECK':
        return <CalendarCheck className="w-4 h-4 text-amber-500" />;
      case 'EXPECTED_CALVING':
        return <Baby className="w-4 h-4 text-sky-500" />;
      case 'OVERDUE_CHECK':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'BREEDING_FOLLOWUP':
        return <Activity className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getUrgencyBadge = (urgency: UpcomingActivityItem['urgency']) => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs transition-colors duration-150">
      <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
            Upcoming Breeding & Calving Activities
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
            Pending pregnancy diagnoses, expected births, and 21-day heat check alerts.
          </p>
        </div>
        <span className="text-[11px] font-bold text-[#10a37f] bg-[#10a37f]/10 px-2.5 py-0.5 rounded-full border border-[#10a37f]/20">
          {activities.length} Alerts
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-[#737373] dark:text-[#8e8e8e]">
          <div className="w-10 h-10 rounded-full bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center mb-2">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[#0d0d0d] dark:text-white">No upcoming breeding or calving alerts</p>
          <p className="text-[11px] max-w-sm mt-0.5">All pregnancy checks, calving schedules, and 21-day heat alerts are up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] flex flex-col justify-between space-y-2 hover:border-[#10a37f]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838]">
                    {getActivityIcon(act.type)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0d0d0d] dark:text-white">{act.title}</h4>
                    <span className="font-mono font-bold text-[11px] text-[#166534] dark:text-[#22C55E]">
                      {act.animalTag} ({act.animalName})
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getUrgencyBadge(act.urgency)}`}>
                  {act.urgency}
                </span>
              </div>

              <p className="text-[11.5px] text-[#737373] dark:text-[#8e8e8e] leading-snug">{act.details}</p>

              <div className="pt-2 border-t border-[#e5e5e5]/60 dark:border-[#383838]/60 flex items-center justify-between text-[11px]">
                <span className="text-[#737373] dark:text-[#8e8e8e] truncate">{act.farmName}</span>
                <span className="font-semibold text-[#0d0d0d] dark:text-white">Due: {act.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
