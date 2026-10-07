import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X,
  Loader2,
  Wheat,
  Calendar as CalendarIcon,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { feedingService, FeedType, FeedingRecord } from "@/services/feeding.service";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { animalsService } from "@/services/animals.service";
import type { AnimalItem } from "@/types/animals";

const feedingSchema = z.object({
  animalId: z.string().optional(),
  feedTypeId: z.string().min(1, "Feed type is required"),
  quantity: z.number().positive("Quantity must be a positive number"),
  unit: z.string().min(1, "Unit is required"),
  fedAt: z.string().optional(),
  notes: z.string().optional(),
});

type FeedingFormData = z.infer<typeof feedingSchema>;

interface AnimalFeedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  animalId?: string | null;
  onSuccess: () => void;
  editRecordId?: string;
  editData?: Partial<FeedingRecord>;
}

export default function AnimalFeedingModal({
  isOpen,
  onClose,
  animalId,
  onSuccess,
  editRecordId,
  editData,
}: AnimalFeedingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  const [animalOptions, setAnimalOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isSearchingAnimals, setIsSearchingAnimals] = useState(false);

  useEffect(() => {
    if (!animalId && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSearchingAnimals(true);
      animalsService
        .getAnimals({ limit: 50 })
        .then((res) => {
          setAnimalOptions(
            res.data.map(
              (a: AnimalItem) => ({
                value: a.id,
                label: `#${a.animalNumber} - ${a.name || "Unknown"}`,
              }),
            ),
          );
        })
        .finally(() => setIsSearchingAnimals(false));
    }
  }, [animalId, isOpen]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FeedingFormData>({
    resolver: zodResolver(feedingSchema),
    defaultValues: {
      quantity: undefined,
      unit: "kg",
      fedAt: new Date().toISOString().slice(0, 16),
      notes: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingTypes(true);
    feedingService
      .getFeedTypes()
      .then((data) => {
        setFeedTypes(data);
        if (data.length > 0 && !editData) {
          setValue("feedTypeId", data[0].id);
          setValue("unit", data[0].unit);
        }
      })
      .catch(() => {
        toast.error("Failed to load feed types");
      })
      .finally(() => {
        setIsLoadingTypes(false);
      });

    if (editData && editRecordId) {
      setValue("feedTypeId", editData.feedTypeId || "");
      setValue("quantity", editData.quantity || 0);
      setValue("unit", editData.unit || "kg");
      setValue(
        "fedAt",
        editData.fedAt
          ? new Date(editData.fedAt).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      );
      setValue("notes", editData.notes || "");
    } else {
      reset({
        fedAt: new Date().toISOString().slice(0, 16),
        unit: "kg",
      });
    }
  }, [isOpen, editData, editRecordId, setValue, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FeedingFormData) => {
    setIsSubmitting(true);
    try {
      if (editRecordId) {
        await feedingService.updateFeedingRecord(editRecordId, {
          ...data,
          fedAt: data.fedAt ? new Date(data.fedAt).toISOString() : undefined,
        });
        toast.success("Feeding record updated successfully!");
      } else {
        if (!animalId && !data.animalId) {
          toast.error("Please select an animal");
          setIsSubmitting(false);
          return;
        }
        await feedingService.createFeedingRecord({
          animalId: animalId || data.animalId!,
          ...data,
          fedAt: data.fedAt ? new Date(data.fedAt).toISOString() : undefined,
        });
        toast.success("Feeding recorded successfully!");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(
        error.response?.data?.message || "Failed to save feeding record",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#212121] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {editRecordId ? "Edit Feeding Record" : "Log Animal Feeding"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-4">
            {!animalId && !editRecordId && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Animal *
                </label>
                <Controller
                  name="animalId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={animalOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={
                        isSearchingAnimals
                          ? "Loading animals..."
                          : "Select an animal..."
                      }
                      searchPlaceholder="Search by tag..."
                      error={errors.animalId?.message}
                    />
                  )}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Feed Type *
              </label>
              {isLoadingTypes ? (
                <div className="h-10 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
              ) : (
                <select
                  {...register("feedTypeId")}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  onChange={(e) => {
                    const selected = feedTypes.find(
                      (f) => f.id === e.target.value,
                    );
                    if (selected) setValue("unit", selected.unit);
                  }}
                >
                  {feedTypes.map((ft) => (
                    <option key={ft.id} value={ft.id}>
                      {ft.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.feedTypeId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.feedTypeId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("quantity", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. 5"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Unit *
                </label>
                <input
                  type="text"
                  {...register("unit")}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  placeholder="kg"
                  readOnly
                />
                {errors.unit && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.unit.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" /> Date & Time
              </label>
              <input
                type="datetime-local"
                {...register("fedAt")}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Notes
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Optional notes or observations..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingTypes}
              className="px-5 py-2.5 bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
