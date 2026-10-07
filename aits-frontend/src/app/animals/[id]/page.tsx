"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Tag,
  HeartPulse,
  Milk,
  Dna,
  Route,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  History,
  X,
  Copy,
  Check,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import {
  animalsService,
  AnimalDetailResponse,
  AnimalHistoryItem,
} from "@/services/animals.service";
import {
  healthService,
  AnimalHealthTimelineResponse,
  AnimalCompositeHealthState,
} from "@/services/health.service";
import { productionService } from "@/services/production.service";
import { ProductionRecord } from "@/types/production";
import { traceabilityService } from "@/services/traceability.service";
import { feedingService, FeedingRecord } from "@/services/feeding.service";
import { FarmMovement } from "@/types/traceability.types";
import { breedingService } from "@/services/breeding.service";
import { BreedingRecord } from "@/types/breeding";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "react-hot-toast";
import { type EarTagBadgeData } from "@/utils/earTagBadgeGenerator";
import EarTagBadgeModal from "@/components/animals/EarTagBadgeModal";
import AnimalHealthUpdateModal from "@/components/animals/AnimalHealthUpdateModal";
import { CowDetailsTab } from "@/features/animals/profile/CowDetailsTab";
import { CowHealthTab } from "@/features/animals/profile/CowHealthTab";
import { CowProductionTab } from "@/features/animals/profile/CowProductionTab";
import { CowFeedingTab } from "@/features/animals/profile/CowFeedingTab";
import { CowBreedingTab } from "@/features/animals/profile/CowBreedingTab";
import { CowMovementTab } from "@/features/animals/profile/CowMovementTab";
import { CowDocumentsTab } from "@/features/animals/profile/CowDocumentsTab";
import { CowAuditTab } from "@/features/animals/profile/CowAuditTab";
import { HumanAuditTimeline } from "@/features/animals/profile/HumanAuditTimeline";
import VaccinationEditModal from "@/components/animals/VaccinationEditModal";
import CowProductionModal from "@/components/animals/CowProductionModal";
import CowMovementModal from "@/components/animals/CowMovementModal";
import CowBreedingModal from "@/components/animals/CowBreedingModal";
import AnimalFeedingModal from "@/components/animals/AnimalFeedingModal";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Maps raw backend audit action codes to clear human-readable presentation metadata
 */

