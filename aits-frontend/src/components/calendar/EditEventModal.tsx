"use client";

import React, { useState } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  CalendarEvent,
} from "@/hooks/use-calendar";
import { useQueryClient } from "@tanstack/react-query";

const COLOR_PRESETS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Gray", value: "#6B7280" },
];

interface EditEventModalProps {
  eventId: string;
  onClose: () => void;
}

export default function EditEventModal({
  eventId,
  onClose,
}: EditEventModalProps) {
  const queryClient = useQueryClient();

  // Find event in cache
  const cachedEvents =
    queryClient.getQueryData<CalendarEvent[]>(["calendar", "events"]) || [];
  const event = cachedEvents.find((e) => e.id === eventId);

  if (!event) {
    return null; // or loading
  }

  return <EditEventForm event={event} onClose={onClose} />;
}

interface EditEventFormProps {
  event: CalendarEvent;
  onClose: () => void;
}

function EditEventForm({ event, onClose }: EditEventFormProps) {
  // Form State
  const [title, setTitle] = useState(event.title || "");
  const [description, setDescription] = useState(event.description || "");
  const [scheduledDate, setScheduledDate] = useState(
    event.start?.split("T")[0] || "",
  );

  const st = event.start?.split("T")[1]?.substring(0, 5) || "";
  const et = event.end?.split("T")[1]?.substring(0, 5) || "";
  const [startTime, setStartTime] = useState(st);
  const [endTime, setEndTime] = useState(et);

  const [isAllDay, setIsAllDay] = useState(event.allDay || false);
  const [color, setColor] = useState(event.color || "#3B82F6");
  const [animalTag, setAnimalTag] = useState(event.animalNumber || "");
  const [notes, setNotes] = useState(""); // We can drop notes as we use description now, or map it.

  const updateMutation = useUpdateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();

  const isSystem = event.source !== "CUSTOM";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSystem) {
      toast.error("Cannot edit system-generated events directly.");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!event.sourceId) return;

    updateMutation.mutate(
      {
        id: event.sourceId,
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        scheduledDate,
        startTime: !isAllDay && startTime ? startTime : undefined,
        endTime: !isAllDay && endTime ? endTime : undefined,
        isAllDay,
        color,
        animalTag: animalTag.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Event updated successfully");
          onClose();
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to update event";
          toast.error(message);
        },
      },
    );
  };

  const handleDelete = () => {
    if (isSystem) {
      toast.error("Cannot delete system-generated events directly.");
      return;
    }

    if (!event.sourceId) return;

    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(event.sourceId, {
        onSuccess: () => {
          toast.success("Event deleted");
          onClose();
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to delete event";
          toast.error(message);
        },
      });
    }
  };

  const inputClass =
    "w-full bg-[#f9f9f9] dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#383838] rounded-xl px-3 py-2 text-[13px] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f] transition-all disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass =
    "text-[11px] font-semibold text-[#0d0d0d] dark:text-[#e5e5e5] uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}30`,
                color,
              }}
            >
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                {isSystem ? "Event Details" : "Edit Event"}
              </h2>
              {isSystem && (
                <p className="text-[11px] text-[#8e8e8e] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span>
                  System Generated
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#f4f4f4] dark:hover:bg-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Event Title</label>
            <input
              type="text"
              required
              disabled={isSystem}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Description</label>
            <textarea
              rows={2}
              disabled={isSystem}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Brief description of the event..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Date</label>
              <input
                type="date"
                required
                disabled={isSystem}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Related Animal</label>
              <input
                type="text"
                disabled={isSystem}
                value={animalTag}
                onChange={(e) => setAnimalTag(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAllDayEdit"
              disabled={isSystem}
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded border-[#e5e5e5] text-[#10a37f] focus:ring-[#10a37f] disabled:opacity-50"
            />
            <label
              htmlFor="isAllDayEdit"
              className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]"
            >
              All-day event
            </label>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Start Time</label>
                <input
                  type="time"
                  disabled={isSystem}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>End Time</label>
                <input
                  type="time"
                  disabled={isSystem}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {!isSystem && (
            <div className="space-y-2">
              <label className={labelClass}>Event Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setColor(preset.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                      color === preset.value
                        ? "border-[#0d0d0d] dark:border-white scale-110 shadow-md"
                        : "border-transparent hover:border-[#c0c0c0] dark:hover:border-[#555]"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  >
                    {color === preset.value && (
                      <svg
                        className="w-3.5 h-3.5 text-white drop-shadow-sm"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={labelClass}>Notes</label>
            <textarea
              rows={2}
              disabled={isSystem}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Any additional details..."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e5e5e5] dark:border-[#383838]">
            {!isSystem ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[13px] font-semibold text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] rounded-xl transition-colors cursor-pointer"
              >
                {isSystem ? "Close" : "Cancel"}
              </button>

              {!isSystem && (
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
