"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Loader2,
  Dna,
  Calendar,
  PawPrint,
  User,
  CheckCircle2,
  FileText,
  Info,
  Building,
} from "lucide-react";
import {
  BreedingRecord,
  CreateBreedingInput,
  BreedingMethod,
  FemaleAnimalOption,
  BullOption,
  SemenStrawOption,
} from "@/types/breeding";
import AnimalTagAutocomplete from "@/components/common/AnimalTagAutocomplete";

const todayStr = new Date().toISOString().split("T")[0];

const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const FARM_TECHNICIANS = [
  "Roshan Silva (Senior AI Specialist)",
  "Kasun Wijesinghe (Farm AI Tech)",
  "Dr. Nuwan Fernando (Veterinary Officer)",
  "Sunil Perera (Livestock Operations)",
];

const breedingSchema = z.object({
  farmId: z.string().min(1, "Farm association is required."),
  femaleAnimalId: z.string().min(1, "Please search and select a female cow."),
  serviceDate: z
    .string()
    .min(1, "Service date is required.")
    .refine((val) => val <= todayStr, {
      message:
        "Future service dates are not allowed for completed service logs.",
    }),
  serviceMethod: z.enum(
    ["ARTIFICIAL_INSEMINATION", "NATURAL"] as const,
    {
      message: "Breeding method is required.",
    },
  ),
  attemptNumber: z.number().min(1, "Attempt number must be greater than 0."),
  technician: z.string().min(1, "Technician or specialist name is required."),
  notes: z.string().optional(),

  // AI fields
  semenStrawId: z.string().optional(),
  semenBatchNumber: z.string().optional(),
  semenSupplier: z.string().optional(),
  inseminationMethod: z.string().optional(),

  // Natural breeding fields
  bullId: z.string().optional(),
  bullTag: z.string().optional(),
  bullName: z.string().optional(),
  bullBreed: z.string().optional(),
  bullOwnerSource: z.string().optional(),

  // Dates
  firstPregnancyCheckDate: z.string().optional(),
  secondPregnancyCheckDate: z.string().optional(),
  estimatedCalvingDate: z.string().optional(),
});

type BreedingFormData = z.infer<typeof breedingSchema>;

interface BreedingFormModalProps {
  isOpen: boolean;
  initialData?: BreedingRecord | null;
  femaleAnimals: FemaleAnimalOption[];
  bulls: BullOption[];
  semenStraws: SemenStrawOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onFarmChange?: (farmId: string) => void;
  onSubmit: (data: CreateBreedingInput) => Promise<boolean>;
}

