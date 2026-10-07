import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  RefreshCw,
  Camera,
  QrCode,
  Tag,
  Building2,
  ShieldCheck,
  Scale,
  Radio,
  Dna,
  Plus,
} from "lucide-react";
import AnimalPhoto from "@/components/common/AnimalPhoto";
import { AnimalDetailResponse } from "@/services/animals.service";

interface CowDetailsTabProps {
  animal: AnimalDetailResponse;
  hasPermissionOnFarm: (permission: string, farmId?: string) => boolean;
  isPhotoUploading: boolean;
  handlePhotoUpload: (file: File) => void;
  setIsReplaceQrModalOpen: (open: boolean) => void;
  setIsBadgeModalOpen: (open: boolean) => void;
  handleDownloadQr: () => void;
  calculateAge: (dob: string) => string;
  setIsAddIdModalOpen: (open: boolean) => void;
}

export function CowDetailsTab({
  animal,
  hasPermissionOnFarm,
  isPhotoUploading,
  handlePhotoUpload,
  setIsReplaceQrModalOpen,
  setIsBadgeModalOpen,
  handleDownloadQr,
  calculateAge,
  setIsAddIdModalOpen,
}: CowDetailsTabProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Visual Identity & Cryptographic QR Tag & Farm (4 cols on xl) */}
        <div className="xl:col-span-4 space-y-5">
          {/* Tablet 2-col wrapper for Photo + QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5">
            {/* Photo Card */}
            <div className="relative h-64 sm:h-72 w-full rounded-3xl overflow-hidden bg-gray-100 dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] shadow-xs group">
              <AnimalPhoto
                src={animal.imageUrl}
                alt={animal.animalNumber}
                animalNumber={animal.animalNumber}
                species={animal.species}
                gender={animal.gender}
                className="w-full h-full"
                showBadge={false}
              />

              {/* Status Tag Overlay */}
              <div className="absolute top-3.5 right-3.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 dark:bg-[#1f1f1f]/95 text-[#10a37f] border border-[#10a37f]/30 backdrop-blur-md shadow-xs">
                  {animal.status}
                </span>
              </div>

              {/* Hidden File Input for Cloudinary Upload */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handlePhotoUpload(file);
                  }
                }}
              />

              {/* Change / Upload Photo Overlay Button */}
              {hasPermissionOnFarm("animal:update", animal.farmId) && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isPhotoUploading}
                  className="absolute bottom-3.5 right-3.5 px-3.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-white/20 hover:scale-103"
                  title="Upload photo to Cloudinary cloud storage"
                >
                  {isPhotoUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>
                    {isPhotoUploading
                      ? "Saving..."
                      : animal.imageUrl
                        ? "Change Photo"
                        : "Upload Photo"}
                  </span>
                </button>
              )}
            </div>

            {/* Cryptographic QR Ear Tag Section */}
            <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#10a37f]" />
                  <h3 className="font-bold text-xs sm:text-sm text-[#0d0d0d] dark:text-white">
                    Cryptographic QR Tag
                  </h3>
                </div>
                {hasPermissionOnFarm("animal:update", animal.farmId) && (
                  <button
                    type="button"
                    onClick={() => setIsReplaceQrModalOpen(true)}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Replace Tag
                  </button>
                )}
              </div>

              <div className="text-center space-y-3">
                <div className="p-3.5 bg-white rounded-2xl border border-gray-200 inline-block shadow-xs">
                  {animal.activeQr?.qrImageUrl ? (
                    <Image
                      src={animal.activeQr.qrImageUrl}
                      alt={`QR code for ${animal.animalNumber}`}
                      width={140}
                      height={140}
                      className="w-36 h-36 mx-auto"
                      unoptimized
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-xs text-gray-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
                    STATUS: {animal.activeQr?.status || "ACTIVE"}
                  </span>
                  <p className="text-[11px] font-mono text-gray-500 mt-1.5 truncate px-2">
                    {animal.activeQr?.qrValue}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsBadgeModalOpen(true)}
                    disabled={!animal.activeQr?.qrImageUrl}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Official Ear Tag Badge (A7)</span>
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline cursor-pointer"
                    >
                      Download raw QR image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Farm Facility Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Assigned Facility
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#0d0d0d] dark:text-white truncate">
                {animal.farm?.name || "Unassigned Herd Facility"}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                Reg #{animal.farm?.registrationNumber || "Pending"} &bull;{" "}
                {animal.farm?.city || "Central"} (
                {animal.farm?.province || "Province"})
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Traits Grid & Identifiers & Pedigree (8 cols on xl) */}
        <div className="xl:col-span-8 space-y-5">
          {/* Biological Traits Grid */}
          <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <ShieldCheck className="w-4 h-4 text-[#10a37f]" />
              Official Livestock Attributes
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Official Tag
                </span>
                <span className="text-xs sm:text-sm font-black text-[#0d0d0d] dark:text-white mt-1 block font-mono">
                  {animal.animalNumber}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Breed
                </span>
                <span
                  className="text-xs sm:text-sm font-bold text-[#0d0d0d] dark:text-white mt-1 block truncate"
                  title={animal.breed}
                >
                  {animal.breed}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Gender
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0d0d0d] dark:text-white mt-1 block">
                  {animal.gender === "FEMALE" ? "Female (Cow)" : "Male (Bull)"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Age
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0d0d0d] dark:text-white mt-1 block">
                  {calculateAge(animal.dateOfBirth)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block items-center gap-1">
                  <Scale className="w-3 h-3 text-[#10a37f]" />
                  Body Weight
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#10a37f] mt-1 block">
                  {animal.weight ? `${animal.weight} kg` : "—"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Date of Birth
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0d0d0d] dark:text-white mt-1 block">
                  {animal.dateOfBirth
                    ? new Date(animal.dateOfBirth).toLocaleDateString()
                    : "—"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Coat &amp; Markings
                </span>
                <span
                  className="text-xs sm:text-sm font-bold text-[#0d0d0d] dark:text-white mt-1 block truncate"
                  title={animal.color || "Standard"}
                >
                  {animal.color || "Standard"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Registered
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0d0d0d] dark:text-white mt-1 block">
                  {animal.registrationDate
                    ? new Date(animal.registrationDate).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Registered Physical Identifiers Section */}
          <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#10a37f]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Registered Physical Identifiers (
                  {animal.identifiers?.length || 0})
                </h3>
              </div>
              {hasPermissionOnFarm("animal:update", animal.farmId) && (
                <button
                  type="button"
                  onClick={() => setIsAddIdModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Identifier</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {animal.identifiers?.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No additional physical identifiers registered yet.
                </p>
              ) : (
                animal.identifiers?.map((idItem) => (
                  <div
                    key={idItem.id}
                    className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center font-bold text-xs shrink-0">
                        {idItem.identifierType === "RFID" ? (
                          <Radio className="w-4 h-4" />
                        ) : (
                          <Tag className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm font-mono text-[#0d0d0d] dark:text-white truncate">
                            {idItem.identifierValue}
                          </span>
                          {idItem.isPrimary && (
                            <span className="px-2 py-0.5 rounded-md bg-[#10a37f] text-white text-[10px] font-bold shrink-0">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 block">
                          Type: {idItem.identifierType} &bull; Attached on{" "}
                          {new Date(idItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pedigree & Lineage Verification */}
          <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Dna className="w-4 h-4 text-[#10a37f]" />
                Pedigree &amp; Lineage Verification
              </h3>
              <span className="text-[10.5px] font-semibold text-gray-500">
                Certified Parentage Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Mother */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Dam / Mother
                </span>
                {animal.mother ? (
                  <div className="pt-0.5">
                    <Link
                      href={`/animals/${animal.mother.id}`}
                      className="font-bold text-xs sm:text-sm text-[#10a37f] hover:underline block truncate"
                    >
                      {animal.mother.animalNumber}
                    </Link>
                    <span className="text-[11px] text-gray-500 truncate block">
                      {animal.mother.breed}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-xs block pt-1">
                    Not recorded / Foundation
                  </span>
                )}
              </div>

              {/* Father */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Sire / Father
                </span>
                {animal.father ? (
                  <div className="pt-0.5">
                    <Link
                      href={`/animals/${animal.father.id}`}
                      className="font-bold text-xs sm:text-sm text-[#10a37f] hover:underline block truncate"
                    >
                      {animal.father.animalNumber}
                    </Link>
                    <span className="text-[11px] text-gray-500 truncate block">
                      {animal.father.breed}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-xs block pt-1">
                    Not recorded / AI Straw
                  </span>
                )}
              </div>

              {/* Offspring */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Registered Progeny
                </span>
                <span className="text-base font-black text-[#0d0d0d] dark:text-white block">
                  {animal.offspringCount} Calves
                </span>
                <span className="text-[11px] text-gray-500">
                  Traceable direct descendants
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
