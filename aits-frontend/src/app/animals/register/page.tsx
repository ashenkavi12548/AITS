"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Tag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Dna,
  Building2,
  Radio,
  UploadCloud,
  Camera,
  Trash2,
  Check,
} from "lucide-react";
import { animalsService } from "@/services/animals.service";
import type { CreateAnimalResponse, AnimalGender } from "@/types/animals";
import { farmsService } from "@/services/farms.service";
import type { Farm } from "@/services/farms.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { type EarTagBadgeData } from "@/utils/earTagBadgeGenerator";
import EarTagBadgeModal from "@/components/animals/EarTagBadgeModal";
import AnimalTagAutocomplete from "@/components/common/AnimalTagAutocomplete";

export default function RegisterAnimalPage() {
  const router = useRouter();

  // Form State
  const [animalNumber, setAnimalNumber] = useState("");
  const [rfidNumber, setRfidNumber] = useState("");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Cattle");
  const [breed, setBreed] = useState("Holstein-Friesian");
  const [gender, setGender] = useState<AnimalGender>("FEMALE");
  const [dateOfBirth, setDateOfBirth] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [color, setColor] = useState("Black & White");
  const [weight, setWeight] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [farmId, setFarmId] = useState("");
  const [registrationSource, setRegistrationSource] = useState("BORN_ON_FARM");
  const [motherTagOrId, setMotherTagOrId] = useState("");
  const [fatherTagOrId, setFatherTagOrId] = useState("");
  const [notes, setNotes] = useState("");
  const [farms, setFarms] = useState<Farm[]>([]);

  // Photo Upload State (Cloudinary integration)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  // Status & submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [registeredResult, setRegisteredResult] =
    useState<CreateAnimalResponse | null>(null);

  // Load user accessible farms on mount
  const hasPermissionOnFarm = useAuthStore(
    (state) => state.hasPermissionOnFarm,
  );

  useEffect(() => {
    if (!hasPermissionOnFarm("animal:create")) {
      router.replace("/animals");
      return;
    }

    let cancelled = false;

    async function loadFarms() {
      try {
        const list = await farmsService.getFarms();
        if (!cancelled && list.length > 0) {
          setFarms(list);
          setFarmId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load farms:", err);
      }
    }

    void loadFarms();
    return () => {
      cancelled = true;
    };
  }, [hasPermissionOnFarm, router]);

  const handleGenerateTag = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setAnimalNumber(`COW-LK-${randomSuffix}`);
  };

  const handleGenerateRfid = () => {
    const rfidDigits = Math.floor(100000000000 + Math.random() * 900000000000);
    setRfidNumber(`982000${rfidDigits.toString().slice(0, 6)}`);
  };

  const handlePhotoFileSelect = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setPhotoUploadError(
        "Please choose a valid image file (JPEG, PNG, WEBP, or GIF).",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadError(
        "Image size exceeds 5MB. Please choose a smaller photo.",
      );
      return;
    }

    setPhotoUploadError(null);
    const localUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(localUrl);
    setIsUploadingPhoto(true);

    try {
      const res = await animalsService.uploadPhoto(file);
      if (res.imageUrl) {
        setImageUrl(res.imageUrl);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        "Failed to upload photo to Cloudinary. You can enter an image URL or retry.";
      setPhotoUploadError(msg);
      toast.error(msg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreviewUrl(null);
    setImageUrl("");
    setPhotoUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    const tagClean = animalNumber.trim().toUpperCase();
    if (!tagClean) {
      setErrorBanner("Official Ear Tag Number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await animalsService.createAnimal({
        animalNumber: tagClean,
        rfidNumber: rfidNumber.trim()
          ? rfidNumber.trim().toUpperCase()
          : undefined,
        name: name.trim() || undefined,
        species: species.trim() || "Cattle",
        breed: breed.trim() || "Holstein-Friesian",
        gender,
        dateOfBirth: dateOfBirth || undefined,
        color: color.trim() || undefined,
        weight: weight !== "" ? Number(weight) : undefined,
        imageUrl: imageUrl.trim() || undefined,
        farmId: farmId || undefined,
        registrationSource,
        motherTagOrId: motherTagOrId.trim() || undefined,
        fatherTagOrId: fatherTagOrId.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setRegisteredResult(response);
    } catch {
      setErrorBanner(
        "Failed to register animal. Please check your inputs and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  const getBadgeData = (): EarTagBadgeData | null => {
    if (!registeredResult?.animal) return null;
    const farm = farms.find(
      (f) => f.id === (registeredResult.animal.farmId || farmId),
    );
    return {
      animalNumber: registeredResult.animal.animalNumber || animalNumber,
      name: registeredResult.animal.name || name || null,
      breed: registeredResult.animal.breed || breed || null,
      species: registeredResult.animal.species || species || "Cattle",
      gender: registeredResult.animal.gender || gender,
      dateOfBirth: registeredResult.animal.dateOfBirth || dateOfBirth || null,
      farmName: farm?.name || "Registered Livestock Facility",
      farmLocation: farm?.city || farm?.district || farm?.province || "Central",
      farmRegistrationNumber: farm?.registrationNumber || null,
      qrImageUrl: registeredResult.animal.qrCode?.qrImageUrl || "",
      qrValue: registeredResult.animal.qrCode?.qrValue || null,
      rfidNumber: rfidNumber || null,
      status: registeredResult.animal.status || "ACTIVE",
    };
  };

  const handleDownloadQr = () => {
    if (!registeredResult?.animal.qrCode?.qrImageUrl) return;
    const link = document.createElement("a");
    link.href = registeredResult.animal.qrCode.qrImageUrl;
    link.download = `${registeredResult.animal.animalNumber}-AITS-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegisterAnother = () => {
    setRegisteredResult(null);
    setAnimalNumber("");
    setRfidNumber("");
    setName("");
    setNotes("");
    setMotherTagOrId("");
    setFatherTagOrId("");
    setImageUrl("");
    setPhotoPreviewUrl(null);
    setPhotoUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrorBanner(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div>
          <Link
            href="/animals"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10a37f] hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Livestock Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0d0d0d] dark:text-white tracking-tight">
              Livestock Registration Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#10a37f]/10 text-[#10a37f] text-[11px] font-bold uppercase tracking-wider border border-[#10a37f]/20">
              National Traceability Standard
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#737373] dark:text-[#8e8e8e] mt-1">
            Register newborn calves, purchased animals, or imported livestock
            with automatic cryptographic QR ear tags and parent lineage
            verification.
          </p>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              aria-label="Dismiss error"
              className="text-rose-500 font-bold hover:opacity-80"
            >
              &times;
            </button>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Identification & Tagging */}
          <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f1f5f9] dark:border-[#333333]">
              <Tag className="w-5 h-5 text-[#10a37f]" aria-hidden="true" />
              <h2 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                1. Official Identification
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="animal-number"
                    className="text-xs font-bold text-[#0d0d0d] dark:text-white"
                  >
                    Official Ear Tag Number *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateTag}
                    aria-label="Generate a suggested ear tag number"
                    className="text-[11px] font-semibold text-[#10a37f] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    <span>Generate Next Tag</span>
                  </button>
                </div>
                <input
                  id="animal-number"
                  type="text"
                  required
                  value={animalNumber}
                  onChange={(e) => setAnimalNumber(e.target.value)}
                  placeholder="e.g. COW-LK-7813"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#10a37f]"
                />
                <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e] mt-1 block">
                  Official government or farm ear tag applied to the animal.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="rfid-number"
                    className="text-xs font-bold text-[#0d0d0d] dark:text-white"
                  >
                    Electronic RFID / Bolus Number (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRfid}
                    aria-label="Generate a sample RFID number"
                    className="text-[11px] font-semibold text-[#10a37f] hover:underline flex items-center gap-1"
                  >
                    <Radio className="w-3 h-3" aria-hidden="true" />
                    <span>Generate RFID</span>
                  </button>
                </div>
                <input
                  id="rfid-number"
                  type="text"
                  value={rfidNumber}
                  onChange={(e) => setRfidNumber(e.target.value)}
                  placeholder="e.g. 982000388481"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-[#10a37f]"
                />
                <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e] mt-1 block">
                  15-digit ISO 11784/11785 RFID chip or ear tag transponder.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Phenotypic & Physical Characteristics */}
          <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f1f5f9] dark:border-[#333333]">
              <Sparkles className="w-5 h-5 text-[#10a37f]" aria-hidden="true" />
              <h2 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                2. Phenotypic &amp; Physical Characteristics
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="species"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Species *
                </label>
                <select
                  id="species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
                >
                  <option value="Cattle">Cattle (Dairy / Beef)</option>
                  <option value="Buffalo">Water Buffalo</option>
                  <option value="Goat">Dairy Goat</option>
                  <option value="Sheep">Sheep</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="breed"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Breed *
                </label>
                <select
                  id="breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
                >
                  <option value="Holstein-Friesian">Holstein-Friesian</option>
                  <option value="Jersey">Jersey</option>
                  <option value="Brown Swiss">Brown Swiss</option>
                  <option value="Ayrshire">Ayrshire</option>
                  <option value="Sahiwal">Sahiwal</option>
                  <option value="Girolando">Girolando</option>
                  <option value="Crossbred">Crossbred Dairy</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Gender *
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as AnimalGender)}
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
                >
                  <option value="FEMALE">Female (Heifer / Cow)</option>
                  <option value="MALE">Male (Bull / Steer)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="animal-name"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Name / Barn Nickname
                </label>
                <input
                  id="animal-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Daisy, Bella, Queen"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs focus:outline-none focus:border-[#10a37f]"
                />
              </div>

              <div>
                <label
                  htmlFor="date-of-birth"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Date of Birth *
                </label>
                <input
                  id="date-of-birth"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs focus:outline-none focus:border-[#10a37f]"
                />
              </div>

              <div>
                <label
                  htmlFor="weight"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Initial Body Weight (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  min="1"
                  step="0.5"
                  value={weight}
                  onChange={(e) =>
                    setWeight(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder="e.g. 42"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs focus:outline-none focus:border-[#10a37f]"
                />
              </div>

              <div>
                <label
                  htmlFor="color"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Coat Color &amp; Markings
                </label>
                <input
                  id="color"
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Black with white star forehead"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs focus:outline-none focus:border-[#10a37f]"
                />
              </div>

              {/* Photo Upload with Cloudinary Support */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0d0d0d] dark:text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#10a37f]" />
                    <span>Animal Photograph</span>
                    <span className="text-[11px] font-normal text-gray-500">
                      (Cloudinary Cloud Storage)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    className="text-[11px] font-semibold text-[#10a37f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {showUrlFallback ? "Hide URL input" : "Or enter URL"}
                    </span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handlePhotoFileSelect(file);
                    }
                  }}
                />

                {/* Drag and Drop / Preview Box */}
                {photoPreviewUrl || imageUrl ? (
                  <div className="relative rounded-2xl border border-[#e5e5e5] dark:border-[#383838] bg-[#f9f9f9] dark:bg-[#1e1e1e] p-3 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#2a2a2a] shrink-0 border border-gray-200 dark:border-gray-700">
                      <Image
                        src={photoPreviewUrl || imageUrl}
                        alt="Animal preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                          <span className="text-[10px] font-bold mt-1">
                            Uploading...
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
                          <Check className="w-3 h-3" />
                          <span>
                            {isUploadingPhoto
                              ? "Uploading to Cloudinary..."
                              : "Ready & Stored"}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-sm">
                        {imageUrl ? imageUrl : "Processing upload..."}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        This photograph will appear on national inspection
                        databases, certificates, and the animal profile.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="px-3 py-1.5 text-xs font-semibold text-[#0d0d0d] dark:text-white bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#10a37f] transition-all cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isUploadingPhoto}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        void handlePhotoFileSelect(file);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-[#10a37f] bg-[#10a37f]/5"
                        : "border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f]/60 hover:bg-[#f9f9f9] dark:hover:bg-[#1f1f1f]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-[#0d0d0d] dark:text-white">
                      Click to upload cow photo or drag and drop
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      JPEG, PNG, WEBP or GIF (Max 5MB) &bull; Automatically
                      saved to Cloudinary
                    </p>
                  </div>
                )}

                {/* Upload Error Banner */}
                {photoUploadError && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{photoUploadError}</span>
                    <button
                      type="button"
                      onClick={() => setPhotoUploadError(null)}
                      className="font-bold opacity-70 hover:opacity-100"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {/* Optional Manual URL Fallback Input */}
                {showUrlFallback && (
                  <div className="pt-2 animate-in fade-in-50 duration-150">
                    <label
                      htmlFor="image-url"
                      className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1"
                    >
                      Direct Image Web URL (Optional Fallback)
                    </label>
                    <div className="relative">
                      <input
                        id="image-url"
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/animal-photo.jpg"
                        className="w-full px-3.5 py-2 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs focus:outline-none focus:border-[#10a37f]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Origin & Farm Assignment */}
          <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f1f5f9] dark:border-[#333333]">
              <Building2
                className="w-5 h-5 text-[#10a37f]"
                aria-hidden="true"
              />
              <h2 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                3. Origin &amp; Location Assignment
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="registration-source"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Registration Source *
                </label>
                <select
                  id="registration-source"
                  value={registrationSource}
                  onChange={(e) => setRegistrationSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
                >
                  <option value="BORN_ON_FARM">Born on Farm (Calved)</option>
                  <option value="PURCHASED">Purchased / Acquired</option>
                  <option value="TRANSFERRED">
                    Transferred from another facility
                  </option>
                  <option value="IMPORTED">Imported Livestock</option>
                  <option value="OTHER">Other Authorized Registration</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="farm-id"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Assigned Farm Facility *
                </label>
                <select
                  id="farm-id"
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
                >
                  {farms.length === 0 && (
                    <option value="">Loading farms…</option>
                  )}
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.registrationNumber}) &bull; {f.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Pedigree & Lineage (Optional) */}
          <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f1f5f9] dark:border-[#333333]">
              <Dna className="w-5 h-5 text-[#10a37f]" aria-hidden="true" />
              <h2 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                4. Pedigree &amp; Lineage Verification (Optional)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="mother-tag"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Mother / Dam (Ear Tag or Animal ID)
                </label>
                <div className="relative">
                  <AnimalTagAutocomplete
                    value={motherTagOrId}
                    onSelect={(tag) => setMotherTagOrId(tag)}
                    placeholder="e.g. COW-LK-1002"
                    className="w-full"
                  />
                </div>
                <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e] mt-1 block">
                  Must be registered as a FEMALE cow.
                </span>
              </div>

              <div>
                <label
                  htmlFor="father-tag"
                  className="block text-xs font-bold text-[#0d0d0d] dark:text-white mb-1"
                >
                  Father / Sire (Ear Tag or Animal ID)
                </label>
                <div className="relative">
                  <AnimalTagAutocomplete
                    value={fatherTagOrId}
                    onSelect={(tag) => setFatherTagOrId(tag)}
                    placeholder="e.g. BULL-LK-0044"
                    className="w-full"
                  />
                </div>
                <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e] mt-1 block">
                  Must be registered as a MALE bull or sire code.
                </span>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/animals"
              className="px-5 py-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold flex items-center gap-2 shadow-xs shadow-[#10a37f]/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw
                  className="w-4 h-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {isSubmitting
                  ? "Registering…"
                  : "Register Livestock & Generate QR"}
              </span>
            </button>
          </div>
        </form>

        {/* Registration Success Modal */}
        {registeredResult && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Animal registration successful"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-[#242424] rounded-3xl max-w-md w-full p-6 border border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
              </div>

              <div>
                <h2 className="font-bold text-lg text-[#0d0d0d] dark:text-white">
                  Registration Successful!
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Animal #{registeredResult.animal.animalNumber} has been
                  officially recorded in the national traceability registry.
                </p>
              </div>

              {/* QR Image — uses Next.js Image */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 inline-block shadow-inner">
                {registeredResult.animal.qrCode?.qrImageUrl ? (
                  <Image
                    src={registeredResult.animal.qrCode.qrImageUrl}
                    alt={`QR code for animal ${registeredResult.animal.animalNumber}`}
                    width={192}
                    height={192}
                    className="w-48 h-48 mx-auto"
                    unoptimized
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">
                    QR Generated
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500">
                <p className="font-bold text-gray-900 dark:text-white">
                  {registeredResult.animal.breed} &bull;{" "}
                  {registeredResult.animal.gender === "FEMALE"
                    ? "Female"
                    : "Male"}
                </p>
                {registeredResult.animal.qrCode?.qrValue && (
                  <p className="text-[11px] text-gray-400 mt-0.5 break-all font-mono">
                    {registeredResult.animal.qrCode.qrValue}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {/* Official Ear Tag Badge Trigger */}
                <button
                  type="button"
                  onClick={() => setIsBadgeModalOpen(true)}
                  disabled={!registeredResult.animal.qrCode?.qrImageUrl}
                  aria-label={`View and download official A7 ear tag badge for ${registeredResult.animal.animalNumber}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Tag className="w-4 h-4" aria-hidden="true" />
                  <span>Official Ear Tag Badge (PDF / Print)</span>
                </button>

                {/* Raw QR Option */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline cursor-pointer"
                  >
                    Download raw QR image only
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRegisterAnother}
                  className="py-2.5 px-4 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#333]"
                >
                  Register Another
                </button>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/animals/${registeredResult.animal.id}`)
                  }
                  className="py-2.5 px-4 rounded-xl bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 text-xs font-bold"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated A7 Ear Tag Badge Modal */}
        <EarTagBadgeModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          data={getBadgeData()}
        />
      </div>
    </DashboardLayout>
  );
}
