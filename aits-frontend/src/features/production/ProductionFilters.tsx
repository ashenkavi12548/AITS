'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { ProductionQueryParams, MilkingSession, MilkQualityStatus, FarmOption } from '@/types/production';

interface ProductionFiltersProps {
  params: ProductionQueryParams;
  farms: FarmOption[];
  onSearchChange: (search: string) => void;
  onFilterChange: (key: keyof ProductionQueryParams, value: unknown) => void;
  onClearFilters: () => void;
}

export const ProductionFilters: React.FC<ProductionFiltersProps> = ({
  params,
  farms,
  onSearchChange,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters =
    Boolean(params.search) ||
    Boolean(params.farmId) ||
    Boolean(params.startDate) ||
    Boolean(params.endDate) ||
    Boolean(params.session) ||
    Boolean(params.qualityStatus);

  return (
    <div className="bg-white dark:bg-[#2f2f2f] p-4.5 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs space-y-3.5 transition-colors duration-150">
      {/* Top Bar: Search Input & Clear Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
          <input
            type="text"
            value={params.search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by animal ID, tag, name or staff..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
          />
          {params.search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors cursor-pointer shrink-0 border border-rose-200 dark:border-rose-900/40"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Filter Options Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 border-t border-[#e5e5e5] dark:border-[#383838]">
        {/* Farm Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
            Farm Facility
          </label>
          <select
            value={params.farmId || ''}
            onChange={(e) => onFilterChange('farmId', e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
          >
            <option value="">All Farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Milking Session Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
            Milking Session
          </label>
          <select
            value={params.session || ''}
            onChange={(e) => onFilterChange('session', e.target.value as MilkingSession | '')}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
          >
            <option value="">All Sessions</option>
            <option value="MORNING">Morning Session</option>
            <option value="AFTERNOON">Afternoon Session</option>
            <option value="EVENING">Evening Session</option>
          </select>
        </div>

        {/* Quality Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
            Quality Status
          </label>
          <select
            value={params.qualityStatus || ''}
            onChange={(e) => onFilterChange('qualityStatus', e.target.value as MilkQualityStatus | '')}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
          >
            <option value="">All Qualities</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PENDING">Pending Test</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Date Range Start */}
        <div>
          <label className="block text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
            From Date
          </label>
          <input
            type="date"
            value={params.startDate || ''}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
          />
        </div>

        {/* Date Range End */}
        <div>
          <label className="block text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1 uppercase tracking-wider">
            To Date
          </label>
          <input
            type="date"
            value={params.endDate || ''}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
