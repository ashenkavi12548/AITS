"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Route,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Truck,
  Phone,
  UserCheck,
} from "lucide-react";
import { traceabilityService } from "@/services/traceability.service";
import { MovementReason } from "@/types/traceability.types";

interface FarmOption {
  id: string;
  name: string;
  province?: string;
  city?: string;
}

interface CowMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animalId: string;
  animalNumber: string;
  animalName?: string;
  currentFarmId: string;
  currentFarmName?: string;
}

const REASON_LABELS: Record<MovementReason, string> = {
  PERMANENT_TRANSFER: "Permanent Transfer",
  TEMPORARY_TRANSFER: "Temporary Relocation",
  VETERINARY_VISIT: "Veterinary Referral / Hospital",
  BREEDING_PURPOSE: "Breeding Station / AI Center",
  GRAZING: "Pasture Rotation / Grazing Land",
  SALE_OR_MARKET: "Livestock Auction / Market Sale",
  RETURN_TO_ORIGINAL_FARM: "Return to Registered Home Facility",
  OTHER: "Other Special Transit",
};

export default function CowMovementModal({
  isOpen,
  onClose,
  onSuccess,
  animalId,
  animalNumber,
  animalName,
  currentFarmId,
  currentFarmName,
}: CowMovementModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(false);

  const [toFarmId, setToFarmId] = useState("");
  const [departureDate, setDepartureDate] = useState(todayStr);
  const [departureTime, setDepartureTime] = useState(nowTime);
  const [expectedArrivalDate, setExpectedArrivalDate] = useState(todayStr);
  const [expectedArrivalTime, setExpectedArrivalTime] = useState("16:00");
  const [reason, setReason] = useState<MovementReason>("PERMANENT_TRANSFER");
  const [vehicleNumber, setVehicleNumber] = useState("WP-CAB-4821");
  const [driverName, setDriverName] = useState("Nimal Jayawardena");
  const [driverContact, setDriverContact] = useState("+94 77 123 4567");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load farms list for destination selection
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingFarms(true);

    traceabilityService
      .getActiveFarms()
      .then((data) => {
        if (cancelled) return;
        setFarms(data);
        // Default destination to a farm other than current
        const dest = data.find((f) => f.id !== currentFarmId) || data[0];
        if (dest) setToFarmId(dest.id);
      })
      .catch((err) => {
        console.error("Failed to load farms for transfer:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFarms(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentFarmId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFarmId) {
      setErrorMsg("Origin facility is unknown for this animal.");
      return;
    }
    if (!toFarmId || toFarmId === currentFarmId) {
      setErrorMsg(
        "Please select a destination facility different from current farm.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await traceabilityService.createFarmMovement({
        animalId,
        fromFarmId: currentFarmId,
        toFarmId,
        departureDate,
        departureTime,
        expectedArrivalDate,
        expectedArrivalTime,
        reason,
        vehicleNumber: vehicleNumber.trim() || undefined,
        driverName: driverName.trim() || undefined,
        driverContact: driverContact.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to schedule farm movement.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eligibleDestinations = farms.filter((f) => f.id !== currentFarmId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1f1f1f] rounded-3xl border border-gray-200 dark:border-[#383838] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800/80 bg-linear-to-r from-purple-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Route className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Record Farm Movement</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {animalNumber}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                {animalName ? `"${animalName}"` : "Scanned Cow"} &bull; Origin:{" "}
                {currentFarmName || "Current Farm"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Movement Route: Origin & Destination */}
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Origin Facility</span>
              <span>&rarr;</span>
              <span>Destination Facility</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Origin (Locked) */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  From (Current Farm)
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  <span className="truncate">
                    {currentFarmName || "Registered Facility"}
                  </span>
                </span>
              </div>

              {/* Destination Select */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#262626] border border-purple-300 dark:border-purple-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">
                  To (Destination) *
                </span>
                {isLoadingFarms ? (
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading farms...</span>
                  </div>
                ) : (
                  <select
                    value={toFarmId}
                    onChange={(e) => setToFarmId(e.target.value)}
                    required
                    className="w-full text-xs font-bold text-gray-900 dark:text-white bg-transparent focus:outline-none cursor-pointer"
                  >
                    {eligibleDestinations.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} {f.city ? `(${f.city})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Movement Reason / Purpose
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as MovementReason)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Object.entries(REASON_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Departure & Arrival Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                <span>Departure Schedule</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  className="px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
                />
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span>Expected Arrival</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={expectedArrivalDate}
                  min={departureDate}
                  onChange={(e) => setExpectedArrivalDate(e.target.value)}
                  required
                  className="px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
                />
                <input
                  type="time"
                  value={expectedArrivalTime}
                  onChange={(e) => setExpectedArrivalTime(e.target.value)}
                  required
                  className="px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Transport Details (Vehicle, Driver, Contact) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-gray-500" />
                <span>Vehicle Plate</span>
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. WP-CAB-4821"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                <span>Driver Name</span>
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Driver full name"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>Driver Phone</span>
              </label>
              <input
                type="text"
                value={driverContact}
                onChange={(e) => setDriverContact(e.target.value)}
                placeholder="+94 77..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Transit Notes &amp; Biosecurity Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched with veterinary transport manifest, animal fed before departure..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scheduling Transit...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Schedule Movement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
