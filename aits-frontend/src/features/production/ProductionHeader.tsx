'use client';

import React from 'react';
import { Milk, Plus, Download, RefreshCw } from 'lucide-react';

interface ProductionHeaderProps {
  canManage: boolean;
  onAddClick: () => void;
  onExportClick: () => void;
  onRefreshClick: () => void;
  isRefreshing?: boolean;
}

export const ProductionHeader: React.FC<ProductionHeaderProps> = ({
  canManage,
  onAddClick,
  onExportClick,
  onRefreshClick,
  isRefreshing,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs transition-colors duration-150">
      {/* Title & Description */}
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#10a37f]/10 dark:bg-[#10a37f]/15 text-[#10a37f] dark:text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20 shrink-0 mt-0.5 shadow-2xs">
          <Milk className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#0d0d0d] dark:text-white tracking-tight">
              Production Management
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20 rounded-full uppercase tracking-wider">
              Dairy Telemetry
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#737373] dark:text-[#8e8e8e] mt-1">
            Track daily milk yields, session breakdowns, fat quality status, and herd performance across registered farms.
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
        <button
          type="button"
          onClick={onRefreshClick}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#212121] text-[#0d0d0d] dark:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          title="Refresh production data"
          aria-label="Refresh production data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#10a37f]' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onExportClick}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#212121] text-[#0d0d0d] dark:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#383838] font-semibold text-xs transition-all cursor-pointer shadow-2xs"
        >
          <Download className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
          <span>Export CSV</span>
        </button>

        {canManage && (
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10a37f] hover:bg-[#0d8265] text-white font-semibold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Production Record</span>
          </button>
        )}
      </div>
    </div>
  );
};
