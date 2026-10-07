"use client";

import React, { useState } from "react";
import { X, Calendar as CalendarIcon, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCreateCalendarEvent } from "@/hooks/use-calendar";

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

interface AddEventModalProps {
  onClose: () => void;
  defaultDate?: string;
}

export default function AddEventModal({ onClose, defaultDate }: AddEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    defaultDate || new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [color, setColor] = useState("#3B82F6");
  const [animalTag, setAnimalTag] = useState("");
  const [eventType, setEventType] = useState<"CUSTOM" | "VACCINATION" | "TREATMENT" | "CALVING" | "VET_VISIT">("CUSTOM");

  const createMutation = useCreateCalendarEvent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    createMutation.mutate(
      {
        title: title.trim(),
        eventType,
        scheduledDate,
        description: description.trim() || undefined,
        startTime: !isAllDay && startTime ? startTime : undefined,
        endTime: !isAllDay && endTime ? endTime : undefined,
        isAllDay,
        color,
        animalTag: animalTag.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Event created successfully");
          onClose();
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to create event";
          toast.error(message);
        },
      }
    );
  };

  const inputClass =
    "w-full bg-[#f9f9f9] dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#383838] rounded-xl px-3 py-2 text-[13px] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f] transition-all";
  const labelClass =
    "text-[11px] font-semibold text-[#0d0d0d] dark:text-[#e5e5e5] uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                Add Calendar Event
              </h2>
              <p className="text-[11px] text-[#8e8e8e]">
                Schedule a custom event or reminder
              </p>
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
          {/* Title */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="e.g. Monthly Farm Inspection"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={labelClass}>Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Brief description of the event..."
            />
          </div>

          {/* Type / Category */}
          <div className="space-y-1.5">
            <label className={labelClass}>Category / Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as "CUSTOM" | "VACCINATION" | "TREATMENT" | "CALVING" | "VET_VISIT")}
              className={inputClass}
            >
              <option value="CUSTOM">Custom Event</option>
              <option value="VACCINATION">Vaccination</option>
              <option value="TREATMENT">Treatment</option>
              <option value="CALVING">Calving / Pregnancy</option>
              <option value="VET_VISIT">Veterinary Visit</option>
            </select>
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Related Animal</label>
              <input
                type="text"
                value={animalTag}
                onChange={(e) => setAnimalTag(e.target.value)}
                className={inputClass}
                placeholder="Tag (optional)"
              />
            </div>
          </div>

          {/* All Day */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAllDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded border-[#e5e5e5] text-[#10a37f] focus:ring-[#10a37f]"
            />
            <label
              htmlFor="isAllDay"
              className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]"
            >
              All-day event
            </label>
          </div>

          {/* Times */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Color Picker */}
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
              {/* Custom Color */}
              <label
                className={`w-8 h-8 rounded-full border-2 cursor-pointer overflow-hidden transition-all ${
                  !COLOR_PRESETS.some((p) => p.value === color)
                    ? "border-[#0d0d0d] dark:border-white scale-110 shadow-md"
                    : "border-dashed border-[#c0c0c0] dark:border-[#555]"
                }`}
                title="Custom color"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 w-full h-full cursor-pointer"
                />
                <div
                  className="w-full h-full -mt-8"
                  style={{ backgroundColor: color }}
                />
              </label>
            </div>
          </div>



          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e5e5e5] dark:border-[#383838]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
