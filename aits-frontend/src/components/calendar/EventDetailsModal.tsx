"use client";

import React, { useState } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Info,
  Trash2,
  CheckCircle,
  Edit,
  AlertTriangle,
  Loader2,
  MapPin,
  Stethoscope,
  Activity,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useDeleteCalendarEvent,
  useCompleteCalendarEvent,
  CalendarEvent,
} from "@/hooks/use-calendar";
import { useQueryClient } from "@tanstack/react-query";

interface EventDetailsModalProps {
  eventId: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function EventDetailsModal({
  eventId,
  onClose,
  onEdit,
}: EventDetailsModalProps) {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const deleteMutation = useDeleteCalendarEvent();
  const completeMutation = useCompleteCalendarEvent();

  // Find event in cache
  const cachedEvents =
    queryClient.getQueryData<CalendarEvent[]>(["calendar", "events"]) || [];
  const event = cachedEvents.find((e) => e.id === eventId);

  if (!event) {
    return null;
  }

  const isCustom = event.source === "CUSTOM";

  // Derive date and time displays
  const startDate = new Date(event.start);
  const dateString = startDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let timeString = "All Day";
  if (!event.allDay) {
    const startTimeStr = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    let endTimeStr = "";
    if (event.end) {
      endTimeStr = new Date(event.end).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    timeString = endTimeStr ? `${startTimeStr} – ${endTimeStr}` : startTimeStr;
  }

  const handleDelete = () => {
    if (!event.sourceId) return;
    deleteMutation.mutate(event.sourceId, {
      onSuccess: () => {
        toast.success("Event deleted successfully");
        onClose();
      },
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Unable to delete event.";
        toast.error(message);
        setShowDeleteConfirm(false);
      },
    });
  };

  const handleComplete = () => {
    if (!event.sourceId) return;
    completeMutation.mutate(event.sourceId, {
      onSuccess: () => {
        toast.success("Event marked as completed");
        onClose();
      },
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Unable to complete event.";
        toast.error(message);
        setShowCompleteConfirm(false);
      },
    });
  };

  const badgeColor = event.color || "#10a37f";

  // Custom Icon based on source
  const getIcon = () => {
    switch (event.source) {
      case "VACCINATION":
        return <Activity className="w-5 h-5 text-white" />;
      case "TREATMENT":
        return <Stethoscope className="w-5 h-5 text-white" />;
      case "VETERINARY_VISIT":
        return <Stethoscope className="w-5 h-5 text-white" />;
      case "PREGNANCY":
        return <Info className="w-5 h-5 text-white" />;
      default:
        return <CalendarIcon className="w-5 h-5 text-white" />;
    }
  };

