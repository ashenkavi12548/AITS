"use client";

import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Truck, AlertTriangle } from "lucide-react";
import {
  farmMovementSchema,
  FarmMovementFormData,
} from "@/schemas/traceability.schema";
import { FarmMovement } from "@/types/traceability.types";
import { MOVEMENT_REASON_LABELS } from "@/constants/traceability.constants";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import toast from "react-hot-toast";
import { farmsService, FarmFacility } from "@/services/farms.service";
import { healthService } from "@/services/health.service";
import { HealthClearanceItem } from "@/services/health.service";
import { FileCheck2, PlusCircle, Info } from "lucide-react";
import Link from "next/link";

interface FarmMovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<FarmMovement>) => Promise<void>;
  animals: {
    id: string;
    tagNumber: string;
    name: string;
    farmId: string;
    farmName: string;
    healthStatus?: string;
    isQuarantined?: boolean;
    isDeceased?: boolean;
  }[];
  isSubmitting: boolean;
}

export const FarmMovementFormModal: React.FC<FarmMovementFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  animals,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<FarmMovementFormData>({
    resolver: zodResolver(
      farmMovementSchema,
    ) as unknown as import("react-hook-form").Resolver<FarmMovementFormData>,
    defaultValues: {
      animalId: animals[0]?.id || "",
      fromFarmId: animals[0]?.farmId || "",
      toFarmId: "",
      departureDate: new Date().toISOString().split("T")[0],
      departureTime: "09:00",
      expectedArrivalDate: new Date().toISOString().split("T")[0],
      expectedArrivalTime: "15:00",
      reason: "PERMANENT_TRANSFER",
    },
  });

  const [allFarms, setAllFarms] = React.useState<FarmFacility[]>([]);

  useEffect(() => {
    if (isOpen) {
      farmsService.searchAllFarms()
        .then(res => setAllFarms(res || []))
        .catch(console.error);
    }
  }, [isOpen]);

  const selectedAnimalId = useWatch({ control, name: "animalId" });
  const selectedToFarmId = useWatch({ control, name: "toFarmId" });
  const selectedFromFarmId = useWatch({ control, name: "fromFarmId" });
  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);

  const [clearances, setClearances] = React.useState<HealthClearanceItem[]>([]);
  const [loadingClearances, setLoadingClearances] = React.useState(false);

  useEffect(() => {
    if (selectedAnimal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingClearances(true);
      healthService
        .getClearances({ status: "APPROVED" })
        .then((res) => {
          const validClearances = res.data.filter(
            (c) =>
              c.animalId === selectedAnimal.id ||
              c.animalTag === selectedAnimal.tagNumber,
          );
          setClearances(validClearances);
          if (validClearances.length > 0) {
            setValue("healthClearanceId", validClearances[0].id, {
              shouldValidate: true,
            });
          } else {
            setValue("healthClearanceId", "", { shouldValidate: true });
          }
        })
        .catch(console.error)
        .finally(() => setLoadingClearances(false));
    } else {
      setClearances([]);
    }
  }, [selectedAnimal, setValue]);

  // Automatically sync origin farm when animal is chosen
  useEffect(() => {
    if (selectedAnimal) {
      setValue("fromFarmId", selectedAnimal.farmId, { shouldValidate: true });
      // Ensure destination farm defaults to a different farm if same
      if (selectedToFarmId === selectedAnimal.farmId) {
        const otherFarm = allFarms.find((f) => f.id !== selectedAnimal.farmId);
        if (otherFarm) {
          setValue("toFarmId", otherFarm.id, { shouldValidate: true });
        }
      }
    }
  }, [selectedAnimal, selectedToFarmId, setValue, allFarms]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: FarmMovementFormData) => {
    if (data.fromFarmId === data.toFarmId) {
      toast.error("Origin and destination farms cannot be the same.");
      return;
    }

    const dep = new Date(
      `${data.departureDate}T${data.departureTime || "00:00"}`,
    );
    const arr = new Date(
      `${data.expectedArrivalDate}T${data.expectedArrivalTime || "00:00"}`,
    );
    if (arr < dep) {
      toast.error(
        "Expected arrival date/time cannot be before departure date/time.",
      );
      return;
    }

    if (selectedAnimal?.isDeceased) {
      toast.error("Deceased animals cannot be transferred between farms.");
      return;
    }

    if (selectedAnimal?.isQuarantined) {
      toast.error(
        "Quarantined animals cannot be transferred until veterinary clearance is issued.",
      );
      return;
    }

    if (!data.healthClearanceId) {
      toast.error(
        "A valid Veterinary Health Clearance Certificate is required to schedule a transfer.",
      );
      return;
    }

    try {
      await onSubmit(data as Partial<FarmMovement>);
      toast.success("Farm-to-farm movement scheduled successfully!");
      reset();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to schedule movement";
      toast.error(message);
    }
  };

  const animalOptions = animals.map((a) => ({
    value: a.id,
    label: `${a.tagNumber} (${a.name || "Unnamed"})`,
    subLabel: `Current: ${a.farmName}`,
  }));

  const destinationFarmOptions = allFarms
    .filter((f) => f.id !== selectedFromFarmId)
    .map((f) => ({
      value: f.id,
      label: f.name,
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#e5e5e5] dark:border-[#303030] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#10a37f]" />
              Record Farm-to-Farm Movement
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Schedule inter-farm livestock relocation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:bg-[#ececec] dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1 text-xs"
        >
          {/* Searchable Animal Selector */}
          <SearchableSelect
            label="Select Animal"
            required
            options={animalOptions}
            value={selectedAnimalId}
            onChange={(val) =>
              setValue("animalId", val, { shouldValidate: true })
            }
            placeholder="Search animal by tag or name..."
            searchPlaceholder="Type to search tag or name..."
            error={errors.animalId?.message}
          />

          {/* Health Alert Warning if Quarantined or Under Treatment */}
          {selectedAnimal &&
            (selectedAnimal.isQuarantined ||
              selectedAnimal.healthStatus !== "HEALTHY") && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Health Alert:</strong>
                  <span>
                    This animal currently has health status{" "}
                    <strong className="uppercase">
                      {selectedAnimal.healthStatus}
                    </strong>
                    {selectedAnimal.isQuarantined &&
                      " and is under active quarantine"}
                    . Ensure proper veterinary transport approval.
                  </span>
                </div>
              </div>
            )}

          {/* VHC Section */}
          <div className="p-3 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#303030] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#10a37f]" />
                Veterinary Health Clearance
              </span>
            </div>

            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-800 dark:text-blue-300 flex items-start gap-2 text-[11px] font-medium leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p>Transferring the animal needs to have a health clearance form (approved one).</p>
            </div>

            {loadingClearances ? (
              <p className="text-[#737373] text-xs">Checking clearances...</p>
            ) : clearances.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[#737373] text-xs">Existing Certificate:</p>
                <select
                  {...register("healthClearanceId")}
                  className="w-full p-2 bg-white dark:bg-[#282828] border border-[#10a37f]/30 rounded-lg text-[#0d0d0d] dark:text-white"
                  required
                >
                  <option value="">Select Certificate...</option>
                  {clearances.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.permitNo}] Issued:{" "}
                      {new Date(c.issuedDate).toLocaleDateString()} - Status:{" "}
                      {c.status}
                    </option>
                  ))}
                </select>
              </div>
            ) : selectedAnimal ? (
              <div className="space-y-2">
                <p className="text-[#737373] text-xs">
                  No Veterinary Health Clearance Certificate found.
                </p>
                <Link
                  href="/health/clearances"
                  onClick={onClose}
                  className="w-full py-2 bg-[#10a37f]/10 text-[#10a37f] font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#10a37f]/20 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Go to Health Clearances to Create Certificate
                </Link>
              </div>
            ) : (
              <p className="text-[#737373] text-xs">
                Select an animal to view clearance status.
              </p>
            )}
          </div>

          {/* Origin & Destination Farms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#0d0d0d] dark:text-[#ececec] mb-1.5">
                Origin Farm (Auto) *
              </label>
              <input
                type="text"
                disabled
                value={selectedAnimal?.farmName || "Select animal first"}
                className="w-full px-3.5 py-2.5 bg-[#ececec] dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#737373] dark:text-[#8e8e8e] font-medium"
              />
              <input type="hidden" {...register("fromFarmId")} />
            </div>

            <SearchableSelect
              label="Destination Farm"
              required
              options={destinationFarmOptions}
              value={selectedToFarmId}
              onChange={(val) =>
                setValue("toFarmId", val, { shouldValidate: true })
              }
              placeholder="Select destination farm..."
              searchPlaceholder="Type to search farm..."
              error={errors.toFarmId?.message}
            />
          </div>

          {/* Departure & Arrival Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#0d0d0d] dark:text-[#ececec] mb-1">
                Departure Date & Time *
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  {...register("departureDate")}
                  className="w-1/2 p-2 bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white"
                />
                <input
                  type="time"
                  {...register("departureTime")}
                  className="w-1/2 p-2 bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0d0d0d] dark:text-[#ececec] mb-1">
                Expected Arrival Date & Time *
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  {...register("expectedArrivalDate")}
                  className="w-1/2 p-2 bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white"
                />
                <input
                  type="time"
                  {...register("expectedArrivalTime")}
                  className="w-1/2 p-2 bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white"
                />
              </div>
              {errors.expectedArrivalDate && (
                <p className="text-rose-500 text-[11px] mt-1">
                  {errors.expectedArrivalDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Movement Reason */}
          <div>
            <label className="block font-semibold text-[#0d0d0d] dark:text-[#ececec] mb-1">
              Movement Reason *
            </label>
            <select
              {...register("reason")}
              className="w-full p-2.5 bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white focus:outline-none focus:border-[#10a37f]"
            >
              {Object.entries(MOVEMENT_REASON_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Transport Details (Optional) */}
          <div className="p-3 bg-[#f9f9f9] dark:bg-[#1a1a1a] rounded-xl border border-[#e5e5e5] dark:border-[#303030] space-y-3">
            <span className="font-bold text-[#0d0d0d] dark:text-white block text-xs">
              Transport Logistics (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#737373] mb-0.5">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. WP-NC-4409"
                  {...register("vehicleNumber")}
                  className="w-full p-2 bg-white dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] rounded-lg text-[#0d0d0d] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#737373] mb-0.5">
                  Driver Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jagath Bandara"
                  {...register("driverName")}
                  className="w-full p-2 bg-white dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] rounded-lg text-[#0d0d0d] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#737373] mb-0.5">
                  Driver Contact
                </label>
                <input
                  type="text"
                  placeholder="e.g. +94 77 123 4567"
                  {...register("driverContact")}
                  className="w-full p-2 bg-white dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] rounded-lg text-[#0d0d0d] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-[#0d0d0d] dark:text-[#ececec] mb-1">
              Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="Instructions or remarks for destination farm..."
              {...register("notes")}
              className="w-full p-2.5 bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white focus:outline-none focus:border-[#10a37f]"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#e5e5e5] dark:border-[#303030] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#737373] hover:bg-[#ececec] dark:hover:bg-[#2d2d2d] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#10a37f] hover:bg-[#0e8c6d] text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Schedule Movement</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
