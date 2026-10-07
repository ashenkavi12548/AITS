"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Check, X } from "lucide-react";

export interface AvatarPreset {
  id: string;
  name: string;
  category: "roles" | "livestock" | "abstract";
  badge: string;
  gradient: string;
  svgDataUrl: string;
}

// Helper generator to produce crisp, high-resolution SVG Data URIs for avatars
function createSvgDataUrl(
  bgGradientStart: string,
  bgGradientEnd: string,
  accentColor: string,
  iconContentSvg: string,
): string {
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}" />
        <stop offset="100%" stop-color="${bgGradientEnd}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.3" />
      </filter>
    </defs>
    <circle cx="100" cy="100" r="100" fill="url(#avatarGrad)" />
    <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
    <circle cx="100" cy="100" r="55" fill="rgba(255,255,255,0.1)" backdrop-filter="blur(4px)" />
    <g filter="url(#shadow)" fill="${accentColor}">
      ${iconContentSvg}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// Catalog of 12 Modern Avatars
export const MODERN_AVATARS: AvatarPreset[] = [
  {
    id: "master_farmer",
    name: "Master Farmer",
    category: "roles",
    badge: "Farmer",
    gradient: "from-emerald-500 to-teal-700",
    svgDataUrl: createSvgDataUrl(
      "#10b981",
      "#0f766e",
      "#ffffff",
      `<path d="M100 45 C75 45 65 60 65 72 C65 85 75 90 100 90 C125 90 135 85 135 72 C135 60 125 45 100 45 Z" />
       <path d="M50 160 C50 120 70 110 100 110 C130 110 150 120 150 160 Z" opacity="0.95" />
       <circle cx="100" cy="70" r="24" fill="#ffffff" />
       <path d="M60 48 L140 48 L130 38 L70 38 Z" fill="#fef08a" />`,
    ),
  },
  {
    id: "chief_vet",
    name: "Chief Veterinarian",
    category: "roles",
    badge: "Vet Officer",
    gradient: "from-indigo-500 to-blue-700",
    svgDataUrl: createSvgDataUrl(
      "#6366f1",
      "#1d4ed8",
      "#ffffff",
      `<circle cx="100" cy="72" r="26" />
       <path d="M50 160 C50 120 70 110 100 110 C130 110 150 120 150 160 Z" />
       <rect x="92" y="125" width="16" height="26" rx="4" fill="#6366f1" />
       <rect x="87" y="130" width="26" height="16" rx="4" fill="#6366f1" />`,
    ),
  },
  {
    id: "bovine_mascot",
    name: "Bovine Champion",
    category: "livestock",
    badge: "Livestock",
    gradient: "from-amber-500 to-orange-700",
    svgDataUrl: createSvgDataUrl(
      "#f59e0b",
      "#c2410c",
      "#ffffff",
      `<path d="M65 65 Q40 50 35 75 Q60 85 70 80 Z" />
       <path d="M135 65 Q160 50 165 75 Q140 85 130 80 Z" />
       <path d="M70 70 C70 50 130 50 130 70 C130 110 120 135 100 135 C80 135 70 110 70 70 Z" />
       <circle cx="85" cy="88" r="7" fill="#1e293b" />
       <circle cx="115" cy="88" r="7" fill="#1e293b" />
       <ellipse cx="100" cy="115" rx="16" ry="10" fill="#fde68a" />`,
    ),
  },
  {
    id: "biosecurity_spec",
    name: "Biosecurity Inspector",
    category: "roles",
    badge: "Inspector",
    gradient: "from-purple-500 to-pink-700",
    svgDataUrl: createSvgDataUrl(
      "#a855f7",
      "#be185d",
      "#ffffff",
      `<path d="M100 35 L145 55 V95 C145 130 100 155 100 155 C100 155 55 130 55 95 V55 Z" />
       <circle cx="100" cy="85" r="16" fill="#a855f7" />
       <path d="M92 85 L98 91 L110 79" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" />`,
    ),
  },
  {
    id: "agronomy_lead",
    name: "Farm Manager",
    category: "roles",
    badge: "Manager",
    gradient: "from-teal-500 to-cyan-700",
    svgDataUrl: createSvgDataUrl(
      "#14b8a6",
      "#0e7490",
      "#ffffff",
      `<circle cx="100" cy="70" r="26" />
       <path d="M48 160 C48 122 68 112 100 112 C132 112 152 122 152 160 Z" />
       <path d="M100 45 C115 30 135 35 135 35 C135 35 130 55 115 60 C100 65 100 45 100 45 Z" fill="#86efac" />`,
    ),
  },
  {
    id: "goat_specialist",
    name: "Small Ruminant Spec",
    category: "livestock",
    badge: "Caprine",
    gradient: "from-emerald-600 to-emerald-900",
    svgDataUrl: createSvgDataUrl(
      "#059669",
      "#064e3b",
      "#ffffff",
      `<path d="M75 55 Q55 30 50 70 Z" />
       <path d="M125 55 Q145 30 150 70 Z" />
       <path d="M72 75 C72 55 128 55 128 75 C128 115 118 135 100 135 C82 135 72 115 72 75 Z" />
       <circle cx="86" cy="90" r="6" fill="#064e3b" />
       <circle cx="114" cy="90" r="6" fill="#064e3b" />`,
    ),
  },
  {
    id: "data_analyst",
    name: "Traceability Analyst",
    category: "abstract",
    badge: "Data Sci",
    gradient: "from-cyan-500 to-blue-700",
    svgDataUrl: createSvgDataUrl(
      "#06b6d4",
      "#1d4ed8",
      "#ffffff",
      `<rect x="50" y="110" width="20" height="40" rx="4" />
       <rect x="80" y="80" width="20" height="70" rx="4" />
       <rect x="110" y="50" width="20" height="100" rx="4" />
       <path d="M50 90 L85 65 L115 75 L145 40" stroke="#fef08a" stroke-width="6" stroke-linecap="round" fill="none" />`,
    ),
  },
  {
    id: "super_admin",
    name: "System Super Admin",
    category: "roles",
    badge: "Super Admin",
    gradient: "from-violet-600 to-purple-900",
    svgDataUrl: createSvgDataUrl(
      "#7c3aed",
      "#4c1d95",
      "#ffffff",
      `<path d="M60 70 L75 110 L100 65 L125 110 L140 70 L150 120 H50 Z" fill="#facc15" />
       <circle cx="100" cy="138" r="14" fill="#ffffff" />
       <path d="M50 160 H150 V150 H50 Z" fill="#facc15" />`,
    ),
  },
  {
    id: "eco_pastoral",
    name: "Eco Pastoralist",
    category: "abstract",
    badge: "Organic",
    gradient: "from-lime-500 to-green-800",
    svgDataUrl: createSvgDataUrl(
      "#84cc16",
      "#166534",
      "#ffffff",
      `<path d="M100 40 C60 80 60 120 100 160 C140 120 140 80 100 40 Z" />
       <path d="M100 70 V140 M100 90 L120 110 M100 110 L80 130" stroke="#166534" stroke-width="5" stroke-linecap="round" />`,
    ),
  },
  {
    id: "cyber_tech",
    name: "RFID & IoT Tech",
    category: "abstract",
    badge: "IoT Tech",
    gradient: "from-sky-500 to-indigo-800",
    svgDataUrl: createSvgDataUrl(
      "#0ea5e9",
      "#3730a3",
      "#ffffff",
      `<rect x="70" y="70" width="60" height="60" rx="12" fill="#3730a3" stroke="#38bdf8" stroke-width="4" />
       <circle cx="100" cy="100" r="14" fill="#38bdf8" />
       <path d="M50 100 H70 M130 100 H150 M100 50 V70 M100 130 V150" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />`,
    ),
  },
  {
    id: "govt_officer",
    name: "Government Officer",
    category: "roles",
    badge: "Govt Reg",
    gradient: "from-rose-500 to-red-800",
    svgDataUrl: createSvgDataUrl(
      "#f43f5e",
      "#9f1239",
      "#ffffff",
      `<path d="M50 60 L100 35 L150 60 V100 H50 Z" />
       <rect x="65" y="100" width="12" height="45" fill="#ffffff" />
       <rect x="94" y="100" width="12" height="45" fill="#ffffff" />
       <rect x="123" y="100" width="12" height="45" fill="#ffffff" />
       <rect x="50" y="145" width="100" height="12" rx="2" fill="#ffffff" />`,
    ),
  },
  {
    id: "golden_guardian",
    name: "National Guardian",
    category: "abstract",
    badge: "Certified",
    gradient: "from-amber-400 to-yellow-600",
    svgDataUrl: createSvgDataUrl(
      "#fbbf24",
      "#ca8a04",
      "#1e293b",
      `<polygon points="100,35 120,75 165,80 130,110 140,155 100,130 60,155 70,110 35,80 80,75" fill="#ffffff" />`,
    ),
  },
];

