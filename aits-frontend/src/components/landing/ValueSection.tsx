import React from 'react';
import { Radio, QrCode, Building2, Route } from 'lucide-react';

const values = [
  {
    icon: Radio,
    title: 'Centralized Animal Identity',
    description:
      'Every animal gets a unique digital identity with ear tag, RFID, and QR identifiers linked to a permanent digital profile.',
    color: '#10a37f',
  },
  {
    icon: QrCode,
    title: 'QR-Based Identification',
    description:
      'Instantly generate and manage QR codes for each animal. Replace damaged codes while preserving the complete QR history.',
    color: '#0ea5e9',
  },
  {
    icon: Building2,
    title: 'Farm-Level Management',
    description:
      'Manage farm information, assign staff with specific operational permissions, and control access across your livestock facility.',
    color: '#f59e0b',
  },
  {
    icon: Route,
    title: 'Traceability Records',
    description:
      'Maintain a verifiable timeline of animal movements, status changes, and ownership records through a structured digital audit trail.',
    color: '#10a37f',
  },
];

export default function ValueSection() {
  return (
    <section id="value" className="py-20 md:py-28 bg-white dark:bg-[#212121]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-14">
          <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
            Why AITS Exists
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-4">
            A digital foundation for livestock identity
          </h2>
          <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
            AITS brings animal identification, farm operations, and traceability
            records into a single connected platform — replacing fragmented
            paper-based systems with structured digital records.
          </p>
        </div>

        {/* Value cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] bg-[#f9f9f9] dark:bg-[#2f2f2f] hover:border-[#10a37f]/40 hover:shadow-lg hover:shadow-[#10a37f]/5 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="text-[14.5px] font-semibold text-[#0d0d0d] dark:text-white mb-2 leading-snug">
                {title}
              </h3>
              <p className="text-[13.5px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
