"use client";

import React, { useState, useEffect } from "react";
import { X, Syringe, Loader2 } from "lucide-react";
import { healthService } from "@/services/health.service";
import toast from "react-hot-toast";

interface VaccinationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vaccinationId: string | null | undefined;
  animal: {
    animalNumber: string;
    name?: string | null;
  };
  initialData?: {
    vaccineName: string;
    dose: string;
    vaccinationDate: string;
    nextDueDate?: string | null;
    status?: string;
  } | null;
}

export default function VaccinationEditModal({
  isOpen,
  onClose,
  onSuccess,
  vaccinationId,
  animal,
  initialData,
}: VaccinationEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDose, setVaccineDose] = useState("");
  const [vaccinationDate, setVaccinationDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [status, setStatus] = useState("COMPLETED");

  useEffect(() => {
    if (initialData && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVaccineName(initialData.vaccineName || "");
      setVaccineDose(initialData.dose || "");
      // Extract YYYY-MM-DD from ISO string
      setVaccinationDate(
        initialData.vaccinationDate
          ? initialData.vaccinationDate.split("T")[0]
          : "",
      );
      setNextDueDate(
        initialData.nextDueDate ? initialData.nextDueDate.split("T")[0] : "",
      );
      setStatus(initialData.status || "COMPLETED");
    }
  }, [initialData, isOpen]);

  if (!isOpen || !vaccinationId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await healthService.updateVaccination(vaccinationId, {
        vaccineName,
        dose: vaccineDose,
        nextDueDate: nextDueDate ? nextDueDate : null,
        status,
      } as unknown as Parameters<typeof healthService.updateVaccination>[1]);

      toast.success("Vaccination record updated successfully.");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to update vaccination:", err);
      const errResponse = (err as { response?: { data?: { message?: string } } }).response;
      toast.error(
        errResponse?.data?.message || "Failed to update vaccination",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-[#202020] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a]/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Syringe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Edit Vaccination
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {animal.name ? `${animal.name} • ` : ""}#{animal.animalNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 items-center justify-between">
              <span>Vaccination Date</span>
            </label>
            <input
              type="date"
              value={vaccinationDate}
              onChange={(e) => setVaccinationDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Vaccine Name
            </label>
            <input
              type="text"
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Dose Administered
            </label>
            <input
              type="text"
              value={vaccineDose}
              onChange={(e) => setVaccineDose(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Next Booster Due (Updates Calendar)
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 font-bold"
            >
              <option value="COMPLETED">COMPLETED</option>
              <option value="SCHEDULED">SCHEDULED (Booster)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