export default function AnimalDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const animalId = typeof id === "string" ? id : "";
  const { isAuthenticated, isInitialized, hasPermissionOnFarm } =
    useAuthStore();

  const [animal, setAnimal] = useState<AnimalDetailResponse | null>(null);
  const [history, setHistory] = useState<AnimalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Active view tab: 'details' | 'health' | 'production' | 'feeding' | 'breeding' | 'traceability' | 'documents' | 'audit'
  type ActiveTabType =
    | "details"
    | "health"
    | "production"
    | "feeding"
    | "breeding"
    | "traceability"
    | "documents"
    | "audit";
  const [activeTab, setActiveTab] = useState<ActiveTabType>("details");
  const [hasCopiedTag, setHasCopiedTag] = useState(false);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("edit") === "true" && animal) {
      if (hasPermissionOnFarm("animal:update", animal.farmId)) {
        setTimeout(() => setIsEditModalOpen(true), 0);
      }
    }
  }, [searchParams, animal, hasPermissionOnFarm]);

  const [isAddIdModalOpen, setIsAddIdModalOpen] = useState(false);
  const [isReplaceQrModalOpen, setIsReplaceQrModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isVaccinationEditModalOpen, setIsVaccinationEditModalOpen] =
    useState(false);
  const [selectedVaccinationEvent, setSelectedVaccinationEvent] = useState<
    | {
        id?: string;
        vaccineName: string;
        dose: string;
        vaccinationDate: string;
        nextDueDate?: string | null;
        status?: string;
      }
    | null
    | undefined
  >(null);

  // Direct Update Modal States for Scanned Cow
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isBreedingModalOpen, setIsBreedingModalOpen] = useState(false);

  // Tab Module Live Records States
  const [productionRecords, setProductionRecords] = useState<
    ProductionRecord[]
  >([]);
  const [isLoadingProduction, setIsLoadingProduction] = useState(false);

  const [farmMovements, setFarmMovements] = useState<FarmMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [isLoadingFeeding, setIsLoadingFeeding] = useState(false);
  const [isFeedingModalOpen, setIsFeedingModalOpen] = useState(false);
  const [editingFeedingRecord, setEditingFeedingRecord] = useState<
    FeedingRecord | undefined
  >();
  const [isLoadingBreeding, setIsLoadingBreeding] = useState(false);

  // Health data states
  const [healthTimeline, setHealthTimeline] =
    useState<AnimalHealthTimelineResponse | null>(null);
  const [healthEligibility, setHealthEligibility] =
    useState<AnimalCompositeHealthState | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [healthFilter, setHealthFilter] = useState<
    "ALL" | "DIAGNOSIS" | "VACCINATION" | "TREATMENT" | "QUARANTINE"
  >("ALL");

  // Form states
  const [editData, setEditData] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "FEMALE" as "MALE" | "FEMALE",
    dateOfBirth: "",
    color: "",
    weight: 0,
  });

  const [identifierData, setIdentifierData] = useState({
    identifierType: "RFID" as
      | "QR"
      | "RFID"
      | "EAR_TAG"
      | "NATIONAL_ID"
      | "OTHER",
    identifierValue: "",
    isPrimary: false,
  });

  const [replaceQrReason, setReplaceQrReason] = useState("DAMAGED_TAG");
  const [replaceQrNotes, setReplaceQrNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    if (type === "success") {
      toast.success(text);
    } else {
      toast.error(text);
    }
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleCopyTag = () => {
    if (!animal?.animalNumber) return;
    navigator.clipboard.writeText(animal.animalNumber);
    setHasCopiedTag(true);
    showFeedback("success", `Copied tag #${animal.animalNumber} to clipboard.`);
    setTimeout(() => setHasCopiedTag(false), 2000);
  };

  const animalNumberRef = useRef(animal?.animalNumber);
  useEffect(() => {
    animalNumberRef.current = animal?.animalNumber;
  }, [animal?.animalNumber]);

  const loadHealthData = useCallback(
    async (tagOrId?: string) => {
      const target = tagOrId || animalNumberRef.current || (animalId as string);
      if (!target) return;
      setIsLoadingHealth(true);
      try {
        const [tl, el] = await Promise.allSettled([
          healthService.getAnimalTimeline(target),
          healthService.getAnimalEligibility(target),
        ]);
        if (tl.status === "fulfilled") {
          setHealthTimeline(tl.value);
        }
        if (el.status === "fulfilled") {
          setHealthEligibility(el.value);
        }
      } catch (err) {
        console.error("Failed to load animal health records:", err);
      } finally {
        setIsLoadingHealth(false);
      }
    },
    [animalId],
  );

  const loadFeedingData = useCallback(async () => {
    if (!animalId) return;
    setIsLoadingFeeding(true);
    try {
      const res = await feedingService.getFeedingRecordsForAnimal(animalId);
      setFeedingRecords(res || []);
    } catch (err) {
      console.error("Failed to load feeding records:", err);
    } finally {
      setIsLoadingFeeding(false);
    }
  }, [animalId]);

  const loadProductionData = useCallback(async () => {
    if (!animalId) return;
    setIsLoadingProduction(true);
    try {
      const res = await productionService.getRecords({ animalId, limit: 50 });
      setProductionRecords(res.data || []);
    } catch (err) {
      console.error("Failed to load production records:", err);
    } finally {
      setIsLoadingProduction(false);
    }
  }, [animalId]);

  const loadMovementsData = useCallback(async () => {
    if (!animalId) return;
    setIsLoadingMovements(true);
    try {
      const res = await traceabilityService.getFarmMovements({
        animalId,
        limit: 50,
      });
      setFarmMovements(res.data || []);
    } catch (err) {
      console.error("Failed to load farm movements:", err);
    } finally {
      setIsLoadingMovements(false);
    }
  }, [animalId]);

  const loadBreedingData = useCallback(
    async (tagOrId?: string) => {
      const searchTarget = tagOrId || animalNumberRef.current || animalId;
      if (!searchTarget) return;
      setIsLoadingBreeding(true);
      try {
        const res = await breedingService.getBreedingRecords({
          search: searchTarget,
          limit: 50,
        });
        setBreedingRecords(res.data || []);
      } catch (err) {
        console.error("Failed to load breeding records:", err);
      } finally {
        setIsLoadingBreeding(false);
      }
    },
    [animalId],
  );

  const loadAnimalData = useCallback(async () => {
    if (!animalId) return;
    setIsLoading(true);
    try {
      const data = await animalsService.getAnimalById(animalId);
      setAnimal(data);
      setEditData({
        name: data.name || "",
        species: data.species,
        breed: data.breed,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
        color: data.color || "",
        weight: data.weight || 0,
      });
      void loadHealthData(data.animalNumber);
      void loadProductionData();
      void loadFeedingData();
      void loadMovementsData();
      void loadBreedingData(data.animalNumber);
    } catch (err: unknown) {
      console.error("Failed to load animal details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    animalId,
    loadHealthData,
    loadProductionData,
    loadFeedingData,
    loadMovementsData,
    loadBreedingData,
  ]);

  const loadHistory = useCallback(async () => {
    if (!animalId) return;
    try {
      const logs = await animalsService.getAnimalHistory(animalId);
      setHistory(logs);
    } catch (err) {
      console.error("Failed to load animal audit history:", err);
    }
  }, [animalId]);

  useEffect(() => {
    if (!animalId || !isInitialized || !isAuthenticated) return;
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    animalsService
      .getAnimalById(animalId)
      .then((data) => {
        if (cancelled) return;
        setAnimal(data);
        setEditData({
          name: data.name || "",
          species: data.species,
          breed: data.breed,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
          color: data.color || "",
          weight: data.weight || 0,
        });
        void loadHealthData(data.animalNumber);
        void loadProductionData();
        void loadFeedingData();
        void loadMovementsData();
        void loadBreedingData(data.animalNumber);
      })
      .catch((err: unknown) => {
        console.error("Failed to load animal details:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    animalsService
      .getAnimalHistory(animalId)
      .then((logs) => {
        if (!cancelled) setHistory(logs);
      })
      .catch((err: unknown) => {
        console.error("Failed to load animal audit history:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [
    animalId,
    isInitialized,
    isAuthenticated,
    loadHealthData,
    loadProductionData,
    loadFeedingData,
    loadMovementsData,
    loadBreedingData,
  ]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await animalsService.updateAnimal(animalId, {
        name: editData.name.trim() || undefined,
        species: editData.species,
        breed: editData.breed,
        gender: editData.gender,
        dateOfBirth: editData.dateOfBirth,
        color: editData.color.trim() || undefined,
        weight: Number(editData.weight) || undefined,
      });
      showFeedback("success", "Animal profile details updated successfully.");
      setIsEditModalOpen(false);
      loadAnimalData();
      loadHistory();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Update failed.";
      showFeedback("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showFeedback(
        "error",
        "Please select a valid image file (JPEG, PNG, WEBP).",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showFeedback("error", "Image size must be less than 5MB.");
      return;
    }

    setIsPhotoUploading(true);
    try {
      const uploadRes = await animalsService.uploadPhoto(file);
      if (uploadRes.imageUrl) {
        await animalsService.updateAnimal(animalId, {
          imageUrl: uploadRes.imageUrl,
        });
        showFeedback(
          "success",
          "Animal photo updated and saved to Cloudinary.",
        );
        loadAnimalData();
        loadHistory();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to upload photo to Cloudinary.";
      showFeedback("error", msg);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleAddIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifierData.identifierValue.trim()) {
      showFeedback("error", "Identifier value is required.");
      return;
    }
    setActionLoading(true);
    try {
      await animalsService.addIdentifier(animalId, {
        identifierType: identifierData.identifierType,
        identifierValue: identifierData.identifierValue.trim(),
        isPrimary: identifierData.isPrimary,
      });
      showFeedback(
        "success",
        `Identifier (${identifierData.identifierType}) registered successfully.`,
      );
      setIsAddIdModalOpen(false);
      setIdentifierData({
        identifierType: "RFID",
        identifierValue: "",
        isPrimary: false,
      });
      loadAnimalData();
      loadHistory();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add identifier.";
      showFeedback("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await animalsService.replaceQr(animalId, {
        reason: replaceQrReason,
        notes: replaceQrNotes.trim() || undefined,
      });
      showFeedback(
        "success",
        "New active QR code generated and archived old tag successfully.",
      );
      setIsReplaceQrModalOpen(false);
      setReplaceQrNotes("");
      loadAnimalData();
      loadHistory();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "QR replacement failed.";
      showFeedback("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await animalsService.deleteAnimal(animalId);
      showFeedback("success", "Animal record successfully archived.");
      setIsArchiveModalOpen(false);
      // Wait a moment so the user sees the success toast, then navigate
      setTimeout(() => {
        router.push("/animals");
      }, 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to archive animal.";
      showFeedback("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const getBadgeData = (): EarTagBadgeData | null => {
    if (!animal) return null;
    return {
      animalNumber: animal.animalNumber,
      name: animal.name || null,
      breed: animal.breed || null,
      species: animal.species || "Cattle",
      gender: animal.gender,
      dateOfBirth: animal.dateOfBirth || null,
      farmName: animal.farm?.name || "Registered Livestock Facility",
      farmLocation:
        animal.farm?.city ||
        animal.farm?.district ||
        animal.farm?.province ||
        "Central",
      farmRegistrationNumber: animal.farm?.registrationNumber || null,
      qrImageUrl: animal.activeQr?.qrImageUrl || "",
      qrValue: animal.activeQr?.qrValue || null,
      rfidNumber:
        animal.identifiers?.find((i) => i.identifierType === "RFID")
          ?.identifierValue || null,
      status: animal.status || "ACTIVE",
    };
  };

  const handleDownloadQr = () => {
    if (!animal?.activeQr?.qrImageUrl) return;
    const link = document.createElement("a");
    link.href = animal.activeQr.qrImageUrl;
    link.download = `${animal.animalNumber}-AITS-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateAge = (dobString?: string) => {
    if (!dobString) return "—";
    const birth = new Date(dobString);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    if (diffMonths < 0) return "Just born";
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months} months`;
    return `${years} yrs ${months} mos`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 max-w-7xl mx-auto">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in shadow-xs ${
              feedback.type === "success"
                ? "bg-[#10a37f]/10 border-[#10a37f]/30 text-[#10a37f]"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="flex-1">{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* 1. Header & Quick Breadcrumbs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Link
                href="/animals"
                className="inline-flex items-center gap-1 text-[#10a37f] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Livestock Directory</span>
              </Link>
              <span>/</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">
                {animal?.animalNumber || "Loading..."}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0d0d0d] dark:text-white tracking-tight flex items-center gap-2">
                <span className="whitespace-nowrap">
                  {animal?.animalNumber || "Animal Profile"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTag}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#10a37f] hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                  title="Copy Ear Tag ID"
                >
                  {hasCopiedTag ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </h1>

              {animal?.name && animal.name !== animal.animalNumber && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-[#2c2c2c] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                  &ldquo;{animal.name}&rdquo;
                </span>
              )}

              {animal && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase border shadow-xs ${
                    animal.status === "ACTIVE"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : animal.status === "QUARANTINED"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {animal.status}
                </span>
              )}

              {healthEligibility && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase border shadow-xs ${
                    healthEligibility.primaryHealthState === "HEALTHY"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : healthEligibility.primaryHealthState === "QUARANTINED"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5 text-current" />
                  <span>
                    {healthEligibility.primaryHealthState.replace(/_/g, " ")}
                  </span>
                </span>
              )}
            </div>

            {animal && (
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap pt-0.5">
                <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                  <Dna className="w-3.5 h-3.5 text-[#10a37f]" />
                  {animal.breed} &bull; {animal.species}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${animal.gender === "FEMALE" ? "bg-rose-500" : "bg-[#10a37f]"}`}
                  />
                  {animal.gender === "FEMALE" ? "Female (Cow)" : "Male (Bull)"}
                </span>
                <span>&bull;</span>
                <span>Age: {calculateAge(animal.dateOfBirth)}</span>
                {animal.weight && (
                  <>
                    <span>&bull;</span>
                    <span className="font-semibold text-[#10a37f]">
                      {animal.weight} kg
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Button Bar */}
          <div className="flex items-center gap-2 flex-wrap min-w-0 pb-1 justify-end">
            {/* Direct Field Logging Triggers */}
            <button
              type="button"
              onClick={() => setIsProductionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs shadow-sky-600/20 cursor-pointer"
              title="Directly log milking yield for this cow"
            >
              <Milk className="w-4 h-4" />
              <span>Log Milk Yield</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFeedingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 rounded-xl transition-all shadow-xs shadow-amber-400/20 cursor-pointer"
              title="Directly log feeding, diet ration or care activity"
            >
              <Utensils className="w-4 h-4" />
              <span>Log Feeding</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMovementModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs shadow-purple-600/20 cursor-pointer"
              title="Schedule farm-to-farm or pasture relocation"
            >
              <Route className="w-4 h-4" />
              <span>Record Movement</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHealthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Log veterinary checks, treatments or vaccinations"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Record Health</span>
            </button>

            {animal?.gender === "FEMALE" && (
              <button
                type="button"
                onClick={() => setIsBreedingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs shadow-amber-600/20 cursor-pointer"
                title="Log artificial insemination or breeding service"
              >
                <Dna className="w-4 h-4" />
                <span>Log Breeding AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsBadgeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#383838] rounded-xl transition-all border border-gray-200 dark:border-gray-700 shadow-xs cursor-pointer"
            >
              <Tag className="w-4 h-4 text-[#10a37f]" />
              <span>A7 Badge</span>
            </button>

            {hasPermissionOnFarm("animal:update", animal?.farmId) && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0d0d0d] dark:text-white bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#10a37f] transition-all shadow-xs cursor-pointer"
              >
                <Edit className="w-4 h-4 text-gray-500" />
                <span>Edit Details</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0d0d0d] dark:text-white bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#10a37f] transition-all shadow-xs cursor-pointer"
            >
              <History className="w-4 h-4 text-[#10a37f]" />
              <span>Audit</span>
              <span className="px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-[#333] text-[10px] font-bold text-gray-600 dark:text-gray-300">
                {history.length}
              </span>
            </button>

            {hasPermissionOnFarm("animal:delete", animal?.farmId) && (
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-xs shadow-red-600/20 cursor-pointer"
                title="Archive or Delete this Animal Record"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Archive Record</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Navigation Tabs Bar - Touch & Tablet Friendly */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-[#333333] scrollbar-none">
          {[
            {
              id: "details" as const,
              label: "Cow Details",
              icon: ShieldCheck,
              count: null,
            },
            {
              id: "health" as const,
              label: "Health & Veterinary",
              icon: HeartPulse,
              count:
                healthTimeline?.timeline?.length ??
                animal?.moduleCounts?.healthRecords,
            },
            {
              id: "production" as const,
              label: "Milk Production",
              icon: Milk,
              count:
                productionRecords.length ||
                animal?.moduleCounts?.milkProduction,
            },
            {
              id: "feeding" as const,
              label: "Feeding & Daily Care",
              icon: Utensils,
              count: feedingRecords.length,
            },
            {
              id: "breeding" as const,
              label: "Breeding & AI",
              icon: Dna,
              count:
                breedingRecords.length ||
                (animal?.moduleCounts?.femaleBreedingRecords || 0) +
                  (animal?.moduleCounts?.maleBreedingRecords || 0),
            },
            {
              id: "traceability" as const,
              label: "Movements & Permits",
              icon: Route,
              count: farmMovements.length || animal?.moduleCounts?.movements,
            },
            {
              id: "documents" as const,
              label: "Documents & Certificates",
              icon: FileText,
              count: animal?.moduleCounts?.documents,
            },
            {
              id: "audit" as const,
              label: "Audit History",
              icon: History,
              count: history.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#10a37f] text-white shadow-xs shadow-[#10a37f]/20"
                    : "bg-gray-100/80 dark:bg-[#252525] text-gray-600 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-[#2c2c2c]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"}`}
                />
                <span className="whitespace-nowrap">{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#10a37f]/10 text-[#10a37f]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading || !animal ? (
          <div className="p-16 rounded-3xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#10a37f]" />
            <p className="text-xs text-gray-500 font-medium">
              Loading comprehensive animal identity...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* TAB 1: COW DETAILS & IDENTITY (Consolidated on One Page for Tablets) */}
            {activeTab === "details" && (
              <CowDetailsTab
                animal={animal}
                hasPermissionOnFarm={hasPermissionOnFarm}
                isPhotoUploading={isPhotoUploading}
                handlePhotoUpload={handlePhotoUpload}
                setIsReplaceQrModalOpen={setIsReplaceQrModalOpen}
                setIsBadgeModalOpen={setIsBadgeModalOpen}
                handleDownloadQr={handleDownloadQr}
                calculateAge={calculateAge}
                setIsAddIdModalOpen={setIsAddIdModalOpen}
              />
            )}

            {/* TAB 2: HEALTH & VETERINARY */}
            {activeTab === "health" && (
              <CowHealthTab
                animal={animal}
                healthEligibility={healthEligibility}
                healthTimeline={healthTimeline}
                isLoadingHealth={isLoadingHealth}
                loadHealthData={loadHealthData}
                setIsHealthModalOpen={setIsHealthModalOpen}
                healthFilter={healthFilter}
                setHealthFilter={setHealthFilter}
                setSelectedVaccinationEvent={setSelectedVaccinationEvent}
                setIsVaccinationEditModalOpen={setIsVaccinationEditModalOpen}
              />
            )}

            {/* TAB 3: MILK PRODUCTION */}
            {activeTab === "production" && (
              <CowProductionTab
                animal={animal}
                productionRecords={productionRecords}
                isLoadingProduction={isLoadingProduction}
                loadProductionData={loadProductionData}
                setIsProductionModalOpen={setIsProductionModalOpen}
              />
            )}

            {/* TAB: FEEDING & DAILY CARE */}
            {activeTab === "feeding" && (
              <CowFeedingTab
                animal={animal}
                feedingRecords={feedingRecords}
                isLoadingFeeding={isLoadingFeeding}
                loadFeedingData={loadFeedingData}
                setIsFeedingModalOpen={setIsFeedingModalOpen}
              />
            )}

            {/* TAB 4: BREEDING & REPRODUCTION */}
            {activeTab === "breeding" && (
              <CowBreedingTab
                animal={animal}
                breedingRecords={breedingRecords}
                isLoadingBreeding={isLoadingBreeding}
                loadBreedingData={loadBreedingData}
                setIsBreedingModalOpen={setIsBreedingModalOpen}
              />
            )}

            {/* TAB 5: MOVEMENTS & PERMITS */}
            {activeTab === "traceability" && (
              <CowMovementTab
                animal={animal}
                farmMovements={farmMovements}
                isLoadingMovements={isLoadingMovements}
                loadMovementsData={loadMovementsData}
                setIsMovementModalOpen={setIsMovementModalOpen}
              />
            )}

            {/* TAB 6: DOCUMENTS & CERTIFICATES */}
            {activeTab === "documents" && <CowDocumentsTab animal={animal} />}

            {/* TAB 7: AUDIT TRAIL TIMELINE (Human Readable - No JSON) */}
            {activeTab === "audit" && <CowAuditTab history={history} />}
          </div>
        )}

        {/* Drawer: Audit History Timeline (Human Readable - No JSON) */}
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
            <div className="bg-white dark:bg-[#242424] max-w-lg w-full h-full p-6 border-l border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-5 overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#10a37f]" />
                  <h3 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                    Animal Audit Trail ({history.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Chronological ledger of changes for{" "}
                <strong>#{animal?.animalNumber}</strong> verified with user
                timestamps.
              </p>

              <HumanAuditTimeline logs={history} />
            </div>
          </div>
        )}

        {/* Modal: Edit Details */}
        {isFeedingModalOpen && (
          <AnimalFeedingModal
            isOpen={isFeedingModalOpen}
            onClose={() => {
              setIsFeedingModalOpen(false);
              setEditingFeedingRecord(undefined);
            }}
            animalId={animalId as string}
            onSuccess={() => void loadFeedingData()}
            editRecordId={editingFeedingRecord?.id}
            editData={editingFeedingRecord}
          />
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#242424] rounded-3xl max-w-md w-full p-6 border border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                  Edit Animal Phenotypic Details
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">
                    Animal Name / Nickname
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#10a37f]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Breed</label>
                    <input
                      type="text"
                      value={editData.breed}
                      onChange={(e) =>
                        setEditData({ ...editData, breed: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#10a37f]"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Gender</label>
                    <select
                      value={editData.gender}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          gender: e.target.value as "MALE" | "FEMALE",
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#10a37f]"
                    >
                      <option value="FEMALE">Female / Cow</option>
                      <option value="MALE">Male / Bull</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={editData.weight}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          weight: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#10a37f]"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editData.dateOfBirth}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#10a37f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="font-bold block mb-1">
                      Color / Markings
                    </label>
                    <input
                      type="text"
                      value={editData.color}
                      onChange={(e) =>
                        setEditData({ ...editData, color: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#10a37f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-[#1f1f1f]">
                    <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">
                      Animal Profile Photo
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        ref={photoInputRef}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            void handlePhotoUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isPhotoUploading}
                        className="px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-[#262626] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] transition-colors cursor-pointer"
                      >
                        {isPhotoUploading ? "Uploading..." : "Select New Image"}
                      </button>
                      {isPhotoUploading && (
                        <span className="text-[11px] text-gray-500">
                          Uploading to Cloudinary...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 font-bold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    {actionLoading && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Identifier */}
        {isAddIdModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#242424] rounded-3xl max-w-md w-full p-6 border border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                  Add Physical Identifier
                </h3>
                <button
                  onClick={() => setIsAddIdModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleAddIdentifierSubmit}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold block mb-1">
                    Identifier Type *
                  </label>
                  <select
                    value={identifierData.identifierType}
                    onChange={(e) =>
                      setIdentifierData({
                        ...identifierData,
                        identifierType: e.target.value as
                          | "RFID"
                          | "EAR_TAG"
                          | "NATIONAL_ID"
                          | "OTHER",
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl font-bold focus:outline-none focus:border-[#10a37f]"
                  >
                    <option value="RFID">RFID Electronic Tag / Bolus</option>
                    <option value="EAR_TAG">Ear Tag (Visual / Barcode)</option>
                    <option value="NATIONAL_ID">National Livestock ID</option>
                    <option value="OTHER">Other Approved Identifier</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">
                    Identifier Value *
                  </label>
                  <input
                    type="text"
                    required
                    value={identifierData.identifierValue}
                    onChange={(e) =>
                      setIdentifierData({
                        ...identifierData,
                        identifierValue: e.target.value,
                      })
                    }
                    placeholder="e.g. RFID-9820003884812"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl uppercase font-mono focus:outline-none focus:border-[#10a37f]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={identifierData.isPrimary}
                    onChange={(e) =>
                      setIdentifierData({
                        ...identifierData,
                        isPrimary: e.target.checked,
                      })
                    }
                    className="rounded text-[#10a37f]"
                  />
                  <label
                    htmlFor="isPrimary"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Set as Primary Identifier for this type
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsAddIdModalOpen(false)}
                    className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 font-bold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    {actionLoading && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Register Identifier</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Replace Damaged QR */}
        {isReplaceQrModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#242424] rounded-3xl max-w-md w-full p-6 border border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                  Replace Damaged / Lost Ear Tag QR
                </h3>
                <button
                  onClick={() => setIsReplaceQrModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleReplaceQrSubmit}
                className="space-y-3 text-xs"
              >
                <p className="text-gray-500">
                  Atomically archives the current QR tag as{" "}
                  <strong>REPLACED</strong> and generates a brand-new
                  cryptographic verification token.
                </p>

                <div>
                  <label className="font-bold block mb-1">
                    Replacement Reason *
                  </label>
                  <select
                    value={replaceQrReason}
                    onChange={(e) => setReplaceQrReason(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl font-bold focus:outline-none focus:border-[#10a37f]"
                  >
                    <option value="DAMAGED_TAG">
                      Physical Tag Damaged / Broken
                    </option>
                    <option value="FADED_QR">
                      QR Code Print Faded / Unscannable
                    </option>
                    <option value="LOST_IN_PASTURE">Tag Lost in Pasture</option>
                    <option value="SYSTEM_REISSUE">
                      Official Re-issue / Re-tagging
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">
                    Administrative Notes
                  </label>
                  <textarea
                    rows={2}
                    value={replaceQrNotes}
                    onChange={(e) => setReplaceQrNotes(e.target.value)}
                    placeholder="Provide additional details on tag condition..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#10a37f]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsReplaceQrModalOpen(false)}
                    className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    {actionLoading && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Issue Replacement QR</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Archive Animal */}
        {isArchiveModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#242424] rounded-3xl max-w-md w-full p-6 border border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Archive Animal Record
                </h3>
                <button
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleArchiveSubmit}
                className="space-y-4 text-xs"
              >
                <p className="text-gray-600 dark:text-gray-300">
                  Are you sure you want to archive the record for{" "}
                  <strong className="text-gray-900 dark:text-white">
                    #{animal?.animalNumber}
                  </strong>
                  ?
                </p>
                <p className="text-gray-500">
                  This action will hide the animal from active searches and
                  standard inventory reports. All historical data and audit
                  trails will be preserved securely. You must have the
                  appropriate <code>animal:delete</code> permission to perform
                  this action.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsArchiveModalOpen(false)}
                    className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    {actionLoading && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Confirm Archive</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Official A7 Cattle Ear Tag Badge Modal */}
        <EarTagBadgeModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          data={getBadgeData()}
        />

        {/* Animal Health Update Modal (Clinical Checks, Vaccines, Treatments) */}
        {animal && (
          <AnimalHealthUpdateModal
            isOpen={isHealthModalOpen}
            onClose={() => setIsHealthModalOpen(false)}
            onSuccess={() => {
              void loadAnimalData();
              void loadHealthData(animal.animalNumber);
              showFeedback(
                "success",
                `Health records updated for #${animal.animalNumber}`,
              );
            }}
            animal={{
              id: animal.id,
              animalNumber: animal.animalNumber,
              name: animal.name,
              species: animal.species,
              breed: animal.breed,
              farmId: animal.farmId,
            }}
          />
        )}

        {animal && (
          <VaccinationEditModal
            isOpen={isVaccinationEditModalOpen}
            onClose={() => setIsVaccinationEditModalOpen(false)}
            onSuccess={() => {
              void loadAnimalData();
              void loadHealthData(animal.animalNumber);
              showFeedback(
                "success",
                `Vaccination record updated for #${animal.animalNumber}`,
              );
            }}
            vaccinationId={selectedVaccinationEvent?.id}
            animal={{
              animalNumber: animal.animalNumber,
              name: animal.name,
            }}
            initialData={selectedVaccinationEvent}
          />
        )}

        {/* Direct Milk Production Modal */}
        {animal && (
          <CowProductionModal
            isOpen={isProductionModalOpen}
            onClose={() => setIsProductionModalOpen(false)}
            onSuccess={() => {
              void loadProductionData();
              void loadFeedingData();
              void loadAnimalData();
              showFeedback(
                "success",
                `Milk yield recorded successfully for #${animal.animalNumber}.`,
              );
            }}
            animalId={animal.id}
            animalNumber={animal.animalNumber}
            animalName={animal.name || undefined}
            farmId={animal.farmId || animal.farm?.id || ""}
            farmName={animal.farm?.name || undefined}
          />
        )}

        {/* Direct Farm Movement Modal */}
        {animal && (
          <CowMovementModal
            isOpen={isMovementModalOpen}
            onClose={() => setIsMovementModalOpen(false)}
            onSuccess={() => {
              void loadMovementsData();
              void loadAnimalData();
              showFeedback(
                "success",
                `Farm movement scheduled successfully for #${animal.animalNumber}.`,
              );
            }}
            animalId={animal.id}
            animalNumber={animal.animalNumber}
            animalName={animal.name || undefined}
            currentFarmId={animal.farmId || animal.farm?.id || ""}
            currentFarmName={animal.farm?.name || undefined}
          />
        )}

        {/* Direct Breeding Service Modal */}
        {animal && animal.gender === "FEMALE" && (
          <CowBreedingModal
            isOpen={isBreedingModalOpen}
            onClose={() => setIsBreedingModalOpen(false)}
            onSuccess={() => {
              void loadBreedingData(animal.animalNumber);
              void loadAnimalData();
              showFeedback(
                "success",
                `Breeding record logged successfully for #${animal.animalNumber}.`,
              );
            }}
            animalId={animal.id}
            animalNumber={animal.animalNumber}
            animalName={animal.name || undefined}
            farmId={animal.farmId || animal.farm?.id || ""}
            farmName={animal.farm?.name || undefined}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
