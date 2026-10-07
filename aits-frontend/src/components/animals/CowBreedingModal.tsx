"use client";

import React, { useState } from "react";
import {
  X,
  Dna,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  FlaskConical,
} from "lucide-react";
import { breedingService } from "@/services/breeding.service";
import { BreedingMethod } from "@/types/breeding";

interface CowBreedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animalId: string;
  animalNumber: string;
  animalName?: string;
  farmId: string;
  farmName?: string;
}

const COMMON_TECHNICIANS = [
  "Roshan Silva (Senior AI Specialist)",
  "Kasun Wijesinghe (Farm AI Tech)",
  "Dr. Nuwan Fernando (Veterinary Officer)",
  "Sunil Perera (Livestock Operations)",
];

export default function CowBreedingModal({
  isOpen,
  onClose,
  onSuccess,
  animalId,
  animalNumber,
  animalName,
  farmId,
  farmName,
}: CowBreedingModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [serviceDate, setServiceDate] = useState(todayStr);
  const [serviceMethod, setServiceMethod] = useState<BreedingMethod>(
    "ARTIFICIAL_INSEMINATION",
  );
  const [strawCode, setStrawCode] = useState("STR-HOL-2026-99");
  const [bullTag, setBullTag] = useState("");
  const [technicianName, setTechnicianName] = useState(COMMON_TECHNICIANS[0]);
  const [heatSigns, setHeatSigns] = useState(
    "Standing heat observed, clear mucosal discharge",
  );
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId) {
      setErrorMsg("Origin facility is unknown for this cow.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const breedingNotes = [
        notes.trim(),
        heatSigns.trim() ? `Heat Signs: ${heatSigns.trim()}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      await breedingService.createBreedingRecord({
        farmId,
        femaleAnimalId: animalId,
        serviceDate,
        serviceMethod,
        attemptNumber: 1,
        technician: technicianName.trim() || "Veterinary Technician",
        semenStrawId:
          serviceMethod === "ARTIFICIAL_INSEMINATION" && strawCode.trim()
            ? strawCode.trim()
            : undefined,
        bullTag:
          serviceMethod === "NATURAL" && strawCode.trim()
            ? strawCode.trim()
            : undefined,
        notes: breedingNotes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to record breeding service.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800/80 bg-linear-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Log Breeding / AI Service</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {animalNumber}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                {animalName ? `"${animalName}"` : "Scanned Cow"} &bull;
                Facility: {farmName || "Current Farm"}
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
          {/* Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Breeding Service Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: "ARTIFICIAL_INSEMINATION",
                  label: "Artificial Insemination (AI)",
                  icon: FlaskConical,
                },
                {
                  id: "NATURAL",
                  label: "Natural Bull Service",
                  icon: Dna,
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = serviceMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setServiceMethod(m.id as BreedingMethod)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262626] text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Date */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Service Date</span>
            </label>
            <input
              type="date"
              value={serviceDate}
              max={todayStr}
              onChange={(e) => setServiceDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs font-medium text-gray-900 dark:text-white"
            />
          </div>

          {/* Conditional: AI Straw vs Bull */}
          {serviceMethod === "ARTIFICIAL_INSEMINATION" ? (
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                <span>Semen Straw Batch / Sire Code</span>
              </label>
              <input
                type="text"
                value={strawCode}
                onChange={(e) => setStrawCode(e.target.value)}
                placeholder="e.g. STR-HOL-2026-99"
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs font-mono font-bold text-gray-900 dark:text-white"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Dna className="w-3.5 h-3.5 text-amber-600" />
                <span>Sire Bull Tag Number (Optional)</span>
              </label>
              <input
                type="text"
                value={bullTag}
                onChange={(e) => setBullTag(e.target.value)}
                placeholder="e.g. LK-BUL-00042"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs font-mono font-bold text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Insemination Technician */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Certified AI Technician / Officer</span>
            </label>
            <input
              type="text"
              list="technicians-list"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="Technician full name"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
            />
            <datalist id="technicians-list">
              {COMMON_TECHNICIANS.map((tech) => (
                <option key={tech} value={tech} />
              ))}
            </datalist>
          </div>

          {/* Heat Signs */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Estrus &amp; Heat Signs Observed
            </label>
            <input
              type="text"
              value={heatSigns}
              onChange={(e) => setHeatSigns(e.target.value)}
              placeholder="e.g. Standing heat, vulvar swelling, clear mucus..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Breeding Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Expected 21-day return check scheduled..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Service...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Breeding Service</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
