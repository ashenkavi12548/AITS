import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Users,
  KeyRound,
  PawPrint,
  Milk,
  HeartPulse,
  ArrowRight,
} from 'lucide-react';

const farmFeatures = [
  {
    icon: Building2,
    title: 'Farm Facility Profile',
    description: 'Maintain farm name, type, location, registration number, and operational details.',
    color: '#10a37f',
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Add farm employees, assign roles (Manager, Worker, Veterinarian), and manage their operational access.',
    color: '#0ea5e9',
  },
  {
    icon: KeyRound,
    title: 'Granular Permissions',
    description: 'Control what each staff member can do — animal management, milk logging, health records, feeding, and breeding.',
    color: '#f59e0b',
  },
  {
    icon: PawPrint,
    title: 'Animal Inventory',
    description: 'View the complete animal inventory assigned to the farm with status breakdown and filtering.',
    color: '#10a37f',
  },
];

const permissionItems = [
  { icon: PawPrint, label: 'Animal Profiles & Registration', color: '#10a37f' },
  { icon: Milk, label: 'Daily Milk Production Yield', color: '#0ea5e9' },
  { icon: HeartPulse, label: 'Health, Sickness & Treatments', color: '#ef4444' },
];

export default function FarmManagementSection() {
  return (
    <section className="py-20 md:py-28 bg-[#f9f9f9] dark:bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: content */}
          <div>
            <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
              Farm Management
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-5">
              Organize your farm operations digitally
            </h2>
            <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed mb-8">
              AITS provides a structured farm management layer where owners and managers
              can control their facility profile, staff access, and animal inventory
              from a single connected interface.
            </p>

            {/* Feature list */}
            <div className="space-y-4 mb-8">
              {farmFeatures.map(({ icon: Icon, title, description, color }) => (
                <div key={title} className="flex items-start gap-3.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${color}15`,
                      border: `1px solid ${color}25`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
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
              href="/staff"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-colors shadow-sm"
            >
              Staff Management
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right: farm image + permission card */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#e5e5e5] dark:border-[#303030] shadow-2xl shadow-black/10">
              <Image
                src="/images/farm-digital-management.jpg"
                alt="Farm manager using a digital tablet for livestock management in a modern barn"
                width={600}
                height={450}
                className="object-cover w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Floating permissions card */}
            <div className="absolute -bottom-6 -left-4 md:-left-8 bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] p-4 shadow-xl w-64">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#10a37f]/12 border border-[#10a37f]/25 flex items-center justify-center">
                  <KeyRound className="w-3.5 h-3.5 text-[#10a37f]" />
                </div>
                <div className="text-[12.5px] font-semibold text-[#0d0d0d] dark:text-white">
                  Staff Permissions
                </div>
              </div>
              <div className="space-y-2">
                {permissionItems.map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="w-3 h-3" style={{ color }} />
                    </div>
                    <span className="text-[11.5px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-tight">{label}</span>
                    <div className="ml-auto w-3.5 h-3.5 rounded-full bg-[#10a37f]/20 border border-[#10a37f]/40 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10a37f]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#f59e0b]/8 blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
