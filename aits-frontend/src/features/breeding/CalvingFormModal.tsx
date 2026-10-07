"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { X, Loader2, Baby, Plus, CheckCircle2 } from "lucide-react";
import {
  CalvingRecord,
  CreateCalvingInput,
  CalvingStatus,
  FemaleAnimalOption,
} from "@/types/breeding";

const todayStr = new Date().toISOString().split("T")[0];

const STAFF_RECORDERS = [
  "Kasun Wijesinghe (Farm Manager)",
  "Dr. Nuwan Fernando (Veterinary Officer)",
  "Roshan Silva (Senior AI Specialist)",
  "Sunil Perera (Livestock Attendant)",
];

const calvingSchema = z.object({
  farmId: z.string().min(1, "Farm identifier is required."),
  motherAnimalId: z.string().min(1, "Please select a mother cow."),
  expectedCalvingDate: z.string().min(1, "Expected calving date is required."),
  actualCalvingDate: z
    .string()
    .min(1, "Actual calving date is required.")
    .refine((val) => val <= todayStr, {
      message: "Actual calving date cannot be in the future.",
    }),
  calvingStatus: z.enum(
    [
      "EXPECTED",
      "COMPLETED",
      "OVERDUE",
      "COMPLICATED",
      "ABORTED",
      "STILLBIRTH",
    ] as const,
    {
      message: "Calving status is required.",
    },
  ),
  numberOfCalves: z.number().min(1, "Number of calves must be at least 1."),
  calfGender: z.enum(["MALE", "FEMALE", "TWINS_MIXED"] as const).optional(),
  calfBirthWeightKg: z.number().optional(),
  calfStatus: z.enum(["HEALTHY", "WEAK", "STILLBORN"] as const).optional(),
  birthDifficulty: z
    .enum(["EASY", "MODERATE", "SEVERE_DYSTOCIA"] as const)
    .optional(),
  assistanceRequired: z.boolean(),
  complications: z.string().optional(),
  recordedBy: z.string().min(1, "Staff / Vet name is required."),
  notes: z.string().optional(),
});

type CalvingFormData = z.infer<typeof calvingSchema>;

interface CalvingFormModalProps {
  isOpen: boolean;
  initialData?: CalvingRecord | null;
  femaleAnimals: FemaleAnimalOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCalvingInput) => Promise<boolean>;
}

