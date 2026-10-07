"use client";

import React, { useState } from "react";
import Image from "next/image";

export interface AnimalPhotoProps {
  src?: string | null;
  alt?: string;
  animalNumber?: string;
  species?: string;
  gender?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "auto" | "portrait";
  showBadge?: boolean;
  priority?: boolean;
}

/**
 * Enterprise Livestock Illustration Vector
 * Styled specifically for AITS Agricultural Livestock Traceability.
 */
function LivestockVector({
  gender,
  species,
  className = "w-12 h-12",
}: {
  gender?: string;
  species?: string;
  className?: string;
}) {
  const isMale = gender?.toUpperCase() === "MALE";
  const speciesLower = (species || "").toLowerCase();

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="livestockGrad"
          x1="12"
          y1="8"
          x2="52"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#10a37f" stopOpacity="0.85" />
          <stop offset="1" stopColor="#0d8265" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient
          id="livestockGlow"
          cx="32"
          cy="32"
          r="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#10a37f" stopOpacity="0.25" />
          <stop offset="1" stopColor="#10a37f" stopOpacity="0.02" />
        </radialGradient>
      </defs>

      {/* Subtle Background Glow Circle */}
      <circle cx="32" cy="32" r="26" fill="url(#livestockGlow)" />

      {/* Livestock Horns (Prominent for Male / Dairy Cattle) */}
      {isMale ||
      speciesLower.includes("cattle") ||
      speciesLower.includes("cow") ||
      speciesLower.includes("buffalo") ? (
        <path
          d="M17 18C15 12 21 8 26 12C23 15 21 18 20 22M47 18C49 12 43 8 38 12C41 15 43 18 44 22"
          stroke="url(#livestockGrad)"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {/* Left & Right Ears */}
      <path
        d="M16 26C11 25 9 29 12 32C15 34 19 32 20 29M48 26C53 25 55 29 52 32C49 34 45 32 44 29"
        stroke="url(#livestockGrad)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Head / Forehead Contour */}
      <path
        d="M22 22H42C44 25 45 30 45 36C45 44 41 50 32 50C23 50 19 44 19 36C19 30 20 25 22 22Z"
        fill="url(#livestockGrad)"
        fillOpacity="0.18"
        stroke="url(#livestockGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Muzzle & Nostrils */}
      <path
        d="M24 38C24 35 27 34 32 34C37 34 40 35 40 38C40 43 38 46 32 46C26 46 24 43 24 38Z"
        fill="url(#livestockGrad)"
        fillOpacity="0.3"
        stroke="url(#livestockGrad)"
        strokeWidth="2"
      />
      <circle cx="28.5" cy="40.5" r="1.5" fill="#10a37f" />
      <circle cx="35.5" cy="40.5" r="1.5" fill="#10a37f" />

      {/* Eyes */}
      <ellipse cx="26" cy="30" rx="1.75" ry="2" fill="#10a37f" />
      <ellipse cx="38" cy="30" rx="1.75" ry="2" fill="#10a37f" />

      {/* Official Livestock Ear Tag Accent (Right Ear) */}
      <rect
        x="13.5"
        y="30"
        width="4"
        height="5.5"
        rx="1"
        fill="#f59e0b"
        stroke="#d97706"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export default function AnimalPhoto({
  src,
  alt = "Livestock Photograph",
  animalNumber,
  species = "Cattle",
  gender,
  className = "",
  aspectRatio = "auto",
  showBadge = true,
  priority = false,
}: AnimalPhotoProps) {
  const [imgError, setImgError] = useState(false);

  const hasValidImage = Boolean(src && src.trim().length > 0 && !imgError);

  const getLabel = () => {
    if (gender?.toUpperCase() === "FEMALE") return "COW";
    if (gender?.toUpperCase() === "MALE") return "BULL";
    return species ? species.toUpperCase() : "LIVESTOCK";
  };

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-[#1a1a1a] transition-colors ${className}`}
      style={{
        aspectRatio:
          aspectRatio === "square"
            ? "1 / 1"
            : aspectRatio === "video"
              ? "16 / 9"
              : aspectRatio === "portrait"
                ? "3 / 4"
                : undefined,
      }}
    >
      {hasValidImage ? (
        <Image
          src={src!}
          alt={alt || animalNumber || "Livestock identity"}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-103"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center select-none bg-linear-to-b from-[#10a37f]/8 to-[#10a37f]/3 dark:from-[#10a37f]/10 dark:to-transparent">
          <LivestockVector
            gender={gender}
            species={species}
            className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 opacity-85 transition-transform duration-200 group-hover:scale-105"
          />
          {animalNumber && (
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-tight text-[#0d0d0d] dark:text-[#ececec] mt-2 opacity-90 truncate max-w-[90%]">
              {animalNumber}
            </span>
          )}
          {showBadge && (
            <span className="text-[9.5px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-[#10a37f]/15 text-[#10a37f] border border-[#10a37f]/30 mt-1 shadow-2xs">
              {getLabel()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
