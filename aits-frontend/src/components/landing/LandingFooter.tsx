import React from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

const productLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Animals', href: '/animals' },
  { label: 'Register Animal', href: '/animals/register' },
  { label: 'QR Management', href: '/animals/qr' },
  { label: 'Staff Management', href: '/staff' },
];

const moduleLinks = [
  { label: 'Health', href: '/health' },
  { label: 'Production', href: '/production' },
  { label: 'Breeding', href: '/breeding' },
  { label: 'Movement', href: '/movement' },
  { label: 'Dashboard', href: '/dashboard' },
];

const accountLinks = [
  { label: 'Sign In', href: '/login' },
  { label: 'Create Account', href: '/register' },
  { label: 'Settings', href: '/settings' },
  { label: 'Notifications', href: '/notifications' },
];

export default function LandingFooter() {
  return (
    <footer className="bg-[#0d0d0d] border-t border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#10a37f] flex items-center justify-center shadow-md shadow-[#10a37f]/25">
                <Radio className="w-4.5 h-4.5 text-white stroke-[2.3]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-none">AITS</div>
                <div className="text-[10.5px] text-[#737373] mt-0.5">Traceability Platform</div>
              </div>
            </div>

            <p className="text-[13.5px] text-[#737373] leading-relaxed mb-5 max-w-xs">
              Animal Identification &amp; Traceability System by Ceylon Nest.
              A digital platform for livestock identity, farm management, and
              traceability records.
            </p>

            {/* Company */}
            <div className="text-[12.5px] text-[#5d5d5d]">
              <span className="font-semibold text-[#8e8e8e]">Ceylon Nest</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#5d5d5d] mb-4">
              Platform
            </div>
            <ul className="space-y-2.5">
              {productLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13.5px] text-[#737373] hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Module links */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#5d5d5d] mb-4">
              Modules
            </div>
            <ul className="space-y-2.5">
              {moduleLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13.5px] text-[#737373] hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#5d5d5d] mb-4">
              Account
            </div>
            <ul className="space-y-2.5">
              {accountLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13.5px] text-[#737373] hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#5d5d5d] text-center sm:text-left">
            © {new Date().getFullYear()} Ceylon Nest. AITS — Animal Identification &amp; Traceability System.
          </p>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-[12px] text-[#5d5d5d]">v2.0</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10a37f] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10a37f]" />
              </span>
              <span className="text-[11.5px] text-[#10a37f] font-medium">System Active</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