export const BreedingFormModal: React.FC<BreedingFormModalProps> = ({
  isOpen,
  initialData,
  femaleAnimals,
  bulls,
  semenStraws,
  isSubmitting,
  onClose,
  // onFarmChange is accepted for backward compatibility with parent components
  // but is intentionally unused: farm is now derived from the selected cow.
  onFarmChange: _onFarmChange,
  onSubmit,
}) => {
  const isEditing = Boolean(initialData);

  // Search & Autocomplete state
  const [selectedCow, setSelectedCow] = useState<FemaleAnimalOption | null>(
    null,
  );
  // Track if the form was already initialized for the current open session
  // so that prop changes (femaleAnimals, semenStraws) don't re-trigger the reset.
  const hasInitializedRef = useRef(false);

  // Technician selection state (Presets vs Visiting specialist)
  const [techOption, setTechOption] = useState<string>(FARM_TECHNICIANS[0]);
  const [visitingTechName, setVisitingTechName] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BreedingFormData>({
    resolver: zodResolver(breedingSchema),
    defaultValues: {
      farmId: "",
      femaleAnimalId: "",
      serviceDate: todayStr,
      serviceMethod: "ARTIFICIAL_INSEMINATION",
      attemptNumber: 1,
      technician: FARM_TECHNICIANS[0],
      notes: "",
      semenStrawId: "",
      semenBatchNumber: "",
      semenSupplier: "",
      inseminationMethod: "Recto-vaginal AI",
      bullId: "",
      bullName: "",
      bullBreed: "",
      firstPregnancyCheckDate: addDays(todayStr, 60),
      secondPregnancyCheckDate: addDays(todayStr, 90),
      estimatedCalvingDate: addDays(todayStr, 283),
    },
  });

  // react-hook-form's watch() returns a function incompatible with React Compiler
  // memoization. This is a known limitation of react-hook-form v7.
  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedMethod = watch("serviceMethod");
  const selectedServiceDate = watch("serviceDate");
  const selectedStrawId = watch("semenStrawId");
  const selectedBullId = watch("bullId");

  // Track whether the user has manually overridden the auto-calculated calving date
  const [calvingDateOverridden, setCalvingDateOverridden] = useState(false);

  // Auto calculate dates whenever serviceDate changes.
  // Only overwrite estimatedCalvingDate if the user has NOT manually set it.
  useEffect(() => {
    if (selectedServiceDate) {
      setValue("firstPregnancyCheckDate", addDays(selectedServiceDate, 60));
      setValue("secondPregnancyCheckDate", addDays(selectedServiceDate, 90));
      if (!calvingDateOverridden) {
        setValue("estimatedCalvingDate", addDays(selectedServiceDate, 283));
      }
    }
  }, [selectedServiceDate, calvingDateOverridden, setValue]);

  // Auto fill straw details
  useEffect(() => {
    if (selectedStrawId) {
      const straw = semenStraws.find(
        (s) => s.strawId === selectedStrawId || s.id === selectedStrawId,
      );
      if (straw) {
        setValue("semenBatchNumber", straw.batchNumber);
        setValue("semenSupplier", straw.supplier);
        setValue("bullName", straw.bullName);
        setValue("bullBreed", straw.bullBreed);
      }
    }
  }, [selectedStrawId, semenStraws, setValue]);

  // Auto fill bull details
  useEffect(() => {
    if (selectedBullId) {
      const bull = bulls.find((b) => b.id === selectedBullId);
      if (bull) {
        setValue("bullTag", bull.tag);
        setValue("bullName", bull.name);
        setValue("bullBreed", bull.breed);
        setValue("bullOwnerSource", bull.source);
      }
    }
  }, [selectedBullId, bulls, setValue]);

  // Reset form and UI states ONLY when modal opens or initialData changes.
  // We deliberately do NOT include femaleAnimals/semenStraws in deps to prevent
  // the reset from firing when a cow is selected (which calls onFarmChange →
  // loadDropdowns → femaleAnimals prop update → unwanted form reset).
  useEffect(() => {
    if (!isOpen) {
      // Reset the initialization guard and any manual overrides when modal closes
      hasInitializedRef.current = false;
      setCalvingDateOverridden(false);
      return;
    }

    // Only initialize once per open session (guard against prop-change re-fires)
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (initialData) {
      const matched = femaleAnimals.find(
        (a) => a.id === initialData.femaleAnimalId,
      );
      const cowData: FemaleAnimalOption = matched || {
        id: initialData.femaleAnimalId,
        tag: initialData.femaleAnimalTag || "UNKNOWN",
        name: initialData.femaleAnimalName || "Cow",
        breed: initialData.femaleBreed || "Crossbred",
        dob: initialData.femaleDob || "Unknown",
        farmId: initialData.farmId,
        farmName: initialData.farmName || "Farm Facility",
        reproductiveStatus: initialData.reproductiveStatus || "OPEN",
      };
      setSelectedCow(cowData);

      const isPreset = FARM_TECHNICIANS.includes(initialData.technician);
      if (isPreset) {
        setTechOption(initialData.technician);
        setVisitingTechName("");
      } else {
        setTechOption("VISITING");
        setVisitingTechName(initialData.technician || "");
      }

      reset({
        farmId: initialData.farmId,
        femaleAnimalId: initialData.femaleAnimalId,
        serviceDate: initialData.serviceDate,
        serviceMethod: initialData.serviceMethod,
        attemptNumber: initialData.attemptNumber,
        technician: initialData.technician,
        notes: initialData.notes || "",
        semenStrawId: initialData.semenStrawId || "",
        semenBatchNumber: initialData.semenBatchNumber || "",
        semenSupplier: initialData.semenSupplier || "",
        inseminationMethod:
          initialData.inseminationMethod || "Recto-vaginal AI",
        bullId: initialData.bullId || "",
        bullTag: initialData.bullTag || "",
        bullName: initialData.bullName || "",
        bullBreed: initialData.bullBreed || "",
        bullOwnerSource: initialData.bullOwnerSource || "",
        firstPregnancyCheckDate: initialData.firstPregnancyCheckDate,
        secondPregnancyCheckDate: initialData.secondPregnancyCheckDate,
        estimatedCalvingDate: initialData.estimatedCalvingDate,
      });
      setSelectedCow(null);
      setTechOption(FARM_TECHNICIANS[0]);
      setVisitingTechName("");

      reset({
        farmId: "",
        femaleAnimalId: "",
        serviceDate: todayStr,
        serviceMethod: "ARTIFICIAL_INSEMINATION",
        attemptNumber: 1,
        technician: FARM_TECHNICIANS[0],
        notes: "",
        semenStrawId: semenStraws[0]?.strawId || "",
        semenBatchNumber: semenStraws[0]?.batchNumber || "",
        semenSupplier: semenStraws[0]?.supplier || "",
        inseminationMethod: "Recto-vaginal AI",
        bullId: "",
        bullTag: "",
        bullName: semenStraws[0]?.bullName || "",
        bullBreed: semenStraws[0]?.bullBreed || "",
        bullOwnerSource: "",
        firstPregnancyCheckDate: addDays(todayStr, 60),
        secondPregnancyCheckDate: addDays(todayStr, 90),
        estimatedCalvingDate: addDays(todayStr, 283),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  const handleSelectCow = (cow: FemaleAnimalOption) => {
    setSelectedCow(cow);
    setValue("femaleAnimalId", cow.id, { shouldValidate: true });
    setValue("farmId", cow.farmId, { shouldValidate: true });
    // NOTE: We intentionally do NOT call onFarmChange here.
    // Previously, calling onFarmChange triggered loadDropdowns in the parent,
    // which updated the femaleAnimals prop and re-triggered the reset useEffect,
    // wiping the just-selected cow. The farmId is already set from the cow object.
  };

  const handleClearCow = () => {
    setSelectedCow(null);
    setValue("femaleAnimalId", "", { shouldValidate: true });
    setValue("farmId", "", { shouldValidate: true });
  };

  const handleTechChange = (val: string) => {
    setTechOption(val);
    if (val === "VISITING") {
      setValue("technician", visitingTechName.trim(), { shouldValidate: true });
    } else {
      setValue("technician", val, { shouldValidate: true });
    }
  };

  const handleVisitingTechInput = (val: string) => {
    setVisitingTechName(val);
    setValue("technician", val, { shouldValidate: true });
  };

  if (!isOpen) return null;

  const onFormSubmit = async (data: BreedingFormData) => {
    const success = await onSubmit({
      farmId: data.farmId,
      femaleAnimalId: data.femaleAnimalId,
      serviceDate: data.serviceDate,
      serviceMethod: data.serviceMethod as BreedingMethod,
      attemptNumber: data.attemptNumber,
      technician: data.technician,
      notes: data.notes,
      semenStrawId: data.semenStrawId,
      semenBatchNumber: data.semenBatchNumber,
      semenSupplier: data.semenSupplier,
      inseminationMethod: data.inseminationMethod,
      bullId: data.bullId,
      bullTag: data.bullTag,
      bullName: data.bullName,
      bullBreed: data.bullBreed,
      bullOwnerSource: data.bullOwnerSource,
      firstPregnancyCheckDate: data.firstPregnancyCheckDate,
      secondPregnancyCheckDate: data.secondPregnancyCheckDate,
      estimatedCalvingDate: data.estimatedCalvingDate,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] w-full max-w-2xl rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between bg-[#f8faf8] dark:bg-[#212121]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center">
              <Dna className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                {isEditing
                  ? "Edit Breeding Service Record"
                  : "Log New Breeding Service"}
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                Record artificial insemination or natural paddock mating.
              </p>
            </div>
          </div>
          <button
            type="button"
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
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {/* SECTION A: FEMALE ANIMAL SELECTION (SEARCH & MATCHING IDs) */}
          <div className="p-4 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#10a37f] uppercase tracking-wider">
                <PawPrint className="w-4 h-4" />
                <span>Section A — Female Animal Selection</span>
              </div>
              <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                {femaleAnimals.length} eligible cows available
              </span>
            </div>

            {/* Hidden form bindings */}
            <input type="hidden" {...register("farmId")} />
            <input type="hidden" {...register("femaleAnimalId")} />

            {/* Selected Cow Card View */}
            {selectedCow ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#10a37f] text-white shadow-xs">
                      {selectedCow.tag}
                    </span>
                    <span className="text-sm font-bold text-[#0d0d0d] dark:text-white">
                      {selectedCow.name}
                    </span>
                    <span className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                      ({selectedCow.breed})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCow}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Change Cow</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-emerald-500/20">
                  <div>
                    <span className="text-[#737373] dark:text-[#8e8e8e]">
                      Farm Facility:
                    </span>
                    <p className="font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-1">
                      <Building className="w-3 h-3 text-[#10a37f]" />
                      {selectedCow.farmName || "Primary Farm"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#737373] dark:text-[#8e8e8e]">
                      Reproductive State:
                    </span>
                    <p className="font-bold text-[#10a37f]">
                      {selectedCow.reproductiveStatus}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#737373] dark:text-[#8e8e8e]">
                      Date of Birth:
                    </span>
                    <p className="font-semibold text-[#0d0d0d] dark:text-white">
                      {selectedCow.dob}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#737373] dark:text-[#8e8e8e]">
                      Breeding Status:
                    </span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for Service
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Cow Search Input with Matching Suggestions */
              <div className="relative">
                <AnimalTagAutocomplete
                  value={watch("femaleAnimalId")}
                  onSelect={(tag, animal) => {
                    if (animal) {
                      // Map the AnimalItem to FemaleAnimalOption
                      handleSelectCow({
                        id: animal.id,
                        tag: animal.animalNumber,
                        name: animal.name || "Cow",
                        breed: animal.breed,
                        dob: "Unknown",
                        farmId: animal.farm?.id || "",
                        farmName: animal.farm?.name || "Farm Facility",
                        reproductiveStatus: "OPEN",
                      });
                    } else {
                      handleClearCow();
                    }
                  }}
                  label="Search & Select Female Cow *"
                  placeholder="Type Ear Tag (e.g. COW-LK) or Cow Name to search..."
                  required
                  error={errors.femaleAnimalId?.message}
                  filters={{ gender: 'FEMALE' }}
                />
              </div>
            )}
          </div>

          {/* SECTION B: BREEDING SERVICE DETAILS */}
          <div className="p-4 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#10a37f] uppercase tracking-wider">
              <Dna className="w-4 h-4" />
              <span>Section B — Breeding Service Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Service Date *
                </label>
                <input
                  type="date"
                  max={todayStr}
                  {...register("serviceDate")}
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border ${
                    errors.serviceDate
                      ? "border-rose-500"
                      : "border-[#e5e5e5] dark:border-[#383838]"
                  } text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all`}
                />
                {errors.serviceDate && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    {errors.serviceDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Breeding Method *
                </label>
                <select
                  {...register("serviceMethod")}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
                >
                  <option value="ARTIFICIAL_INSEMINATION">
                    Artificial Insemination (AI)
                  </option>
                  <option value="NATURAL">
                    Natural Paddock Mating
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                  Attempt Number *
                </label>
                <input
                  type="number"
                  min="1"
                  {...register("attemptNumber", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
                />
              </div>
            </div>

            {/* TECHNICIAN / OPERATOR SELECTION WITH FARM PRESETS & VISITING TECH */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#10a37f]" />
                  <span>Technician / Operator *</span>
                </span>
                {techOption === "VISITING" && (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    External / Visiting Specialist
                  </span>
                )}
              </label>

              <select
                value={techOption}
                onChange={(e) => handleTechChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
              >
                <optgroup label="Registered Farm AI Technicians">
                  {FARM_TECHNICIANS.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other Personnel">
                  <option value="VISITING">
                    ➕ Visiting / External Specialist...
                  </option>
                </optgroup>
              </select>

              {/* Conditional Input for Visiting Technician */}
              {techOption === "VISITING" && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    Visiting Specialist Full Name & Credentials *
                  </label>
                  <input
                    type="text"
                    value={visitingTechName}
                    onChange={(e) => handleVisitingTechInput(e.target.value)}
                    placeholder="e.g. Dr. K. M. Bandara (Govt. Veterinary Surgeon) or AI Centre Specialist"
                    className={`w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border ${
                      errors.technician
                        ? "border-rose-500"
                        : "border-[#e5e5e5] dark:border-[#383838]"
                    } text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all`}
                  />
                  {errors.technician && (
                    <p className="text-[11px] text-rose-500 font-semibold">
                      {errors.technician.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* CONDITIONAL AI FIELDS */}
            {selectedMethod === "ARTIFICIAL_INSEMINATION" && (
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="text-[11.5px] font-bold text-[#10a37f]">
                  Artificial Insemination (AI) Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0d0d0d] dark:text-white mb-1">
                      Semen Straw Catalog
                    </label>
                    <select
                      {...register("semenStrawId")}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
                    >
                      <option value="">
                        Select semen straw (or enter custom below)...
                      </option>
                      {semenStraws.map((s) => (
                        <option key={s.id} value={s.strawId}>
                          {s.strawId} — {s.bullName} ({s.bullBreed})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0d0d0d] dark:text-white mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BATCH-2025-09A"
                      {...register("semenBatchNumber")}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0d0d0d] dark:text-white mb-1">
                      Sire Bull Name & Breed
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Superstar Holstein (US-7712)"
                      {...register("bullName")}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0d0d0d] dark:text-white mb-1">
                      Genetics Supplier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. World Wide Sires International"
                      {...register("semenSupplier")}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL NATURAL BREEDING FIELDS */}
            {selectedMethod === "NATURAL" && (
              <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-3">
                <div className="text-[11.5px] font-bold text-sky-600 dark:text-sky-400">
                  Natural Paddock Bull Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0d0d0d] dark:text-white mb-1">
                      Select Farm Bull
                    </label>
                    <select
                      {...register("bullId")}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
                    >
                      <option value="">Select bull...</option>
                      {bulls.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.tag} — {b.name} ({b.breed})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0d0d0d] dark:text-white mb-1">
                      Bull Owner / Source
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Highland Sire Genetics"
                      {...register("bullOwnerSource")}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION C: AUTOMATIC DATE CALCULATIONS */}
          <div className="p-4 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#10a37f] uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>Automated Gestation & PD Schedule</span>
              </div>
              <span className="text-[10.5px] font-semibold text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1">
                <Info className="w-3 h-3" /> Auto-calculated from service date
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838]">
                <span className="text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] uppercase">
                  1st PD Check (+60 Days)
                </span>
                <input
                  type="date"
                  {...register("firstPregnancyCheckDate")}
                  className="w-full mt-1 px-2 py-1 text-xs rounded-lg bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] font-bold text-[#0d0d0d] dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838]">
                <span className="text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] uppercase">
                  2nd PD Check (+90 Days)
                </span>
                <input
                  type="date"
                  {...register("secondPregnancyCheckDate")}
                  className="w-full mt-1 px-2 py-1 text-xs rounded-lg bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] font-bold text-[#0d0d0d] dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] uppercase">
                    Estimated Birth (+283 Days)
                  </span>
                  {calvingDateOverridden ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCalvingDateOverridden(false);
                        setValue(
                          "estimatedCalvingDate",
                          addDays(selectedServiceDate, 283),
                          { shouldValidate: true },
                        );
                      }}
                      className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Reset to auto-calculated date"
                    >
                      ↺ Reset to auto
                    </button>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
                      Auto
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  {...register("estimatedCalvingDate")}
                  onChange={(e) => {
                    const autoDate = addDays(selectedServiceDate, 283);
                    setCalvingDateOverridden(e.target.value !== autoDate);
                    setValue("estimatedCalvingDate", e.target.value, {
                      shouldValidate: true,
                    });
                  }}
                  className={`w-full px-2 py-1 text-xs rounded-lg bg-[#f8faf8] dark:bg-[#212121] border font-bold ${
                    calvingDateOverridden
                      ? "border-amber-400 text-amber-700 dark:text-amber-300"
                      : "border-[#e5e5e5] dark:border-[#383838] text-[#166534] dark:text-[#22C55E]"
                  }`}
                />
                {calvingDateOverridden && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                    📅 Manually set — system date:{" "}
                    {addDays(selectedServiceDate, 283)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
              <FileText className="w-3.5 h-3.5 text-[#10a37f]" />
              <span>Notes & Observations (Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Record standing heat behavior, straw thawing temp, or technician remarks..."
              {...register("notes")}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
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
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {isEditing ? "Save Changes" : "Log Breeding Record"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
