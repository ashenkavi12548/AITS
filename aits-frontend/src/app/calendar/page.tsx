'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FullCalendar from '@/components/calendar/FullCalendar';

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 h-full flex flex-col">
        {/* Calendar Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#171717] p-5 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-sm transition-colors shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20 shrink-0 shadow-inner">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#0d0d0d] dark:text-white">
                Farm Calendar & Schedule
              </h1>
              <p className="text-xs md:text-sm text-[#737373] dark:text-[#8e8e8e] mt-1 font-medium">
                Comprehensive view of veterinary visits, vaccinations, treatment schedules, and expected calving.
              </p>
            </div>
          </div>
        </div>

        {/* Full Page Calendar View */}
        <div className="flex-1 min-h-0 w-full pb-6">
          <FullCalendar />
        </div>
      </div>
    </DashboardLayout>
  );
}
