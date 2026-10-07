import React from 'react';
import Link from 'next/link';
import { House, PawPrint, Tag, ClipboardList, Route, History, ArrowRight, ArrowDown } from 'lucide-react';

const traceabilitySteps = [
  { icon: House, label: 'Farm', sublabel: 'Origin farm registered in AITS', color: '#10a37f' },
  { icon: PawPrint, label: 'Animal', sublabel: 'Unique identity assigned', color: '#0ea5e9' },
  { icon: Tag, label: 'Identification', sublabel: 'Ear Tag · RFID · QR Code', color: '#f59e0b' },
  { icon: ClipboardList, label: 'Records', sublabel: 'Health · Production · Breeding', color: '#10a37f' },
  { icon: Route, label: 'Movement', sublabel: 'Transfer & permit history', color: '#8b5cf6' },
  { icon: History, label: 'Traceability', sublabel: 'Complete lifecycle timeline', color: '#10a37f' },
];

export default function TraceabilitySection() {
  return (
    <section id="traceability" className="py-20 md:py-28 bg-white dark:bg-[#212121]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: content */}
          <div>
            <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
              Traceability
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-5">
              The complete lifecycle of every animal, recorded.
            </h2>
            <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed mb-6">
              Animal traceability is the ability to follow an animal&apos;s journey
              from its farm of origin through all changes in identity, health, and location.
              AITS captures this journey through structured digital records.
            </p>
            <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed mb-8">
              Every status change, movement request, and ownership transfer is recorded
              in an audit trail — giving farm owners and authorized personnel a clear,
              chronological view of each animal&apos;s history.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {[
                'Status Transitions',
                'Movement Records',
                'Ownership History',
                'Audit Trail',
                'QR History',
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg bg-[#10a37f]/10 border border-[#10a37f]/20 text-[#10a37f] text-[12.5px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Link
              href="/movement"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-colors shadow-sm"
            >
              View Traceability
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right: traceability flow */}
          <div className="relative">
            <div className="bg-[#f9f9f9] dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] p-7 shadow-xl">
              <div className="text-[12px] font-bold uppercase tracking-widest text-[#8e8e8e] dark:text-[#737373] mb-6">
                Animal Lifecycle Flow
              </div>
              <div className="space-y-0">
                {traceabilitySteps.map(({ icon: Icon, label, sublabel, color }, i) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${color}18`,
                          border: `1.5px solid ${color}30`,
                        }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color }} />
                      </div>
                      {i < traceabilitySteps.length - 1 && (
                        <div className="flex flex-col items-center my-1">
                          <div className="w-px h-3 bg-[#e5e5e5] dark:bg-[#383838]" />
                          <ArrowDown className="w-3 h-3 text-[#c0c0c0] dark:text-[#505050]" />
                          <div className="w-px h-3 bg-[#e5e5e5] dark:bg-[#383838]" />
                        </div>
                      )}
                    </div>
                    <div className="pt-1.5 pb-1">
                      <div className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white leading-snug">
                        {label}
                      </div>
                      <div className="text-[12px] text-[#8e8e8e] dark:text-[#737373] mt-0.5">
                        {sublabel}
                      </div>
                    </div>
                    {/* Record chip on last */}
                    {i === traceabilitySteps.length - 1 && (
                      <div className="ml-auto mt-1 px-2.5 py-1 rounded-full bg-[#10a37f]/12 border border-[#10a37f]/25 text-[#10a37f] text-[10.5px] font-bold uppercase tracking-wide">
                        Complete
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full bg-[#10a37f]/6 blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
