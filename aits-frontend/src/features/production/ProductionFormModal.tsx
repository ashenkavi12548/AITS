"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Loader2,
  Milk,
  Calendar,
  Building,
  Scale,
  ShieldAlert,
  FileText,
  Search,
  ChevronDown,
  Clock,
  Check,
} from "lucide-react";
import {
  ProductionRecord,
  CreateProductionInput,
  MilkingSession,
  MilkQualityStatus,
  FarmOption,
  AnimalOption,
} from "@/types/production";
import AnimalTagAutocomplete from "@/components/common/AnimalTagAutocomplete";

const todayStr = new Date().toISOString().split("T")[0];

/**
 * Utility to automatically determine default milking session based on system time.
 * Hours 0 - 11 (12:00 AM - 11:59 AM) -> MORNING
 * Hours 12 - 23 (12:00 PM - 11:59 PM) -> EVENING
 */
const getSystemDefaultSession = (): MilkingSession => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) return "MORNING";
  if (currentHour < 17) return "AFTERNOON";
  return "EVENING";
};

const productionSchema = z.object({
  date: z
    .string()
    .min(1, "Production date is required.")
    .refine((val) => val <= todayStr, {
      message: "Future dates are not allowed.",
    }),
  farmId: z.string().min(1, "Please select a farm facility."),
  animalId: z.string().min(1, "Please enter or select an animal tag or ID."),
  session: z.enum(["MORNING", "AFTERNOON", "EVENING"], {
    message: "Milking session is required.",
  }),
  quantityLiters: z
    .number({ message: "Quantity must be greater than zero litres." })
    .min(0.01, "Quantity must be greater than zero litres."),
  qualityStatus: z.enum(["ACCEPTED", "REJECTED", "PENDING"], {
    message: "Quality status is required.",
  }),
  notes: z.string().optional(),
});

type ProductionFormData = z.infer<typeof productionSchema>;

interface ProductionFormModalProps {
  isOpen: boolean;
  initialData?: ProductionRecord | null;
  farms: FarmOption[];
  animals: AnimalOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onFarmChange: (farmId: string) => void;
  onSubmit: (data: CreateProductionInput) => Promise<boolean>;
}

