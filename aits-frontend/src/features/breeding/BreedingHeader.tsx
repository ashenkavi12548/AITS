'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dna, Plus, Download, RefreshCw, Activity, CalendarCheck, Baby } from 'lucide-react';

interface BreedingHeaderProps {
  canManage: boolean;
  onAddClick: () => void;
  onExportClick?: () => void;
  onRefreshClick: () => void;
  isRefreshing?: boolean;
}

export const BreedingHeader: React.FC<BreedingHeaderProps> = ({
  canManage,
  onAddClick,
  onExportClick,
  onRefreshClick,
  isRefreshing,
}) => {
  const pathname = usePathname();

  const subNavs = [
    { label: 'Overview', href: '/breeding', icon: Dna },
    { label: 'Breeding Services', href: '/breeding/services', icon: Activity },
    { label: 'Pregnancy Tracking', href: '/breeding/pregnancies', icon: CalendarCheck },
    { label: 'Calving Management', href: '/breeding/calving', icon: Baby },
  ];

  return (
    <div className="bg-white dark:bg-[#2f2f2f] p-4 md:p-5 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs space-y-3.5 transition-colors duration-150">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20 shrink-0 shadow-2xs">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-[#0d0d0d] dark:text-white tracking-tight">
                Breeding Management
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20 rounded-md uppercase tracking-wider">
                Reproductive Genetics
              </span>
            </div>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-0.5">
              Manage artificial inseminations, natural paddock breeding, gestation timelines, pregnancy checks, and calving records.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onRefreshClick}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#212121] text-[#0d0d0d] dark:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Refresh breeding data"
            aria-label="Refresh breeding data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#10a37f]' : ''}`} />
          </button>

          {onExportClick && (
            <button
              type="button"
              onClick={onExportClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#212121] text-[#0d0d0d] dark:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#383838] font-semibold text-xs transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#737373] dark:text-[#8e8e8e]" />
              <span>Export CSV</span>
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={onAddClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0d8265] text-white font-semibold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Breeding Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#383838] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {subNavs.map((nav) => {
          const isActive = pathname === nav.href;
          const Icon = nav.icon;
          return (
            <Link
              key={nav.href}
              href={nav.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#10a37f] text-white shadow-xs'
                  : 'text-[#737373] dark:text-[#8e8e8e] hover:bg-[#f4f4f4] dark:hover:bg-[#212121] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{nav.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
