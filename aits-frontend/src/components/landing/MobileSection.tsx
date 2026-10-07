import React from "react";
import { Monitor, Smartphone, Server } from "lucide-react";

const platforms = [
  {
    icon: Monitor,
    label: "Web Application",
    description:
      "The AITS web platform runs in any modern browser. Manage animals, farms, records, and reports from desktop or laptop.",
    badge: "Live",
    badgeColor: "#10a37f",
    color: "#10a37f",
  },
  {
    icon: Server,
    label: "Backend API",
    description:
      "A structured REST API powers the platform. Farm-scoped endpoints serve authenticated web and mobile clients.",
    badge: "Live",
    badgeColor: "#10a37f",
    color: "#0ea5e9",
  },
  {
    icon: Smartphone,
    label: "Mobile Application",
    description:
      "A React Native / Expo mobile companion app is in active development. It will support field data entry and QR scanning for farm workers.",
    badge: "In Development",
    badgeColor: "#f59e0b",
    color: "#8b5cf6",
  },
];

export default function MobileSection() {
  return (
    <section className="py-20 md:py-28 bg-[#f9f9f9] dark:bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
            Platform Ecosystem
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-4">
            Web. API. Mobile. One connected system.
          </h2>
          <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
            AITS is designed to provide a connected experience across platforms,
            serving both office-based management and field operations.
          </p>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {platforms.map(
            ({ icon: Icon, label, description, badge, badgeColor, color }) => (
              <div
                key={label}
                className="group relative p-7 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] bg-white dark:bg-[#2f2f2f] hover:border-[#10a37f]/40 hover:shadow-xl hover:shadow-[#10a37f]/5 transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                {/* Status badge */}
                <span
                  className="absolute top-4 right-4 text-[10.5px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    color: badgeColor,
                    backgroundColor: `${badgeColor}15`,
                    borderColor: `${badgeColor}30`,
                  }}
                >
                  {badge}
                </span>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: `${color}15`,
                    border: `1.5px solid ${color}25`,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>

                <h3 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white mb-3 leading-snug">
                  {label}
                </h3>
                <p className="text-[13.5px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
                  {description}
                </p>
              </div>
            ),
          )}
        </div>

        {/* Connector line visualization */}
        <div className="flex items-center justify-center gap-0 mt-10 max-w-4xl mx-auto px-8">
          <div className="flex-1 h-px bg-linear-to-r from-transparent to-[#10a37f]/40" />
          <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#10a37f]/25 bg-[#10a37f]/8 text-[#10a37f] text-[12px] font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-pulse" />
            Shared Backend API
          </div>
          <div className="flex-1 h-px bg-linear-to-l from-transparent to-[#10a37f]/40" />
        </div>
      </div>
    </section>
  );
}
