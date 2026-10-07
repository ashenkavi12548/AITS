import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  PawPrint,
  Users,
  HeartPulse,
  Milk,
  Dna,
  Route,
  Bell,
  ChartNoAxesCombined,
  Settings,
  ArrowRight,
} from 'lucide-react';

const modules = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'KPIs, charts, upcoming events, and herd health overview.',
    href: '/dashboard',
    color: '#10a37f',
    status: 'live' as const,
  },
  {
    icon: PawPrint,
    label: 'Animals',
    description: 'Herd inventory, animal profiles, and status management.',
    href: '/animals',
    color: '#10a37f',
    status: 'live' as const,
  },
  {
    icon: Users,
    label: 'Staff',
    description: 'Farm workforce delegation, employee credentials, and permissions.',
    href: '/staff',
    color: '#10a37f',
    status: 'live' as const,
  },
  {
    icon: HeartPulse,
    label: 'Health',
    description: 'Health records, vaccinations, and treatments.',
    href: '/health',
    color: '#ef4444',
    status: 'available' as const,
  },
  {
    icon: Milk,
    label: 'Production',
    description: 'Milk yield logs and production records.',
    href: '/production',
    color: '#0ea5e9',
    status: 'available' as const,
  },
  {
    icon: Dna,
    label: 'Breeding',
    description: 'AI records, pregnancy tracking, and calving.',
    href: '/breeding',
    color: '#8b5cf6',
    status: 'available' as const,
  },
  {
    icon: Route,
    label: 'Traceability',
    description: 'Movement permits and chain of custody records.',
    href: '/movement',
    color: '#10a37f',
    status: 'available' as const,
  },
  {
    icon: Bell,
    label: 'Notifications',
    description: 'Alerts, reminders, and operational messages.',
    href: '/notifications',
    color: '#f59e0b',
    status: 'available' as const,
  },
  {
    icon: ChartNoAxesCombined,
    label: 'Reports',
    description: 'Herd summaries and CSV data exports.',
    href: '/reports',
    color: '#0ea5e9',
    status: 'available' as const,
  },
  {
    icon: Settings,
    label: 'Settings',
    description: 'Profile, security, and account configuration.',
    href: '/settings',
    color: '#8e8e8e',
    status: 'live' as const,
  },
];

export default function ModulesSection() {
  return (
    <section className="py-20 md:py-28 bg-[#f9f9f9] dark:bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
            Platform Modules
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-4">
            A complete system, module by module
          </h2>
          <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
            AITS is organized into focused modules — each covering a specific area
            of farm and livestock management.
          </p>
        </div>

        {/* Status legend */}
        <div className="flex justify-center gap-5 mb-10">
          <div className="flex items-center gap-2 text-[12.5px] text-[#5d5d5d] dark:text-[#b4b4b4]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10a37f]" />
              <span className="font-semibold text-[#10a37f]">Live</span>
            </div>
            <span>— Fully operational</span>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-[#5d5d5d] dark:text-[#b4b4b4]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#8e8e8e]" />
              <span className="font-semibold">Available</span>
            </div>
            <span>— Accessible in platform</span>
          </div>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {modules.map(({ icon: Icon, label, description, href, color, status }) => (
            <Link
              key={label}
              href={href}
              className="group relative flex flex-col items-center text-center p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] bg-white dark:bg-[#2f2f2f] hover:border-[#10a37f]/40 hover:shadow-lg hover:shadow-[#10a37f]/5 transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* Live indicator */}
              {status === 'live' && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#10a37f]" />
              )}

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}25`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>

              <div className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white mb-1 leading-snug">
                {label}
              </div>
              <div className="text-[11.5px] text-[#8e8e8e] dark:text-[#737373] leading-relaxed line-clamp-2">
                {description}
              </div>

              {/* Arrow on hover */}
              <ArrowRight
                className="w-3.5 h-3.5 text-[#10a37f] mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