interface AvatarPresetSelectorProps {
  currentAvatarUrl: string | null;
  onClose: () => void;
  onSelectAvatar: (svgDataUrl: string, avatarName: string) => void;
}

export default function AvatarPresetSelector({
  currentAvatarUrl,
  onClose,
  onSelectAvatar,
}: AvatarPresetSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "roles" | "livestock" | "abstract"
  >("all");
  const [activeAvatarId, setActiveAvatarId] = useState<string | null>(null);

  const filteredAvatars = MODERN_AVATARS.filter(
    (item) => selectedCategory === "all" || item.category === selectedCategory,
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] text-white rounded-3xl border border-zinc-800 max-w-2xl w-full overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide text-white">
                Choose Default Avatar
              </h3>
              <p className="text-xs text-zinc-400">
                Select a modern, high-resolution vector avatar tailored for AITS
                operators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-zinc-800/60 pb-3">
          {(
            [
              { id: "all", label: "All Avatars" },
              { id: "roles", label: "Roles & Professions" },
              { id: "livestock", label: "Livestock & Species" },
              { id: "abstract", label: "Badges & Tech" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#10a37f] text-white shadow-md shadow-[#10a37f]/20"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Avatar Grid */}
        <div className="p-6 max-h-95 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 custom-scrollbar">
          {filteredAvatars.map((avatar) => {
            const isSelected =
              activeAvatarId === avatar.id ||
              currentAvatarUrl === avatar.svgDataUrl;
            return (
              <div
                key={avatar.id}
                onClick={() => {
                  setActiveAvatarId(avatar.id);
                  onSelectAvatar(avatar.svgDataUrl, avatar.name);
                }}
                className={`group relative rounded-2xl p-3 border transition-all duration-200 cursor-pointer flex flex-col items-center text-center space-y-2 ${
                  isSelected
                    ? "bg-zinc-900 border-[#10a37f] shadow-lg shadow-[#10a37f]/20 scale-[1.02]"
                    : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                {/* Avatar SVG Preview */}
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-md relative group-hover:scale-105 transition-transform duration-200">
                  <Image
                    src={avatar.svgDataUrl}
                    alt={avatar.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />

                  {/* Selected indicator overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#10a37f]/40 backdrop-blur-[1px] flex items-center justify-center text-white rounded-full">
                      <Check className="w-6 h-6 stroke-3" />
                    </div>
                  )}
                </div>

                {/* Avatar Meta */}
                <div className="space-y-0.5 w-full">
                  <h4 className="text-xs font-bold text-zinc-200 truncate">
                    {avatar.name}
                  </h4>
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                    {avatar.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#18181b] flex items-center justify-between text-xs text-zinc-400">
          <span>Click any avatar to apply immediately</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
