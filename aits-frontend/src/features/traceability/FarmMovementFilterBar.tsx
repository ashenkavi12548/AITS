'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { FarmMovementFilters, MovementStatus, MovementReason } from '@/types/traceability.types';
import { MOVEMENT_REASON_LABELS } from '@/constants/traceability.constants';

interface FarmMovementFilterBarProps {
  filters: FarmMovementFilters;
  onFilterChange: (newFilters: Partial<FarmMovementFilters>) => void;
  onClearFilters: () => void;
  farms: { id: string; name: string }[];
}

export const FarmMovementFilterBar: React.FC<FarmMovementFilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  farms,
}) => {
  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.status && filters.status !== 'ALL') ||
    (filters.reason && filters.reason !== 'ALL') ||
    (filters.fromFarmId && filters.fromFarmId !== 'ALL') ||
    (filters.toFarmId && filters.toFarmId !== 'ALL');

  return (
    <div className="bg-white dark:bg-[#212121] p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
          <input
            type="text"
            placeholder="Search by animal tag, driver, or vehicle number..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white focus:outline-none focus:border-[#10a37f]"
          />
        </div>

      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#f0f0f0] dark:border-[#2d2d2d]">
        {/* Status */}
        <select
          value={filters.status || 'ALL'}
          onChange={(e) => onFilterChange({ status: e.target.value as MovementStatus | 'ALL', page: 1 })}
          className="px-3 py-1.5 text-xs bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white focus:outline-none focus:border-[#10a37f]"
        >
          <option value="ALL">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="ARRIVED">Arrived</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Reason */}
        <select
          value={filters.reason || 'ALL'}
          onChange={(e) => onFilterChange({ reason: e.target.value as MovementReason | 'ALL', page: 1 })}
          className="px-3 py-1.5 text-xs bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white focus:outline-none focus:border-[#10a37f]"
        >
          <option value="ALL">All Movement Reasons</option>
          {Object.entries(MOVEMENT_REASON_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {/* Origin Farm */}
        <select
          value={filters.fromFarmId || 'ALL'}
          onChange={(e) => onFilterChange({ fromFarmId: e.target.value, page: 1 })}
          className="px-3 py-1.5 text-xs bg-[#f9f9f9] dark:bg-[#2d2d2d] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white focus:outline-none focus:border-[#10a37f]"
        >
          <option value="ALL">All Origin Farms</option>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