  // Render Confirmation overlays inline so we maintain context
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() =>
            !deleteMutation.isPending && setShowDeleteConfirm(false)
          }
        />
        <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0d0d0d] dark:text-white">
                Delete Event?
              </h3>
              <p className="text-sm text-[#5d5d5d] dark:text-[#b4b4b4] mt-2">
                Are you sure you want to delete {event.title}?
              </p>
              <p className="text-xs text-red-500 mt-2 font-medium">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-semibold text-[#5d5d5d] dark:text-[#b4b4b4] bg-[#f4f4f4] dark:bg-[#383838] hover:bg-[#e5e5e5] dark:hover:bg-[#404040] rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deleteMutation.isPending ? "Deleting..." : "Delete Event"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showCompleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() =>
            !completeMutation.isPending && setShowCompleteConfirm(false)
          }
        />
        <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#10a37f]/10 flex items-center justify-center text-[#10a37f]">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0d0d0d] dark:text-white">
                Complete Event?
              </h3>
              <p className="text-sm text-[#5d5d5d] dark:text-[#b4b4b4] mt-2">
                Mark{" "}
                <span className="font-semibold text-[#0d0d0d] dark:text-white">
                  {event.title}
                </span>{" "}
                as completed?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setShowCompleteConfirm(false)}
              disabled={completeMutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-semibold text-[#5d5d5d] dark:text-[#b4b4b4] bg-[#f4f4f4] dark:bg-[#383838] hover:bg-[#e5e5e5] dark:hover:bg-[#404040] rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="flex-1 px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {completeMutation.isPending ? "Completing..." : "Mark Complete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Header with dynamic color banner */}
        <div className="h-2 w-full" style={{ backgroundColor: badgeColor }} />

        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex gap-4 items-start">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: badgeColor }}
            >
              {getIcon()}
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#8e8e8e] uppercase tracking-wider mb-1">
                {event.source.replace("_", " ")}
              </p>
              <h2 className="text-xl font-bold text-[#0d0d0d] dark:text-white leading-tight pr-4">
                {event.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#f4f4f4] dark:hover:bg-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] transition-colors -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 pt-0 flex-1 overflow-y-auto">
          <div className="bg-[#f9f9f9] dark:bg-[#252525] rounded-xl border border-[#e5e5e5] dark:border-[#383838] overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-[#e5e5e5] dark:divide-[#383838]">
              {/* Date */}
              <div className="flex items-center gap-4 p-4 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#10a37f]/10 dark:bg-[#10a37f]/20/30 flex items-center justify-center text-[#10a37f] dark:text-[#12b88f] shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8e8e8e]">Date</p>
                  <p className="text-[14px] font-medium text-[#0d0d0d] dark:text-white">
                    {dateString}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-4 p-4 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8e8e8e]">Time</p>
                  <p className="text-[14px] font-medium text-[#0d0d0d] dark:text-white">
                    {timeString}
                  </p>
                </div>
              </div>

              {/* Status (Inferred from title or existence of ID. Just a basic placeholder since we don't have explicit status in the Event API) */}
              <div className="flex items-center gap-4 p-4 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8e8e8e]">Status</p>
                  <p className="text-[14px] font-medium text-[#0d0d0d] dark:text-white">
                    Scheduled
                  </p>
                </div>
              </div>

              {/* Animal */}
              <div className="flex items-center gap-4 p-4 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8e8e8e]">Animal</p>
                  <p className="text-[14px] font-medium text-[#0d0d0d] dark:text-white">
                    {event.animalNumber ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20 font-bold tracking-wide">
                        {event.animalNumber}
                      </span>
                    ) : (
                      <span className="text-[#8e8e8e] italic">
                        Not specified
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Farm - if present */}
              {event.farmId && (
                <div className="flex items-center gap-4 p-4 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#8e8e8e]">Farm</p>
                    <p className="text-[14px] font-medium text-[#0d0d0d] dark:text-white">
                      Attached to farm
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Block */}
          {event.description && (
            <div className="mt-5 space-y-2">
              <h3 className="text-xs font-bold text-[#0d0d0d] dark:text-[#e5e5e5] uppercase tracking-wider">
                Description & Notes
              </h3>
              <div className="bg-[#f9f9f9] dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#383838] p-4 rounded-xl text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4] whitespace-pre-wrap leading-relaxed">
                {event.description}
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-5 pt-4 border-t border-[#e5e5e5] dark:border-[#383838] bg-[#fafafa] dark:bg-[#2a2a2a] flex flex-col sm:flex-row items-center gap-3">
          <div className="flex w-full sm:w-auto flex-1 gap-2">
            {isCustom && (
              <>
                <button
                  onClick={onEdit}
                  className="flex-1 sm:flex-none px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-colors shadow-sm"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-900/20 dark:hover:bg-red-600 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
            {/* Complete button is generic, but wait, the backend only supports completing specific ones */}
            {!isCustom &&
              (event.id.startsWith("vac_") || event.id.startsWith("trt_")) && (
                <button
                  onClick={() => setShowCompleteConfirm(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Complete
                </button>
              )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-[#5d5d5d] dark:text-[#b4b4b4] bg-white dark:bg-[#383838] border border-[#e5e5e5] dark:border-[#555] hover:bg-[#f4f4f4] dark:hover:bg-[#404040] rounded-xl transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
