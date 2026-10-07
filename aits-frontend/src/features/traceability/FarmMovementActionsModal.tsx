"use client";

import React, { useState } from "react";
import {
  X,
  Loader2,
  Navigation,
  Clock,
  Truck,
  ArrowRight,
  Tag,
} from "lucide-react";
import { FarmMovement } from "@/types/traceability.types";
import {
  MOVEMENT_STATUS_LABELS,
  MOVEMENT_REASON_LABELS,
} from "@/constants/traceability.constants";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";

interface FarmMovementActionsModalProps {
  movement: FarmMovement | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkInTransit: (id: string) => Promise<void>;
  onConfirmArrival: (
    id: string,
    data: { actualArrivalDate: string; actualArrivalTime: string },
  ) => Promise<void>;
  onCancelMovement: (id: string, reason?: string) => Promise<void>;
}

export const FarmMovementActionsModal: React.FC<
  FarmMovementActionsModalProps
> = ({
  movement,
  isOpen,
  onClose,
  onMarkInTransit,
  onConfirmArrival,
  onCancelMovement,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [actualDate, setActualDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [actualTime, setActualTime] = useState("14:00");

  const activeFarmId = useAuthStore((state) => state.activeFarmId);
  const user = useAuthStore((state) => state.user);

  if (!isOpen || !movement) return null;

  const currentFarmId = activeFarmId || user?.primaryFarmId;
  const isSender = currentFarmId === movement.fromFarmId;
  const isReceiver = currentFarmId === movement.toFarmId;
  const isAdmin =
    user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");

  const canMarkInTransit = isSender || isAdmin;
  const canConfirmArrival = isReceiver || isAdmin;

  const handleInTransit = async () => {
    setLoadingAction("in_transit");
    try {
      await onMarkInTransit(movement.id);
      toast.success("Movement status updated to In Transit!");
      onClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirmArrival = async () => {
    setLoadingAction("confirm_arrival");
    try {
      await onConfirmArrival(movement.id, {
        actualArrivalDate: actualDate,
        actualArrivalTime: actualTime,
      });
      toast.success("Movement completed! Animal added to the system.");
      onClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to confirm arrival",
      );
    } finally {
      setLoadingAction(null);
    }
  };


  const handleCancel = async () => {
    setLoadingAction("cancel");
    try {
      await onCancelMovement(movement.id, cancelReason);
      toast.success("Movement request cancelled.");
      onClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel movement",
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const badge = MOVEMENT_STATUS_LABELS[movement.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#e5e5e5] dark:border-[#303030] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#10a37f]" />
              Manage Farm Movement #{movement.id.substring(0, 8)}
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Lifecycle actions & status updates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:bg-[#ececec] dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Banner */}
          <div className="p-3.5 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#303030] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#10a37f] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {movement.animalTag} ({movement.animalName})
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg} ${badge.text}`}
              >
                {badge.label}
              </span>
            </div>

            <div className="flex items-center gap-2 font-semibold text-[#0d0d0d] dark:text-white">
              <span className="truncate">{movement.fromFarmName}</span>
              <ArrowRight className="w-4 h-4 text-[#10a37f] shrink-0" />
              <span className="truncate">{movement.toFarmName}</span>
            </div>

            <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
              Reason:{" "}
              <strong className="text-[#0d0d0d] dark:text-[#ececec]">
                {MOVEMENT_REASON_LABELS[movement.reason]}
              </strong>{" "}
              • Departure: {movement.departureDate}
            </div>
          </div>

          {/* Transition Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {movement.status === "SCHEDULED" && canMarkInTransit && (
              <button
                onClick={handleInTransit}
                disabled={Boolean(loadingAction)}
                className="w-full p-3 bg-[#0e8c6d] hover:bg-[#0c7a5c] text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-60"
              >
                {loadingAction === "in_transit" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>Mark as In Transit</span>
              </button>
            )}

            {(movement.status === "SCHEDULED" ||
              movement.status === "IN_TRANSIT") &&
              canConfirmArrival && (
                <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20 space-y-2">
                  <span className="font-bold text-purple-700 dark:text-purple-300 block">
                    Confirm Animal Arrival
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={actualDate}
                      onChange={(e) => setActualDate(e.target.value)}
                      className="p-2 bg-white dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] rounded-lg text-[#0d0d0d] dark:text-white"
                    />
                    <input
                      type="time"
                      value={actualTime}
                      onChange={(e) => setActualTime(e.target.value)}
                      className="p-2 bg-white dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] rounded-lg text-[#0d0d0d] dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleConfirmArrival}
                    disabled={Boolean(loadingAction)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                  >
                    {loadingAction === "confirm_arrival" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>Confirm Arrival</span>
                  </button>
                </div>
              )}

            {/* Cancel Action */}
            {movement.status !== "COMPLETED" &&
              movement.status !== "CANCELLED" &&
              canMarkInTransit && (
                <div className="pt-2">
                  {!showCancelInput ? (
                    <button
                      onClick={() => setShowCancelInput(true)}
                      className="w-full py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      Cancel Movement
                    </button>
                  ) : (
                    <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 space-y-2">
                      <label className="block font-semibold text-rose-700 dark:text-rose-300">
                        Cancellation Reason
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Health quarantine or logistics issue"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] rounded-lg text-[#0d0d0d] dark:text-white"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setShowCancelInput(false)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#737373]"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={Boolean(loadingAction)}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5"
                        >
                          {loadingAction === "cancel" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          Confirm Cancellation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
