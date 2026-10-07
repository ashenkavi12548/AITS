import React from 'react';
import Image from 'next/image';
import { Tag, QrCode, Database, Route, ArrowDown } from 'lucide-react';

const steps = [
  {
    icon: Tag,
    label: 'Physical Animal',
    sublabel: 'Livestock on farm',
    color: '#10a37f',
  },
  {
    icon: QrCode,
    label: 'Unique Identity',
    sublabel: 'Ear Tag · RFID · QR Code',
    color: '#0ea5e9',
  },
  {
    icon: Database,
    label: 'Digital Profile',
    sublabel: 'Registered in AITS',
    color: '#f59e0b',
  },
  {
    icon: Route,
    label: 'Traceability',
    sublabel: 'History & movements',
    color: '#10a37f',
  },
];

export default function IdentificationSection() {
  return (
    <section className="py-20 md:py-28 bg-white dark:bg-[#212121] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: text + flow */}
          <div>
            <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
              Animal Identification
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-5">
              One animal. One identity. Fully traceable.
            </h2>
            <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed mb-10">
              AITS connects every physical animal to a unique digital identity through
              multiple identification methods. Register once — track always.
              Each animal&apos;s identifier connects directly to its complete digital record.
            </p>

            {/* Vertical flow */}
            <div className="space-y-0">
              {steps.map(({ icon: Icon, label, sublabel, color }, i) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${color}18`,
                        border: `1.5px solid ${color}35`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex flex-col items-center mt-1 mb-1">
                        <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#303030]" />
                        <ArrowDown className="w-3 h-3 text-[#8e8e8e] dark:text-[#737373]" />
                        <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#303030]" />
                      </div>
                    )}
                  </div>
                  <div className="pt-1.5 pb-2">
                    <div className="text-[14.5px] font-semibold text-[#0d0d0d] dark:text-white leading-snug">
                      {label}
                    </div>
                    <div className="text-[12.5px] text-[#8e8e8e] dark:text-[#737373] mt-0.5">
                      {sublabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#e5e5e5] dark:border-[#303030] shadow-2xl shadow-black/10">
              <Image
                src="/images/cattle-ear-tag.jpg"
                alt="Dairy cow with a yellow identification ear tag in a modern farm facility"
                width={600}
                height={450}
                className="object-cover w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Overlay badge */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/95 dark:bg-[#212121]/95 backdrop-blur-sm rounded-xl border border-[#e5e5e5] dark:border-[#303030] px-4 py-3 flex items-center gap-3 shadow-lg">
                  <div className="w-9 h-9 rounded-lg bg-[#10a37f]/15 border border-[#10a37f]/25 flex items-center justify-center shrink-0">
                    <QrCode className="w-4.5 h-4.5 text-[#10a37f]" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white leading-snug">
                      Digital identity assigned
                    </div>
                    <div className="text-[11.5px] text-[#8e8e8e] dark:text-[#737373]">
                      Ear Tag · RFID · QR Code linked to animal profile
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10a37f] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10a37f]" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#10a37f]/8 dark:bg-[#10a37f]/5 blur-2xl -z-10" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-[#0ea5e9]/8 dark:bg-[#0ea5e9]/5 blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
