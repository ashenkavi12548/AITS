"use client";

import React, { useState, useRef } from "react";
import FullCalendarComponent from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { EventInput, EventContentArg } from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useCalendarEvents } from "@/hooks/use-calendar";
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import EventDetailsModal from "./EventDetailsModal";

const getEventColor = (type: string) => {
  switch (type) {
    case "VACCINATION":
      return "#10b981"; // green
    case "VET_VISIT":
      return "#3b82f6"; // blue
    case "TREATMENT":
      return "#f97316"; // orange
    case "CALVING":
      return "#8b5cf6"; // purple
    case "QUARANTINE":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

function renderEventContent(eventInfo: EventContentArg) {
  // Use dot + text style
  return (
    <div className="flex items-center gap-1 w-full overflow-hidden text-xs px-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: eventInfo.event.backgroundColor }}
      />
      <span className="truncate font-medium text-[#333] dark:text-[#ccc]">
        {eventInfo.event.title}
      </span>
    </div>
  );
}

export default function FullCalendar() {
  const calendarRef = useRef<FullCalendarComponent>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [viewEventId, setViewEventId] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const { data: events, isLoading } = useCalendarEvents(
    dateRange.start,
    dateRange.end,
  );

  const handleDatesSet = (dateInfo: { startStr: string; endStr: string }) => {
    setDateRange({ start: dateInfo.startStr, end: dateInfo.endStr });
  };

  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr.split("T")[0]);
    setShowAddModal(true);
  };

  const handleEventClick = (arg: { event: { id: string } }) => {
    setViewEventId(arg.event.id);
  };

  const mappedEvents: EventInput[] =
    events?.map((e) => {
      const bgColor = e.color || getEventColor(e.type);
      return {
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        backgroundColor: bgColor,
        borderColor: "transparent",
        extendedProps: { ...e },
      };
    }) || [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#303030] rounded-2xl shadow-sm overflow-hidden p-4 relative">
      <style>{`
        /* Google Calendar Grid Styles */
        .calendar-container .fc-theme-standard td, 
        .calendar-container .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        :is(.dark) .calendar-container .fc-theme-standard td, 
        :is(.dark) .calendar-container .fc-theme-standard th {
          border-color: #333;
        }
        
        /* Day Cell Structure */
        .calendar-container .fc-daygrid-day-frame {
          padding: 4px;
          display: flex;
          flex-direction: column;
          min-height: 100px;
        }
        
        /* Day Cell Hover */
        .calendar-container .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background-color: #f9fafb;
          cursor: pointer;
        }
        :is(.dark) .calendar-container .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background-color: #262626;
        }

        /* Number Top-Left */
        .calendar-container .fc-daygrid-day-top {
          flex-direction: row;
          padding: 2px;
        }
        .calendar-container .fc-daygrid-day-number {
          font-size: 0.75rem;
          color: #6b7280;
          padding: 4px;
          margin-left: 2px;
          text-decoration: none !important;
          z-index: 1;
        }
        :is(.dark) .calendar-container .fc-daygrid-day-number {
          color: #9ca3af;
        }
        
        /* Today Badge */
        .calendar-container .fc-day-today .fc-daygrid-day-number {
          background-color: #10a37f;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .calendar-container .fc-day-today {
          background-color: transparent !important; /* override default yellow */
        }
        .calendar-container .fc-day-today .fc-daygrid-day-frame {
          background-color: rgba(16, 163, 127, 0.03);
        }

        /* Muted Trailing/Leading Days */
        .calendar-container .fc-day-other .fc-daygrid-day-number {
          opacity: 0.4;
        }
        
        /* Event Pill overrides */
        .calendar-container .fc-event {
          border: none;
          background: transparent;
          margin: 1px 0;
        }
        .calendar-container .fc-daygrid-event-harness {
          margin-top: 1px;
        }

        /* +N more link */
        .calendar-container .fc-daygrid-more-link {
          font-size: 0.75rem;
          color: #10a37f;
          font-weight: 500;
          text-decoration: none;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .calendar-container .fc-daygrid-more-link:hover {
          background-color: rgba(16, 163, 127, 0.1);
        }

        /* Toolbar / Buttons */
        .calendar-container .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 700;
          color: #111827;
        }
        :is(.dark) .calendar-container .fc-toolbar-title {
          color: #f3f4f6;
        }
        
        .calendar-container .fc-button {
          background-color: white !important;
          color: #374151 !important;
          border: 1px solid #d1d5db !important;
          border-radius: 9999px !important; /* Pill shape */
          padding: 0.4rem 1rem !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          text-transform: capitalize !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          transition: all 0.2s !important;
        }
        :is(.dark) .calendar-container .fc-button {
          background-color: #262626 !important;
          color: #d1d5db !important;
          border-color: #404040 !important;
        }
        
        .calendar-container .fc-button:hover {
          background-color: #f3f4f6 !important;
        }
        :is(.dark) .calendar-container .fc-button:hover {
          background-color: #333 !important;
        }
        
        .calendar-container .fc-button-active {
          background-color: #e5e7eb !important;
          color: #111827 !important;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06) !important;
        }
        :is(.dark) .calendar-container .fc-button-active {
          background-color: #404040 !important;
          color: #f3f4f6 !important;
        }

        .calendar-container .fc-button-group {
          gap: 0.25rem;
        }
        .calendar-container .fc-button-group > .fc-button {
          border-radius: 9999px !important; /* Ensure middle buttons stay pill-shaped */
        }
      `}</style>

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="text-xl font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-[#10a37f]" />
          Farm Schedule
        </h2>
        <div className="flex items-center gap-4">
          {isLoading && (
            <Loader2 className="w-5 h-5 animate-spin text-[#10a37f]" />
          )}
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split("T")[0]);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 calendar-container min-h-175 w-full relative z-0">
        <FullCalendarComponent
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "today prev,next",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
          }}
          events={mappedEvents}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          expandRows={true}
          eventContent={renderEventContent}
          dayMaxEvents={3}
          fixedWeekCount={false}
          showNonCurrentDates={true}
        />
      </div>

      {showAddModal && (
        <AddEventModal
          onClose={() => setShowAddModal(false)}
          defaultDate={selectedDate}
        />
      )}

      {viewEventId && (
        <EventDetailsModal
          eventId={viewEventId}
          onClose={() => setViewEventId(null)}
          onEdit={() => {
            setEditEventId(viewEventId);
            setViewEventId(null);
          }}
        />
      )}

      {editEventId && (
        <EditEventModal
          eventId={editEventId}
          onClose={() => setEditEventId(null)}
        />
      )}
    </div>
  );
}
