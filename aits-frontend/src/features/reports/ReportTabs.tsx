'use client';

import React from 'react';
import { ReportTab, ReportType } from '@/types/report.types';
import { REPORT_TABS } from '@/constants/report.constants';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  LayoutDashboard,
  Milk,
  HeartPulse,
  Utensils,
  Dna,
  Route,
  Lock,
  Download,
  FileText,
  FileSpreadsheet,
  Eye,
  Loader2,
} from 'lucide-react';

interface ReportTabsProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  onQuickExport: (tab: ReportTab, format: 'PDF' | 'CSV') => void;
  onQuickPreview: (tab: ReportTab) => void;
  onOpenDownloadModal: (type?: ReportType) => void;
  isExporting?: boolean;
}

const TAB_ICONS: Record<ReportTab, React.ElementType> = {
  overview: LayoutDashboard,
  production: Milk,
  health: HeartPulse,
  feeding: Utensils,
  breeding: Dna,
  traceability: Route,
};

export const ReportTabs: React.FC<ReportTabsProps> = ({
  activeTab,
  onTabChange,
  onQuickExport,
  onQuickPreview,
  onOpenDownloadModal,
  isExporting = false,
}) => {
  const { user } = useAuthStore();
  const role = (user?.role || '').toUpperCase();

  // Role checks for tab visibility
  const isTabPermitted = (tab: ReportTab): boolean => {
    if (!role || role === 'AUDITOR') {
      return true;
    }

    if (role === 'VETERINARIAN') {
      return tab === 'overview' || tab === 'health' || tab === 'traceability';
    }

    if (role === 'AI_TECHNICIAN') {
      return tab === 'overview' || tab === 'breeding' || tab === 'traceability';
    }

    if (role === 'WORKER') {
      return tab === 'overview' || tab === 'production' || tab === 'feeding' || tab === 'traceability';
    }

    return true;
  };

  const activeTabLabel = REPORT_TABS.find((t) => t.id === activeTab)?.label || 'Overview';

  return (
    <div className="w-full border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#2f2f2f] rounded-2xl p-1.5 shadow-xs flex flex-wrap md:flex-nowrap items-center justify-between gap-2 transition-colors">
      {/* Left: Module Navigation Tabs */}
      <nav className="flex items-center gap-1 flex-wrap sm:flex-nowrap shrink-0" aria-label="Reports Tabs">
        {REPORT_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;
          const allowed = isTabPermitted(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => allowed && onTabChange(tab.id)}
              disabled={!allowed}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                isActive
                  ? 'bg-[#10a37f] text-white shadow-xs'
                  : allowed
                  ? 'text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f9f9f9] dark:hover:bg-[#212121] hover:text-[#0d0d0d] dark:hover:text-white'
                  : 'text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#737373] dark:text-[#8e8e8e]'}`} />
              <span>{tab.label}</span>
              {!allowed && <Lock className="w-3 h-3 ml-0.5 text-amber-500" />}
            </button>
          );
        })}
      </nav>

      {/* Right: Quick Actions (Preview, PDF, CSV, All Reports Modal Button) */}
      <div className="flex items-center gap-1.5 shrink-0 flex-nowrap pr-0.5">
        {/* Preview Button: inspect layout before downloading */}
        <button
          type="button"
          onClick={() => onQuickPreview(activeTab)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-semibold border border-sky-200 dark:border-sky-900/50 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
          title={`Preview ${activeTabLabel} document before downloading`}
        >
          <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Preview</span>
        </button>

        {/* Quick PDF Download for Active Tab */}
        <button
          type="button"
          onClick={() => onQuickExport(activeTab, 'PDF')}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer disabled:opacity-50 shadow-2xs shrink-0 whitespace-nowrap"
          title={`Download ${activeTabLabel} as PDF`}
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          )}
          <span>PDF</span>
        </button>

        {/* Quick CSV Download for Active Tab */}
        <button
          type="button"
          onClick={() => onQuickExport(activeTab, 'CSV')}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50 transition-all cursor-pointer disabled:opacity-50 shadow-2xs shrink-0 whitespace-nowrap"
          title={`Download ${activeTabLabel} as CSV`}
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>CSV</span>
        </button>

        {/* All Reports Modal Trigger Button */}
        <button
          type="button"
          onClick={() => onOpenDownloadModal(activeTab.toUpperCase() as ReportType)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
          title="Open All Reports Download & Preview Modal"
        >
          <Download className="w-3.5 h-3.5" />
          <span>All Reports</span>
        </button>
      </div>
    </div>
  );
};
