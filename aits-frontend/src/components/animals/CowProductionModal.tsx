"use client";

import React, { useState } from "react";
import {
  X,
  Milk,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { productionService } from "@/services/production.service";
import { MilkingSession, MilkQualityStatus } from "@/types/production";

interface CowProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animalId: string;
  animalNumber: string;
  animalName?: string;
  farmId: string;
  farmName?: string;
}

function getDefaultSession(): MilkingSession {
  const hr = new Date().getHours();
  if (hr >= 4 && hr < 12) return "MORNING";
  if (hr >= 12 && hr < 17) return "AFTERNOON";
  return "EVENING";
}

export default function CowProductionModal({
  isOpen,
  onClose,
  onSuccess,
  animalId,
  animalNumber,
  animalName,
  farmId,
  farmName,
}: CowProductionModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [session, setSession] = useState<MilkingSession>(getDefaultSession());
  const [quantityLiters, setQuantityLiters] = useState<number>(14.5);
  const [qualityStatus, setQualityStatus] =
    useState<MilkQualityStatus>("ACCEPTED");
  const [fatPercentage, setFatPercentage] = useState<string>("3.8");
  const [proteinPercentage, setProteinPercentage] = useState<string>("3.2");
  const [somaticCellCount, setSomaticCellCount] = useState<string>("180");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId) {
      setErrorMsg("This animal is not assigned to a farm facility.");
      return;
    }
    if (quantityLiters <= 0) {
      setErrorMsg("Quantity must be greater than 0 liters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const advancedDetails = [
        notes.trim(),
        showAdvanced && fatPercentage ? `Fat: ${fatPercentage}%` : null,
        showAdvanced && proteinPercentage
          ? `Protein: ${proteinPercentage}%`
          : null,
        showAdvanced && somaticCellCount
          ? `SCC: ${somaticCellCount}k/mL`
          : null,
      ]
        .filter(Boolean)
        .join(" | ");

      await productionService.createRecord({
        animalId,
        farmId,
        date,
        session,
        quantityLiters: Number(quantityLiters),
        qualityStatus,
        notes: advancedDetails || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to record milk production yield.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustQty = (amount: number) => {
    setQuantityLiters((prev) =>
      Math.max(0.5, Number((prev + amount).toFixed(1))),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1f1f1f] rounded-3xl border border-gray-200 dark:border-[#383838] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800/80 bg-linear-to-r from-sky-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Milk className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Log Milk Yield</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {animalNumber}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                {animalName ? `"${animalName}"` : "Scanned Cow"} &bull;
                Facility: {farmName || "Primary Farm"}
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
          {/* Date and Milking Session */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                <span>Milking Date</span>
              </label>
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>Session Slot</span>
              </label>
              <select
                value={session}
                onChange={(e) =>
                  setSession(e.target.value as MilkingSession)
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="MORNING">Morning (04:00 - 11:00)</option>
                <option value="AFTERNOON">Afternoon (11:00 - 16:00)</option>
                <option value="EVENING">Evening (16:00 - 21:00)</option>
              </select>
            </div>
          </div>

          {/* Quantity in Liters with Touch Steppers */}
          <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/15 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Milk className="w-4 h-4 text-sky-500" />
                <span>Measured Yield (Liters)</span>
              </label>
              <div className="flex items-center gap-1">
                {[-5, -1, 1, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => adjustQty(delta)}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-gray-700 hover:border-sky-500 text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={quantityLiters}
                onChange={(e) =>
                  setQuantityLiters(parseFloat(e.target.value) || 0)
                }
                required
                className="w-full pl-4 pr-14 py-3 rounded-2xl border-2 border-sky-500/30 bg-white dark:bg-[#1a1a1a] text-2xl font-black text-sky-600 dark:text-sky-400 text-center focus:outline-none focus:border-sky-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">
                LITERS
              </span>
            </div>
          </div>

          {/* Quality Status Pill Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Milk Quality Grading
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "ACCEPTED",
                  label: "Accepted (Grade A)",
                  color:
                    "text-emerald-700 dark:text-emerald-300 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40",
                },
                {
                  id: "PENDING",
                  label: "Lab Pending",
                  color:
                    "text-amber-700 dark:text-amber-300 border-amber-300 bg-amber-50 dark:bg-amber-950/40",
                },
                {
                  id: "REJECTED",
                  label: "Rejected / Tainted",
                  color:
                    "text-rose-700 dark:text-rose-300 border-rose-300 bg-rose-50 dark:bg-rose-950/40",
                },
              ].map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() =>
                    setQualityStatus(q.id as MilkQualityStatus)
                  }
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    qualityStatus === q.id
                      ? `${q.color} ring-2 ring-sky-500 shadow-xs font-black`
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262626] text-gray-600 dark:text-gray-400 opacity-60 hover:opacity-100"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Advanced Laboratory Composition */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {showAdvanced
                  ? "Hide milk assay composition"
                  : "Add fat %, protein %, somatic cell count"}
              </span>
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Fat Content (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fatPercentage}
                  onChange={(e) => setFatPercentage(e.target.value)}
                  placeholder="3.8"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-xs font-semibold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Protein (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={proteinPercentage}
                  onChange={(e) => setProteinPercentage(e.target.value)}
                  placeholder="3.2"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-xs font-semibold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  SCC (x10³ / ml)
                </label>
                <input
                  type="number"
                  value={somaticCellCount}
                  onChange={(e) => setSomaticCellCount(e.target.value)}
                  placeholder="180"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-xs font-semibold text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Field Observations / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Clean flow, rapid letdown, measured on parlour meter #4..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Committing Yield...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Milk Yield</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
