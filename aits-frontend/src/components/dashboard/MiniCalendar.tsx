'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  eventDates?: string[]; // Array of YYYY-MM-DD string dates with events
  selectedDate?: string | null;
  onSelectDate?: (dateStr: string | null) => void;
}

export default function MiniCalendar({
  eventDates = [],
  selectedDate,
  onSelectDate,
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDay = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'short' });

  // Format date key YYYY-MM-DD
  const formatDateKey = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <div className="bg-[#f9f9f9] dark:bg-[#212121] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#383838] select-none">
      {/* Month Header & Controls */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
          {monthName} {year}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-[#737373] dark:text-[#8e8e8e] hover:bg-[#ececec] dark:hover:bg-[#383838] hover:text-[#0d0d0d] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-[#737373] dark:text-[#8e8e8e] hover:bg-[#ececec] dark:hover:bg-[#383838] hover:text-[#0d0d0d] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center gap-1 text-[10.5px] font-medium text-[#737373] dark:text-[#8e8e8e] uppercase mb-1">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
        {/* Leading Empty Slots */}
        {Array.from({ length: startingDay }).map((_, index) => (
          <div key={`empty-${index}`} className="h-6" />
        ))}

        {/* Day Numbers */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = formatDateKey(day);
          const hasEvent = eventDates.includes(dateKey);
          const isSelected = selectedDate === dateKey;

          return (
            <button
              key={day}
              onClick={() => {
                if (onSelectDate) {
                  onSelectDate(isSelected ? null : dateKey);
                }
              }}
              className={`h-6 w-full rounded-md flex items-center justify-center text-[11.5px] font-medium transition-all relative cursor-pointer ${
                isSelected
                  ? 'bg-[#10a37f] text-white font-semibold shadow-xs'
                  : hasEvent
                  ? 'bg-[#10a37f]/15 text-[#10a37f] font-semibold hover:bg-[#10a37f]/25 border border-[#10a37f]/30'
                  : 'text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#ececec] dark:hover:bg-[#383838]'
              }`}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-[#10a37f] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
