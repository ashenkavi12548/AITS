import React from 'react';
import Link from 'next/link';
import { QrCode, Download, Printer, RefreshCw, History, ArrowRight } from 'lucide-react';

const qrCapabilities = [
  {
    icon: QrCode,
    title: 'Auto-Generated on Registration',
    description: 'Every animal receives a unique QR code immediately upon registration. No manual setup required.',
  },
  {
    icon: Download,
    title: 'Download & Print',
    description: 'Download QR codes as image files and print physical labels for attachment to animals or their housing.',
  },
  {
    icon: RefreshCw,
    title: 'Replace Damaged Codes',
    description: 'Replace lost or damaged QR codes atomically while preserving the complete replacement history.',
  },
  {
    icon: History,
    title: 'QR Audit History',
    description: 'Every QR code generation, activation, and replacement event is logged in a permanent audit trail.',
  },
];

export default function QrSection() {
  return (
    <section className="py-20 md:py-28 bg-white dark:bg-[#212121]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: QR visual mock */}
          <div className="relative order-2 lg:order-1">
            <div className="bg-[#f9f9f9] dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] p-8 shadow-xl">
              {/* QR code visual representation */}
              <div className="flex flex-col items-center gap-6">
                {/* QR code SVG mockup */}
                <div className="relative">
                  <div className="w-48 h-48 bg-white rounded-xl border border-[#e5e5e5] dark:border-[#303030] p-4 shadow-sm flex items-center justify-center">
                    {/* QR code grid pattern */}
                    <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Sample QR code pattern">
                      {/* Corner squares */}
                      <rect x="5" y="5" width="28" height="28" fill="none" stroke="#10a37f" strokeWidth="3" />
                      <rect x="9" y="9" width="20" height="20" fill="#10a37f" opacity="0.2" />
                      <rect x="13" y="13" width="12" height="12" fill="#10a37f" />

                      <rect x="67" y="5" width="28" height="28" fill="none" stroke="#10a37f" strokeWidth="3" />
                      <rect x="71" y="9" width="20" height="20" fill="#10a37f" opacity="0.2" />
                      <rect x="75" y="13" width="12" height="12" fill="#10a37f" />

                      <rect x="5" y="67" width="28" height="28" fill="none" stroke="#10a37f" strokeWidth="3" />
                      <rect x="9" y="71" width="20" height="20" fill="#10a37f" opacity="0.2" />
                      <rect x="13" y="75" width="12" height="12" fill="#10a37f" />

                      {/* Data modules */}
                      <rect x="40" y="5" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="50" y="5" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="40" y="12" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="55" y="12" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="5" y="40" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="5" y="50" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="12" y="40" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="20" y="45" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="40" y="40" width="5" height="5" fill="#10a37f" />
                      <rect x="50" y="40" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="60" y="40" width="5" height="5" fill="#10a37f" />
                      <rect x="40" y="50" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="55" y="50" width="5" height="5" fill="#10a37f" />
                      <rect x="40" y="60" width="5" height="5" fill="#10a37f" />
                      <rect x="50" y="60" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="70" y="40" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="80" y="40" width="5" height="5" fill="#10a37f" />
                      <rect x="90" y="40" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="70" y="50" width="5" height="5" fill="#10a37f" />
                      <rect x="90" y="50" width="5" height="5" fill="#10a37f" />
                      <rect x="75" y="60" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="85" y="60" width="5" height="5" fill="#10a37f" />
                      <rect x="40" y="70" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="50" y="70" width="5" height="5" fill="#10a37f" />
                      <rect x="60" y="70" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="40" y="80" width="5" height="5" fill="#10a37f" />
                      <rect x="55" y="80" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="40" y="90" width="5" height="5" fill="#0d0d0d" opacity="0.7" />
                      <rect x="50" y="90" width="5" height="5" fill="#10a37f" />
                      <rect x="60" y="90" width="5" height="5" fill="#10a37f" />
                    </svg>
                  </div>
                  {/* Scan corner indicators */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-[#10a37f] rounded-tl-sm" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-[#10a37f] rounded-tr-sm" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-[#10a37f] rounded-bl-sm" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-[#10a37f] rounded-br-sm" />
                </div>

                {/* Animal info card below QR */}
                <div className="w-full bg-white dark:bg-[#212121] rounded-xl border border-[#e5e5e5] dark:border-[#303030] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] text-[#8e8e8e] dark:text-[#737373] mb-0.5">Animal ID</div>
                      <div className="text-[14px] font-mono font-bold text-[#0d0d0d] dark:text-white">HDF-2024-0047</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-[#8e8e8e] dark:text-[#737373] mb-0.5">Status</div>
                      <span className="px-2 py-0.5 rounded-full bg-[#10a37f]/10 text-[#10a37f] text-[11px] font-bold border border-[#10a37f]/25">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#f0f0f0] dark:border-[#383838] flex gap-4">
                    <div>
                      <div className="text-[11px] text-[#8e8e8e]">Breed</div>
                      <div className="text-[12.5px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4]">Holstein-Friesian</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8e8e8e]">Farm</div>
                      <div className="text-[12.5px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4]">Highland Dairy Farm</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 w-full">
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#f4f4f4] dark:bg-[#383838] border border-[#e5e5e5] dark:border-[#303030] text-[12.5px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4]">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/25 text-[12.5px] font-medium text-[#10a37f]">
                    <Printer className="w-3.5 h-3.5" />
                    Print Label
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-[#10a37f]/8 blur-3xl -z-10" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-[#0ea5e9]/8 blur-3xl -z-10" />
          </div>

          {/* Right: content */}
          <div className="order-1 lg:order-2">
            <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
              QR Identification
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-5">
              Physical animal. Digital identity. Connected instantly.
            </h2>
            <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed mb-8">
              QR identification provides a convenient bridge between the physical
              animal and its digital profile. Each QR code links directly to
              the animal&apos;s registered identity and authorized records in AITS.
            </p>

            {/* Capabilities list */}
            <div className="space-y-4 mb-8">
              {qrCapabilities.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#10a37f]/12 border border-[#10a37f]/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#10a37f]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white leading-snug mb-0.5">
                      {title}
                    </div>
                    <div className="text-[13.5px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
                      {description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/animals/qr"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-colors shadow-sm"
            >
              Manage QR Codes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
