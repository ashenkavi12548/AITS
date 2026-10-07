"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, CalendarCheck } from "lucide-react";
import {
  PregnancyCheck,
  CreatePregnancyCheckInput,
  PregnancyCheckType,
  PregnancyStatus,
  FemaleAnimalOption,
} from "@/types/breeding";

const todayStr = new Date().toISOString().split("T")[0];

const VET_SPECIALISTS = [
  "Dr. Nuwan Fernando (Veterinary Officer)",
  "Dr. Nimal Jayawardena (Senior Vet Surgeon)",
  "Roshan Silva (Senior AI Specialist)",
  "Dr. Priyantha Dissanayake (Livestock Vet)",
];

const pdSchema = z.object({
  farmId: z.string().min(1, "Farm identifier is required."),
  femaleAnimalId: z.string().min(1, "Please select a female cow."),
  checkDate: z
    .string()
    .min(1, "Check date is required.")
    .refine((val) => val <= todayStr, {
      message: "Completed check date cannot be in the future.",
    }),
  checkType: z.enum(
    ["60_DAY_CHECK", "90_DAY_CHECK", "ADDITIONAL_CHECK"] as const,
    {
      message: "Check type is required.",
    },
  ),
  checkMethod: z.string().min(1, "Check method is required."),
  pregnancyStatus: z.enum(
    [
      "NOT_CHECKED",
      "CONFIRMED",
      "NOT_PREGNANT",
      "RECHECK_REQUIRED",
      "PREGNANCY_LOST",
    ] as const,
    { message: "Pregnancy result status is required." },
  ),
  pregnancyStageDays: z
    .number()
    .min(1, "Gestation days must be greater than 0."),
  technicianOrVet: z
    .string()
    .min(1, "Veterinarian or technician name is required."),
  estimatedCalvingDate: z
    .string()
    .min(1, "Estimated calving date is required."),
  notes: z.string().optional(),
});

type PDFormData = z.infer<typeof pdSchema>;

interface PregnancyCheckFormModalProps {
  isOpen: boolean;
  initialData?: PregnancyCheck | null;
  femaleAnimals: FemaleAnimalOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePregnancyCheckInput) => Promise<boolean>;
}

export const PregnancyCheckFormModal: React.FC<
  PregnancyCheckFormModalProps