export const ProductionFormModal: React.FC<ProductionFormModalProps> = ({
  isOpen,
  initialData,
  farms,
  isSubmitting,
  onClose,
  onFarmChange,
  onSubmit,
}) => {
  const isEditing = Boolean(initialData);

  // Search & Select Farm Dropdown State
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const [farmSearchQuery, setFarmSearchQuery] = useState("");
  const farmDropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductionFormData>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      date: todayStr,
      farmId: "",
      animalId: "",
      session: getSystemDefaultSession(),
      quantityLiters: 15.0,
      qualityStatus: "ACCEPTED",
      notes: "",
    },
  });

  const selectedFarmId = useWatch({ control, name: "farmId" });
  const selectedSession = useWatch({ control, name: "session" });
  const watchedAnimalId = useWatch({ control, name: "animalId" });

  // Register custom fields for react-hook-form
  useEffect(() => {
    register("farmId");
    register("animalId");
  }, [register]);

  // Sync farm selection change with parent hook to update animal options
  useEffect(() => {
    if (selectedFarmId) {
      onFarmChange(selectedFarmId);
    }
  }, [selectedFarmId, onFarmChange]);

  // Click outside listener for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        farmDropdownRef.current &&
        !farmDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFarmDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize or reset form values
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          date: initialData.date,
          farmId: initialData.farmId,
          animalId: initialData.animalTag || initialData.animalId,
          session: initialData.session,
          quantityLiters: initialData.quantityLiters,
          qualityStatus: initialData.qualityStatus,
          notes: initialData.notes || "",
        });
      } else {
        const autoDetectedSession = getSystemDefaultSession();
        const defaultFarm = farms[0]?.id || "";
        reset({
          date: todayStr,
          farmId: defaultFarm,
          animalId: "",
          session: autoDetectedSession,
          quantityLiters: 15.0,
          qualityStatus: "ACCEPTED",
          notes: "",
        });
      }
    }
  }, [isOpen, initialData, farms, reset]);

  if (!isOpen) return null;

  // Filtered farms for search-select dropdown
  const filteredFarms = farms.filter((f) =>
    f.name.toLowerCase().includes(farmSearchQuery.toLowerCase().trim()),
  );

  const selectedFarmObject = farms.find((f) => f.id === selectedFarmId);

  const handleClose = () => {
    setIsFarmDropdownOpen(false);
    setFarmSearchQuery("");
    onClose();
  };

  const onFormSubmit = async (data: ProductionFormData) => {
    const success = await onSubmit({
      date: data.date,
      farmId: data.farmId,
      animalId: data.animalId,
      session: data.session as MilkingSession,
      quantityLiters: Number(data.quantityLiters),
      qualityStatus: data.qualityStatus as MilkQualityStatus,
      notes: data.notes,
    });

    if (success) {
      handleClose();
    }
  };

  const onInvalidSubmit = (validationErrors: unknown) => {
    console.warn("Production form validation errors:", validationErrors);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] w-full max-w-xl rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#166534]/10 text-[#166534] dark:text-[#22C55E] flex items-center justify-center">
              <Milk className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
                {isEditing
                  ? "Edit Milk Production Record"
                  : "Log New Milk Yield"}
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                {isEditing
                  ? "Update parameters for this milking log."
                  : "Enter daily milking session statistics."}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onFormSubmit, onInvalidSubmit)}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          {/* Row 1: Production Date & Searchable Farm Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Production Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#10a37f]" />
                <span>Production Date *</span>
              </label>
              <input
                type="date"
                max={todayStr}
                {...register("date")}
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border ${
                  errors.date
                    ? "border-rose-500"
                    : "border-[#e5e5e5] dark:border-[#383838]"
                } text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all`}
              />
              {errors.date && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* Farm Facility (Search and Select Dropdown) */}
            <div ref={farmDropdownRef} className="relative">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                <Building className="w-3.5 h-3.5 text-[#10a37f]" />
                <span>Farm Facility *</span>
              </label>
              <div
                onClick={() => setIsFarmDropdownOpen((prev) => !prev)}
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border ${
                  errors.farmId
                    ? "border-rose-500"
                    : "border-[#e5e5e5] dark:border-[#383838]"
                } text-[#0d0d0d] dark:text-white flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all`}
              >
                <span
                  className={
                    selectedFarmObject
                      ? "font-medium"
                      : "text-[#737373] dark:text-[#8e8e8e]"
                  }
                >
                  {selectedFarmObject
                    ? selectedFarmObject.name
                    : "Select farm facility..."}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#737373] dark:text-[#8e8e8e] transition-transform duration-200 ${
                    isFarmDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Search & Select Popover Dropdown */}
              {isFarmDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#383838] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Search bar inside dropdown */}
                  <div className="p-2 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center gap-2 bg-[#f8faf8] dark:bg-[#1e1e1e]">
                    <Search className="w-3.5 h-3.5 text-[#737373] dark:text-[#8e8e8e] shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search farm..."
                      value={farmSearchQuery}
                      onChange={(e) => setFarmSearchQuery(e.target.value)}
                      className="w-full text-xs bg-transparent text-[#0d0d0d] dark:text-white focus:outline-none"
                    />
                    {farmSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setFarmSearchQuery("")}
                        className="text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* List of farms */}
                  <div className="max-h-48 overflow-y-auto p-1 divide-y divide-gray-100 dark:divide-zinc-800">
                    {filteredFarms.length > 0 ? (
                      filteredFarms.map((f) => {
                        const isSelected = f.id === selectedFarmId;
                        return (
                          <div
                            key={f.id}
                            onClick={() => {
                              setValue("farmId", f.id, {
                                shouldValidate: true,
                              });
                              setIsFarmDropdownOpen(false);
                              setFarmSearchQuery("");
                            }}
                            className={`px-3 py-2 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-[#10a37f]/10 text-[#10a37f] dark:text-[#22C55E] font-semibold"
                                : "hover:bg-[#f3f4f6] dark:hover:bg-[#333333] text-[#0d0d0d] dark:text-white"
                            }`}
                          >
                            <span>{f.name}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#10a37f] dark:text-[#22C55E]" />
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-xs text-[#737373] dark:text-[#8e8e8e]">
                        No farm matching &quot;{farmSearchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}
              {errors.farmId && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.farmId.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Animal Tag/ID Manual Typing & System-Time Milking Session */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Animal (Tag / ID) - Autocomplete */}
            <div className="relative">
              <AnimalTagAutocomplete
                value={watchedAnimalId ?? ""}
                onSelect={(tag) => {
                  setValue("animalId", tag, { shouldValidate: true });
                }}
                label="Animal (Tag / ID)"
                placeholder="Search tag or name..."
                required
                error={errors.animalId?.message}
                filters={{ gender: 'FEMALE' }}
              />
            </div>

            {/* Milking Session with Auto System-Time Detection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#0d0d0d] dark:text-white">
                  <Clock className="w-3.5 h-3.5 text-[#10a37f]" />
                  <span>Milking Session *</span>
                </label>
                <span className="text-[10px] text-[#10a37f] dark:text-[#22C55E] font-medium bg-[#10a37f]/10 dark:bg-[#22C55E]/15 px-1.5 py-0.5 rounded-md">
                  System Time Auto-Select
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border cursor-pointer transition-all ${
                    selectedSession === "MORNING"
                      ? "border-[#10a37f] bg-[#10a37f]/10 dark:bg-[#22C55E]/15 text-[#10a37f] dark:text-[#22C55E] font-bold"
                      : "border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#f8faf8] dark:hover:bg-[#212121]"
                  }`}
                >
                  <input
                    type="radio"
                    value="MORNING"
                    {...register("session")}
                    className="accent-[#10a37f]"
                  />
                  <span className="text-xs">Morning</span>
                </label>
                <label
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border cursor-pointer transition-all ${
                    selectedSession === "AFTERNOON"
                      ? "border-[#10a37f] bg-[#10a37f]/10 dark:bg-[#22C55E]/15 text-[#10a37f] dark:text-[#22C55E] font-bold"
                      : "border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#f8faf8] dark:hover:bg-[#212121]"
                  }`}
                >
                  <input
                    type="radio"
                    value="AFTERNOON"
                    {...register("session")}
                    className="accent-[#10a37f]"
                  />
                  <span className="text-xs">Afternoon</span>
                </label>
                <label
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border cursor-pointer transition-all ${
                    selectedSession === "EVENING"
                      ? "border-[#10a37f] bg-[#10a37f]/10 dark:bg-[#22C55E]/15 text-[#10a37f] dark:text-[#22C55E] font-bold"
                      : "border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#f8faf8] dark:hover:bg-[#212121]"
                  }`}
                >
                  <input
                    type="radio"
                    value="EVENING"
                    {...register("session")}
                    className="accent-[#10a37f]"
                  />
                  <span className="text-xs">Evening</span>
                </label>
              </div>
              {errors.session && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.session.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Quantity & Quality Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                <Scale className="w-3.5 h-3.5 text-[#10a37f]" />
                <span>Quantity (Liters) *</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 18.5"
                {...register("quantityLiters", { valueAsNumber: true })}
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border ${
                  errors.quantityLiters
                    ? "border-rose-500"
                    : "border-[#e5e5e5] dark:border-[#383838]"
                } text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all`}
              />
              {errors.quantityLiters && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.quantityLiters.message}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#10a37f]" />
                <span>Quality Status *</span>
              </label>
              <select
                {...register("qualityStatus")}
                className={`w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border ${
                  errors.qualityStatus
                    ? "border-rose-500"
                    : "border-[#e5e5e5] dark:border-[#383838]"
                } text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all`}
              >
                <option value="ACCEPTED">Accepted (Good standard)</option>
                <option value="PENDING">Pending (Lab test in progress)</option>
                <option value="REJECTED">
                  Rejected (Contaminated / Elevated SCC)
                </option>
              </select>
              {errors.qualityStatus && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.qualityStatus.message}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#0d0d0d] dark:text-white mb-1">
              <FileText className="w-3.5 h-3.5 text-[#10a37f]" />
              <span>Notes & Observations (Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Add details regarding SCC tests, butterfat density, or animal health during milking..."
              {...register("notes")}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white dark:bg-[#2f2f2f] pt-3 pb-1 border-t border-[#e5e5e5] dark:border-[#383838] flex items-center justify-end gap-2.5 z-20">
            <button
              type="button"
              onClick={handleClose}
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
                <span>{isEditing ? "Save Changes" : "Log Record"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