export const CalvingFormModal: React.FC<CalvingFormModalProps> = ({
  isOpen,
  initialData,
  femaleAnimals,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [isSuccessState, setIsSuccessState] = useState(false);
  const [recorderOption, setRecorderOption] = useState<string>(() => {
    if (initialData) {
      return STAFF_RECORDERS.includes(initialData.recordedBy || "")
        ? initialData.recordedBy || STAFF_RECORDERS[0]
        : "OTHER";
    }
    return STAFF_RECORDERS[0];
  });
  const [customRecorder, setCustomRecorder] = useState<string>(() => {
    if (initialData && !STAFF_RECORDERS.includes(initialData.recordedBy || "")) {
      return initialData.recordedBy || "";
    }
    return "";
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CalvingFormData>({
    resolver: zodResolver(calvingSchema),
    defaultValues: {
      farmId: "",
      motherAnimalId: "",
      expectedCalvingDate: todayStr,
      actualCalvingDate: todayStr,
      calvingStatus: "COMPLETED",
      numberOfCalves: 1,
      calfGender: "FEMALE",
      calfBirthWeightKg: 32.5,
      calfStatus: "HEALTHY",
      birthDifficulty: "EASY",
      assistanceRequired: false,
      recordedBy: STAFF_RECORDERS[0],
      notes: "",
    },
  });

  const selectedMotherId = useWatch({ control, name: "motherAnimalId" });
  const selectedCow = femaleAnimals.find((a) => a.id === selectedMotherId);

  useEffect(() => {
    if (initialData) {
      reset({
        farmId: initialData.farmId,
        motherAnimalId: initialData.motherAnimalId,
        expectedCalvingDate: initialData.expectedCalvingDate,
        actualCalvingDate: initialData.actualCalvingDate || todayStr,
        calvingStatus: initialData.calvingStatus,
        numberOfCalves: initialData.numberOfCalves || 1,
        calfGender: initialData.calfGender || "FEMALE",
        calfBirthWeightKg: initialData.calfBirthWeightKg || 32.5,
        calfStatus: initialData.calfStatus || "HEALTHY",
        birthDifficulty: initialData.birthDifficulty || "EASY",
        assistanceRequired: initialData.assistanceRequired || false,
        complications: initialData.complications || "",
        recordedBy: initialData.recordedBy || STAFF_RECORDERS[0],
        notes: initialData.notes || "",
      });
    } else {
      const firstCow = femaleAnimals[0];
      reset({
        farmId: firstCow?.farmId || "",
        motherAnimalId: firstCow?.id || "",
        expectedCalvingDate: todayStr,
        actualCalvingDate: todayStr,
        calvingStatus: "COMPLETED",
        numberOfCalves: 1,
        calfGender: "FEMALE",
        calfBirthWeightKg: 32.5,
        calfStatus: "HEALTHY",
        birthDifficulty: "EASY",
        assistanceRequired: false,
        recordedBy: STAFF_RECORDERS[0],
        notes: "",
      });
    }
  }, [initialData, femaleAnimals, reset]);

  if (!isOpen) return null;

  const handleMotherCowChange = (cowId: string) => {
    setValue("motherAnimalId", cowId, { shouldValidate: true });
    const cow = femaleAnimals.find((c) => c.id === cowId);
    if (cow) {
      setValue("farmId", cow.farmId, { shouldValidate: true });
    }
  };

  const handleRecorderChange = (val: string) => {
    setRecorderOption(val);
    if (val === "OTHER") {
      setValue("recordedBy", customRecorder.trim(), { shouldValidate: true });
    } else {
      setValue("recordedBy", val, { shouldValidate: true });
    }
  };

  const handleCustomRecorderInput = (val: string) => {
    setCustomRecorder(val);
    setValue("recordedBy", val, { shouldValidate: true });
  };

  const onFormSubmit = async (data: CalvingFormData) => {
    const success = await onSubmit({
      farmId: data.farmId,
      motherAnimalId: data.motherAnimalId,
      expectedCalvingDate: data.expectedCalvingDate,
      actualCalvingDate: data.actualCalvingDate,
      calvingStatus: data.calvingStatus as CalvingStatus,
      numberOfCalves: data.numberOfCalves,
      calfGender: data.calfGender,
      calfBirthWeightKg: data.calfBirthWeightKg,
      calfStatus: data.calfStatus,
      birthDifficulty: data.birthDifficulty,
      assistanceRequired: data.assistanceRequired,
      complications: data.complications,
      recordedBy: data.recordedBy,
      notes: data.notes,
    });

    if (success) {
      setIsSuccessState(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] w-full max-w-lg rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between bg-[#f8faf8] dark:bg-[#212121]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Baby className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                Record Calving Event
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                Log birth outcomes, weight, and calf status.
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

        {/* Success Trigger Prompt */}
        {isSuccessState ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                Calving Recorded Successfully!
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1 max-w-xs mx-auto">
                Would you like to register the newborn calf with a new ear tag &
                QR code in Animal Management?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link
                href="/animals/register"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#166534] text-white hover:bg-[#14532d] transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Register Calf Now</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
          >
            <input type="hidden" {...register("farmId")} />

            {/* Mother Cow */}
            <div>
              <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                Mother Cow *
              </label>
              <select
                value={selectedMotherId}
                onChange={(e) => handleMotherCowChange(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border ${
                  errors.motherAnimalId
                    ? "border-rose-500"
                    : "border-[#e5e5e5] dark:border-[#383838]"
                } text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50`}
              >
                <option value="">Select mother cow...</option>
                {femaleAnimals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tag} — {a.name} ({a.breed} •{" "}
                    {a.farmName || "Primary Farm"})
                  </option>
                ))}
              </select>
              {errors.motherAnimalId && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.motherAnimalId.message}
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
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Expected Calving Date *
                </label>
                <input
                  type="date"
                  {...register("expectedCalvingDate")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Actual Birth Date *
                </label>
                <input
                  type="date"
                  max={todayStr}
                  {...register("actualCalvingDate")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#166534] dark:text-[#22C55E] font-bold focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Calving Outcome *
                </label>
                <select
                  {...register("calvingStatus")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
                >
                  <option value="COMPLETED">Completed (Normal)</option>
                  <option value="COMPLICATED">Complicated (Dystocia)</option>
                  <option value="ABORTED">Aborted</option>
                  <option value="STILLBIRTH">Stillbirth</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  # Calves Born *
                </label>
                <input
                  type="number"
                  min="1"
                  {...register("numberOfCalves", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Calf Gender
                </label>
                <select
                  {...register("calfGender")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
                >
                  <option value="FEMALE">Female (Heifer)</option>
                  <option value="MALE">Male (Bull Calf)</option>
                  <option value="TWINS_MIXED">Twins (Mixed)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Birth Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 34.5"
                  {...register("calfBirthWeightKg", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Recorded By Staff *
                </label>
                <select
                  value={recorderOption}
                  onChange={(e) => handleRecorderChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50"
                >
                  <optgroup label="Farm Staff">
                    {STAFF_RECORDERS.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Personnel">
                    <option value="OTHER">➕ Other Staff / Attendant...</option>
                  </optgroup>
                </select>

                {recorderOption === "OTHER" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customRecorder}
                      onChange={(e) =>
                        handleCustomRecorderInput(e.target.value)
                      }
                      placeholder="Enter Staff / Attendant Name"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-amber-500/40 text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                )}
                {errors.recordedBy && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    {errors.recordedBy.message}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("assistanceRequired")}
                  className="accent-[#10a37f]"
                />
                <span className="font-bold text-[#0d0d0d] dark:text-white">
                  Veterinary / Staff Assistance Required
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                Notes & Complications
              </label>
              <textarea
                rows={2}
                placeholder="Unassisted birth, colostrum intake, maternal health..."
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
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] transition-colors cursor-pointer"
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
                  <span>Log Calving Record</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