> = ({
  isOpen,
  initialData,
  femaleAnimals,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [vetOption, setVetOption] = useState<string>(() => {
    if (isOpen && initialData) {
      return VET_SPECIALISTS.includes(initialData.technicianOrVet)
        ? initialData.technicianOrVet
        : "VISITING";
    }
    return VET_SPECIALISTS[0];
  });
  const [visitingVetName, setVisitingVetName] = useState(() => {
    if (isOpen && initialData) {
      return VET_SPECIALISTS.includes(initialData.technicianOrVet)
        ? ""
        : initialData.technicianOrVet || "";
    }
    return "";
  });

  const [prevInitialData, setPrevInitialData] = useState<PregnancyCheck | null | undefined>(initialData);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (initialData !== prevInitialData || isOpen !== prevIsOpen) {
    setPrevInitialData(initialData);
    setPrevIsOpen(isOpen);
    if (isOpen && initialData) {
      const isRegistered = VET_SPECIALISTS.includes(initialData.technicianOrVet);
      setVetOption(isRegistered ? initialData.technicianOrVet : "VISITING");
      setVisitingVetName(isRegistered ? "" : (initialData.technicianOrVet || ""));
    } else if (isOpen) {
      setVetOption(VET_SPECIALISTS[0]);
      setVisitingVetName("");
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<PDFormData>({
    resolver: zodResolver(pdSchema),
    defaultValues: {
      farmId: "",
      femaleAnimalId: "",
      checkDate: todayStr,
      checkType: "60_DAY_CHECK",
      checkMethod: "Transrectal Ultrasound",
      pregnancyStatus: "CONFIRMED",
      pregnancyStageDays: 60,
      technicianOrVet: VET_SPECIALISTS[0],
      estimatedCalvingDate: "",
      notes: "",
    },
  });

  const selectedCheckDate = useWatch({ control, name: "checkDate" });
  const selectedFemaleId = useWatch({ control, name: "femaleAnimalId" });
  const selectedCow = femaleAnimals.find((a) => a.id === selectedFemaleId);

  useEffect(() => {
    if (selectedCheckDate) {
      const d = new Date(selectedCheckDate);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 223); // ~283 total from 60d
        setValue("estimatedCalvingDate", d.toISOString().split("T")[0]);
      }
    }
  }, [selectedCheckDate, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          farmId: initialData.farmId,
          femaleAnimalId: initialData.femaleAnimalId,
          checkDate: initialData.checkDate,
          checkType: initialData.checkType,
          checkMethod: initialData.checkMethod,
          pregnancyStatus: initialData.pregnancyStatus,
          pregnancyStageDays: initialData.pregnancyStageDays || 60,
          technicianOrVet: initialData.technicianOrVet,
          estimatedCalvingDate: initialData.estimatedCalvingDate,
          notes: initialData.notes || "",
        });
      } else {
        const firstCow = femaleAnimals[0];
        reset({
          farmId: firstCow?.farmId || "",
          femaleAnimalId: firstCow?.id || "",
          checkDate: todayStr,
          checkType: "60_DAY_CHECK",
          checkMethod: "Transrectal Ultrasound",
          pregnancyStatus: "CONFIRMED",
          pregnancyStageDays: 60,
          technicianOrVet: VET_SPECIALISTS[0],
          estimatedCalvingDate: "",
          notes: "",
        });
      }
    }
  }, [isOpen, initialData, femaleAnimals, reset]);

  if (!isOpen) return null;

  const handleCowChange = (cowId: string) => {
    setValue("femaleAnimalId", cowId, { shouldValidate: true });
    const cow = femaleAnimals.find((c) => c.id === cowId);
    if (cow) {
      setValue("farmId", cow.farmId, { shouldValidate: true });
    }
  };

  const handleVetChange = (val: string) => {
    setVetOption(val);
    if (val === "VISITING") {
      setValue("technicianOrVet", visitingVetName.trim(), {
        shouldValidate: true,
      });
    } else {
      setValue("technicianOrVet", val, { shouldValidate: true });
    }
  };

  const handleVisitingVetInput = (val: string) => {
    setVisitingVetName(val);
    setValue("technicianOrVet", val, { shouldValidate: true });
  };

  const onFormSubmit = async (data: PDFormData) => {
    const success = await onSubmit({
      farmId: data.farmId,
      femaleAnimalId: data.femaleAnimalId,
      checkDate: data.checkDate,
      checkType: data.checkType as PregnancyCheckType,
      checkMethod: data.checkMethod,
      pregnancyStatus: data.pregnancyStatus as PregnancyStatus,
      pregnancyStageDays: data.pregnancyStageDays,
      technicianOrVet: data.technicianOrVet,
      estimatedCalvingDate: data.estimatedCalvingDate,
      notes: data.notes,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] w-full max-w-lg rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between bg-[#f8faf8] dark:bg-[#212121]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                Record Pregnancy Diagnosis (PD)
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                Log transrectal or ultrasound pregnancy check result.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
        >
          <input type="hidden" {...register("farmId")} />

          {/* Female Cow Selection */}
          <div>
            <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
              Select Female Cow *
            </label>
            <select
              value={selectedFemaleId}
              onChange={(e) => handleCowChange(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border ${
                errors.femaleAnimalId
                  ? "border-rose-500"
                  : "border-[#e5e5e5] dark:border-[#383838]"
              } text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50`}
            >
              <option value="">Select cow from herd...</option>
              {femaleAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.tag} — {a.name} ({a.breed} • {a.farmName || "Primary Farm"}
                  )
                </option>
              ))}
            </select>
            {errors.femaleAnimalId && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                {errors.femaleAnimalId.message}
              </p>
            )}
            {selectedCow && (
              <div className="mt-1.5 text-[11px] text-[#737373] dark:text-[#8e8e8e] flex items-center gap-2">
                <span>
                  Facility:{" "}
                  <strong className="text-[#0d0d0d] dark:text-white">
                    {selectedCow.farmName || "Primary Farm"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Current Status:{" "}
                  <strong className="text-[#10a37f]">
                    {selectedCow.reproductiveStatus}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                Check Date *
              </label>
              <input
                type="date"
                max={todayStr}
                {...register("checkDate")}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
              />
              {errors.checkDate && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.checkDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                Check Type *
              </label>
              <select
                {...register("checkType")}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
              >
                <option value="60_DAY_CHECK">60-Day Check</option>
                <option value="90_DAY_CHECK">90-Day Check</option>
                <option value="ADDITIONAL_CHECK">Additional Recheck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                Diagnostic Method *
              </label>
              <input
                type="text"
                placeholder="e.g. Transrectal Ultrasound"
                {...register("checkMethod")}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                Pregnancy Result *
              </label>
              <select
                {...register("pregnancyStatus")}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
              >
                <option value="CONFIRMED">Confirmed Pregnant</option>
                <option value="RECHECK_REQUIRED">
                  Recheck Required (Fluid present)
                </option>
                <option value="NOT_PREGNANT">Not Pregnant (Open)</option>
                <option value="PREGNANCY_LOST">Pregnancy Lost / Aborted</option>
              </select>
            </div>
          </div>

          {/* Veterinarian / Specialist Selection */}
          <div>
            <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
              Veterinarian / Specialist *
            </label>
            <select
              value={vetOption}
              onChange={(e) => handleVetChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
            >
              <optgroup label="Registered Veterinary Specialists">
                {VET_SPECIALISTS.map((vet) => (
                  <option key={vet} value={vet}>
                    {vet}
                  </option>
                ))}
              </optgroup>
              <optgroup label="External Specialists">
                <option value="VISITING">
                  ➕ Visiting / External Vet Surgeon...
                </option>
              </optgroup>
            </select>

            {vetOption === "VISITING" && (
              <div className="mt-2 space-y-1">
                <input
                  type="text"
                  value={visitingVetName}
                  onChange={(e) => handleVisitingVetInput(e.target.value)}
                  placeholder="Enter Visiting Vet Name & Clinic (e.g. Dr. M. Jayasinghe - Govt VS)"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-amber-500/40 text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            )}
            {errors.technicianOrVet && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                {errors.technicianOrVet.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
              Estimated Calving Date *
            </label>
            <input
              type="date"
              {...register("estimatedCalvingDate")}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#166534] dark:text-[#22C55E] font-bold focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
              Notes & Clinical Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Ultrasound observations, uterine tone, corpus luteum presence..."
              {...register("notes")}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#e5e5e5] dark:border-[#383838] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#383838] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save PD Diagnosis</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
