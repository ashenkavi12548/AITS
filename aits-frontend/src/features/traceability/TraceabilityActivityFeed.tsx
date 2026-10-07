'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Clock, Tag, User, ArrowRight, Utensils, HeartPulse, Scale, Eye } from 'lucide-react';
import { DailyActivity } from '@/types/traceability.types';
import { ACTIVITY_TYPE_LABELS } from '@/constants/traceability.constants';

interface TraceabilityActivityFeedProps {
  activities: DailyActivity[];
  isLoading: boolean;
}

function getActivityIcon(type: DailyActivity['activityType']) {
  switch (type) {
    case 'FEEDING':
      return Utensils;
    case 'WEIGHT_CHECK':
      return Scale;
    case 'HEALTH_CHECK':
      return HeartPulse;
    case 'GENERAL_OBSERVATION':
      return Eye;
    default:
      return Activity;
  }
}

export const TraceabilityActivityFeed: React.FC<TraceabilityActivityFeedProps> = ({ activities, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] p-5 shadow-2xs space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-[#f0f0f0] dark:bg-[#303030] rounded-md" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-[#f0f0f0] dark:border-[#2f2f2f]">
            <div className="w-10 h-10 rounded-xl bg-[#f0f0f0] dark:bg-[#303030]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-[#f0f0f0] dark:bg-[#303030] rounded-md" />
              <div className="h-3 w-1/2 bg-[#f0f0f0] dark:bg-[#303030] rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-[#10a37f]" />
            Today&apos;s Chronological Activity Feed
          </h2>
          <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">Real-time farm event logging</p>
        </div>
        <Link
          href="/traceability/daily-activities"
          className="text-xs font-semibold text-[#10a37f] hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#737373] dark:text-[#8e8e8e]">
          No activities recorded for today yet.
        </div>
      ) : (
        <div className="divide-y divide-[#f0f0f0] dark:divide-[#2d2d2d]">
          {activities.slice(0, 5).map((act) => {
            const Icon = getActivityIcon(act.activityType);
            return (
              <div key={act.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#10a37f]/10 text-[#10a37f] shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0d0d0d] dark:text-white">
                        {ACTIVITY_TYPE_LABELS[act.activityType] || act.activityType}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#ececec] dark:bg-[#2d2d2d] text-[#5d5d5d] dark:text-[#b4b4b4]">
                        {act.session}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#737373] dark:text-[#8e8e8e]">
                      <span className="flex items-center gap-1 font-medium text-[#0d0d0d] dark:text-[#ececec]">
                        <Tag className="w-3 h-3 text-[#10a37f]" />
                        {act.animalTag} ({act.animalName})
                      </span>
                      <span>•</span>
                      <span>{act.activityTime}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {act.recordedBy}
                      </span>
                    </div>
                    {act.notes && (
                      <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1 bg-[#f9f9f9] dark:bg-[#1a1a1a] p-2 rounded-lg border border-[#e5e5e5] dark:border-[#303030]">
                        {act.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#10a37f] block">
                    {act.weightKg ? `${act.weightKg} kg` : act.quantity ? `${act.quantity} ${act.unit || ''}` : act.temperature ? `${act.temperature} °C` : 'Completed'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#737373] dark:text-[#8e8e8e] block mt-0.5">
                    {act.farmName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
