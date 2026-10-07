import React from 'react';
import Link from 'next/link';
import {
  PawPrint,
  QrCode,
  Users,
  HeartPulse,
  Milk,
  Dna,
  Route,
  ChartNoAxesCombined,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  accentColor: string;
  highlights: string[];
  status: 'live' | 'available';
}

const features: Feature[] = [
  {
    icon: PawPrint,
    title: 'Animal Management',
    description:
      'Register animals with species, breed, gender, date of birth, and physical attributes. Maintain a complete herd inventory with real-time status tracking.',
    href: '/animals',
    accentColor: '#10a37f',
    highlights: ['Animal Registration', 'Herd Inventory', 'Status Tracking', 'Audit History'],
    status: 'live',
  },
  {
    icon: QrCode,
    title: 'QR Identification',
    description:
      'Automatically generate unique QR codes on animal registration. Download, print, or replace damaged QR codes while maintaining a full replacement history.',
    href: '/animals/qr',
    accentColor: '#0ea5e9',
    highlights: ['Auto QR Generation', 'Download & Print', 'QR Replacement', 'QR History'],
    status: 'live',
  },
  {
    icon: Tag,
    title: 'Multi-Identifier Support',
    description:
      'Assign multiple identification methods per animal — QR code, RFID tag, ear tag, and national ID — with one designated as the primary identifier.',
    href: '/animals',
    accentColor: '#f59e0b',
    highlights: ['RFID Tag', 'Ear Tag', 'National ID', 'Primary Identifier'],
    status: 'live',
  },
  {
    icon: Users,
    title: 'Staff Management',
    description:
      'Manage farm facility workforce, add staff members, assign operational roles, and set granular permission controls for each employee.',
    href: '/staff',
    accentColor: '#10a37f',
    highlights: ['Farm Profile', 'Staff Management', 'Role Assignment', 'Permission Control'],
    status: 'live',
  },
  {
    icon: HeartPulse,
    title: 'Health & Veterinary',
    description:
      'Record health checks, vaccination schedules, veterinary treatments, and maintain quarantine status for biosecurity management.',
    href: '/health',
    accentColor: '#ef4444',
    highlights: ['Health Records', 'Vaccinations', 'Treatments', 'Quarantine Status'],
    status: 'available',
  },
  {
    icon: Milk,
    title: 'Milk Production',
    description:
      'Log daily milking sessions with morning, afternoon, and evening yields. Track production performance per animal and per herd.',
    href: '/production',
    accentColor: '#0ea5e9',
    highlights: ['Session Logging', 'Daily Yields', 'Per-Animal Records', 'Production Trends'],
    status: 'available',
  },
  {
    icon: Dna,
    title: 'Breeding & Genetics',
    description:
      'Record artificial insemination services, track sire and dam lineage, log pregnancy diagnoses, and manage calving records.',
    href: '/breeding',
    accentColor: '#8b5cf6',
    highlights: ['AI Records', 'Lineage Tracking', 'Pregnancy Diagnosis', 'Calving Registry'],
    status: 'available',
  },
  {
    icon: Route,
    title: 'Traceability & Movement',
    description:
      'Issue transport permits, verify movement clearances, and log animal ownership changes to maintain a complete chain of custody.',
    href: '/movement',
    accentColor: '#10a37f',
    highlights: ['Movement Permits', 'Chain of Custody', 'Ownership Changes', 'Transit History'],
    status: 'available',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Dashboard & Analytics',
    description:
      'Generate herd summaries, production reports, and export structured data as CSV directly from the platform.',
    href: '/dashboard',
    accentColor: '#0ea5e9',
    highlights: ['Herd Reports', 'CSV Export', 'Dashboard Analytics', 'Production Summary'],
    status: 'available',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-[#f9f9f9] dark:bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-14">
          <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
            Platform Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-4">
            Every tool your livestock operation needs
          </h2>
          <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
            AITS brings together the essential modules for managing animal identity,
            farm operations, and traceability in one connected system.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description, href, accentColor, highlights, status }) => (
            <Link
              key={title}
              href={href}
              className="group relative p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] bg-white dark:bg-[#2f2f2f] hover:border-[#10a37f]/40 hover:shadow-xl hover:shadow-[#10a37f]/5 transition-all duration-200 hover:-translate-y-0.5 block"
            >
              {/* Status badge */}
              {status === 'live' && (
                <span className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10a37f]/10 border border-[#10a37f]/25 text-[#10a37f] text-[10.5px] font-bold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]" />
                  Live
                </span>
              )}

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: `${accentColor}15`,
                  border: `1px solid ${accentColor}25`,
                }}
              >
                <Icon className="w-5.5 h-5.5" style={{ color: accentColor }} />
              </div>

              {/* Title */}
              <h3 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white mb-2 leading-snug pr-14">
                {title}
              </h3>

              {/* Description */}
              <p className="text-[13.5px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed mb-4">
                {description}
              </p>

              {/* Highlight pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {highlights.map((h) => (
                  <span
                    key={h}
                    className="px-2 py-0.5 rounded-md bg-[#f4f4f4] dark:bg-[#383838] text-[#5d5d5d] dark:text-[#8e8e8e] text-[11.5px] font-medium"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Link arrow */}
              <div className="flex items-center gap-1.5 text-[#10a37f] text-[13px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <span>Explore module</span>
                <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
