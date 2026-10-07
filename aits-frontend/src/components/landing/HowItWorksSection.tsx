import React from "react";
import { PlusCircle, Tag, ClipboardList, Search } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: PlusCircle,
    title: "Register Animal",
    description:
      "Record the animal's identity including species, breed, gender, date of birth, color, weight, and initial farm assignment. A unique animal number is assigned on registration.",
    color: "#10a37f",
  },
  {
    number: "02",
    icon: Tag,
    title: "Assign Identification",
    description:
      "Connect the animal with one or more identification methods — QR code (auto-generated), RFID tag, ear tag, or national ID. Set a primary identifier for quick field lookup.",
    color: "#0ea5e9",
  },
  {
    number: "03",
    icon: ClipboardList,
    title: "Manage Records",
    description:
      "Maintain relevant animal information through connected AITS modules: health records, milk production logs, breeding records, feeding, and documents — all linked to the animal identity.",
    color: "#f59e0b",
  },
  {
    number: "04",
    icon: Search,
    title: "Trace & Monitor",
    description:
      "Access authorized animal information and traceability history whenever required. View the complete lifecycle timeline including status changes, movements, and ownership records.",
    color: "#10a37f",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-[#f9f9f9] dark:bg-[#171717]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-4">
            From registration to traceability in four steps
          </h2>
          <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
            AITS is designed around a simple operational workflow that any farm
            team can adopt — from field workers to farm owners.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-linear-to-r from-transparent via-[#e5e5e5] dark:via-[#303030] to-transparent z-0" />

          {steps.map(({ number, icon: Icon, title, description, color }) => (
            <div key={number} className="relative group">
              <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] p-6 hover:border-[#10a37f]/40 hover:shadow-lg hover:shadow-[#10a37f]/5 transition-all duration-200 hover:-translate-y-0.5 h-full">
                {/* Step number badge + icon */}
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: `${color}15`,
                      border: `1.5px solid ${color}30`,
                    }}
                  >
                    <Icon className="w-5.5 h-5.5" style={{ color }} />
                  </div>
                  <span
                    className="text-[28px] font-black leading-none tabular-nums"
                    style={{ color: `${color}35` }}
                  >
                    {number}
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white mb-2.5 leading-snug">
                  {title}
                </h3>
                <p className="text-[13.5px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
