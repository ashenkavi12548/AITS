'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Plus,
  Check,
  Syringe,
  Pill,
  HeartPulse,
  Stethoscope,
  Clock,
  Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpcomingEvents, useCurrentUser } from '@/hooks/use-dashboard';
import { dashboardService } from '@/services/dashboard.service';
import MiniCalendar from './MiniCalendar';
import ScheduleEventModal from './ScheduleEventModal';
import toast from 'react-hot-toast';

type CategoryFilter = 'ALL' | 'VACCINATION' | 'TREATMENT' | 'CALVING' | 'VET_VISIT';

export default function UpcomingEvents() {
  const queryClient = useQueryClient();
  const { data: events, isLoading, isError } = useUpcomingEvents();
  const { data: currentUser } = useCurrentUser();

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Extract unique event YYYY-MM-DD dates for MiniCalendar highlighting
  const eventDateStrings = events
    ? Array.from(new Set(events.map((e) => e.date.split('T')[0])))
    : [];

  // Filter by calendar date selection and category pills
  const filteredEvents = (events || []).filter((evt) => {
    if (selectedCalendarDate && evt.date.split('T')[0] !== selectedCalendarDate) {
      return false;
    }
    if (activeCategory !== 'ALL') {
      if (activeCategory === 'VACCINATION' && evt.category !== 'VACCINATION') return false;
      if (activeCategory === 'TREATMENT' && evt.category !== 'TREATMENT') return false;
      if (activeCategory === 'CALVING' && evt.category !== 'CALVING') return false;
      if (activeCategory === 'VET_VISIT' && evt.category !== 'VET_VISIT') return false;
    }
    return true;
  });

  const getEventTypeBadge = (type: string, category?: string) => {
    if (type.includes('Vaccination') || category === 'VACCINATION') {
      return 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20';
    }
    if (type.includes('Calving') || category === 'CALVING') {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    if (type.includes('Treatment') || category === 'TREATMENT') {
      return 'bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20';
    }
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  };

  const getUrgencyBadge = (urgency?: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING') => {
    if (urgency === 'OVERDUE') {
      return (
        <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Clock className="w-2.5 h-2.5" />
          Overdue
        </span>
      );
    }
    if (urgency === 'DUE_TODAY') {
      return (
        <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
          <Clock className="w-2.5 h-2.5" />
          Due Today
        </span>
      );
    }
    return null;
  };

  const handleComplete = async (id: string, title: string) => {
    setCompletingId(id);
    try {
      await dashboardService.completeScheduleEvent(id);
      toast.success(`Completed: ${title}`);
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'upcoming-events'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete schedule item';
      toast.error(msg);
    } finally {
      setCompletingId(null);
    }
  };

  const handleScheduleSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'upcoming-events'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] });
  };

  return (
    <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col h-full transition-colors duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#e5e5e5] dark:border-[#383838] mb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs shrink-0">
            <CalendarDays className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white tracking-tight">
                Upcoming Schedule
              </h2>
              {events && events.length > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10.5px] font-bold bg-[#10a37f]/10 text-[#10a37f]">
                  {events.length}
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">
              Vaccinations, treatments & calving dates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedCalendarDate && (
            <button
              onClick={() => setSelectedCalendarDate(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold text-[#10a37f] bg-[#10a37f]/10 rounded-lg hover:bg-[#10a37f]/20 transition-colors cursor-pointer"
            >
              <Filter className="w-3 h-3" /> Clear Date
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs shadow-[#10a37f]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Activity</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 scrollbar-none text-[11px]">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'ALL'
              ? 'bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d]'
              : 'bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
          }`}
        >
          All Activities
        </button>
        <button
          onClick={() => setActiveCategory('VACCINATION')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'VACCINATION'
              ? 'bg-[#0ea5e9] text-white shadow-xs'
              : 'bg-[#0ea5e9]/10 text-[#0ea5e9] hover:bg-[#0ea5e9]/20'
          }`}
        >
          <Syringe className="w-3 h-3" />
          Vaccinations
        </button>
        <button
          onClick={() => setActiveCategory('TREATMENT')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'TREATMENT'
              ? 'bg-[#10a37f] text-white shadow-xs'
              : 'bg-[#10a37f]/10 text-[#10a37f] hover:bg-[#10a37f]/20'
          }`}
        >
          <Pill className="w-3 h-3" />
          Treatments
        </button>
        <button
          onClick={() => setActiveCategory('CALVING')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'CALVING'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'
          }`}
        >
          <HeartPulse className="w-3 h-3" />
          Calving Dates
        </button>
        <button
          onClick={() => setActiveCategory('VET_VISIT')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'VET_VISIT'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          <Stethoscope className="w-3 h-3" />
          Vet Visits
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left 7 cols: Event List */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          {isLoading ? (
            <div className="space-y-2.5 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#f0f0f0] dark:bg-[#383838] rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-[#737373] dark:text-[#8e8e8e]">
              <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
              <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">Unable to load events</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#737373] dark:text-[#8e8e8e] my-auto">
              <CheckCircle2 className="w-8 h-8 text-[#10a37f]/60 mb-2" />
              <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">No schedule items</p>
              <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5 max-w-xs">
                {selectedCalendarDate
                  ? `No activities scheduled for ${selectedCalendarDate}`
                  : 'All veterinary activities are up to date.'}
              </p>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#10a37f] bg-[#10a37f]/10 hover:bg-[#10a37f]/20 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule New Veterinary Event</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-75 overflow-y-auto no-scrollbar pr-1">
              {filteredEvents.map((evt) => {
                const eventDate = new Date(evt.date);
                const dayNum = eventDate.getDate();
                const monthStr = eventDate.toLocaleString('default', { month: 'short' });
                const isCompleting = completingId === evt.id;

                return (
                  <div
                    key={evt.id}
                    className="p-2.5 bg-[#f9f9f9] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-xl flex items-center justify-between gap-3 hover:border-[#10a37f]/40 hover:bg-white dark:hover:bg-[#2b2b2b] transition-all group"
                  >
                    {/* Date Badge */}
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <span className="text-[9.5px] font-bold text-[#737373] dark:text-[#8e8e8e] uppercase leading-none">
                        {monthStr}
                      </span>
                      <span className="text-[14px] font-black text-[#0d0d0d] dark:text-white leading-tight">
                        {dayNum}
                      </span>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${getEventTypeBadge(
                            evt.type,
                            evt.category,
                          )}`}
                        >
                          {evt.type}
                        </span>

                        {getUrgencyBadge(evt.urgency)}

                        <Link
                          href={`/animals/${evt.animalId}`}
                          className="text-[11px] font-semibold text-[#10a37f] hover:underline"
                        >
                          #{evt.animalNumber}
                        </Link>

                        {evt.animalName && (
                          <span className="text-[11px] text-gray-400 truncate">
                            • {evt.animalName}
                          </span>
                        )}
                      </div>

                      <h4 className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white truncate mt-0.5 group-hover:text-[#10a37f] transition-colors">
                        {evt.title}
                      </h4>

                      {evt.details && (
                        <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] truncate">
                          {evt.details}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Mark Complete Checkmark */}
                      <button
                        type="button"
                        onClick={() => handleComplete(evt.id, evt.title)}
                        disabled={isCompleting}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#10a37f] hover:bg-[#10a37f]/10 dark:hover:bg-[#10a37f]/20 transition-all cursor-pointer"
                        title="Mark activity completed"
                      >
                        {isCompleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#10a37f]" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>

                      {/* View Profile Link */}
                      <Link
                        href={`/animals/${evt.animalId}`}
                        className="p-1.5 rounded-lg text-[#737373] dark:text-[#8e8e8e] hover:text-[#10a37f] hover:bg-[#ececec] dark:hover:bg-[#383838] transition-colors"
                        title="View Animal Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 cols: Mini Calendar Component */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <MiniCalendar
            eventDates={eventDateStrings}
            selectedDate={selectedCalendarDate}
            onSelectDate={(d) => setSelectedCalendarDate(d)}
          />
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleEventModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
        initialDate={selectedCalendarDate}
        userEmail={currentUser?.email}
      />
    </div>
  );
}
