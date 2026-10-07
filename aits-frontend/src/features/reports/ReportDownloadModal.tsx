"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Download,
  Eye,
  FileText,
  Calendar,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  ReportType,
  ReportFileFormat,
  ReportDownloadRequest,
} from "@/types/report.types";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";
import { validateDateRange } from "@/utils/report.utils";
import { AnimalTagAutocomplete } from '@/components/common/AnimalTagAutocomplete';

interface ReportDownloadModalProps {
  isOpen: boolean;
  initialReportType: ReportType;
  isExporting: boolean;
  onClose: () => void;
  onExecuteDownload: (request: ReportDownloadRequest) => void;
  onOpenPreview: (request: ReportDownloadRequest) => void;
}

export const ReportDownloadModal: React.FC<ReportDownloadModalProps> = ({
  isOpen,
  initialReportType,
  isExporting,
  onClose,
  onExecuteDownload,
  onOpenPreview,
}) => {
  const [reportType, setReportType] = useState<ReportType>(
    initialReportType || "PRODUCTION",
  );
  const [prevInitialReportType, setPrevInitialReportType] =
    useState<ReportType>(initialReportType);
  const [farmId, setFarmId] = useState<string>("ALL");
  const [animalTag, setAnimalTag] = useState<string>("");

  const { data: filtersMeta } = useQuery({
    queryKey: ["reports", "filters-meta"],
    queryFn: () => reportService.getFiltersMeta(),
    staleTime: 5 * 60 * 1000,
  });

  const availableFarms = useMemo<Array<{ id: string; name: string }>>(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string; name: string }> = [
      { id: "ALL", name: "All Assigned Farms" },
    ];
    seen.add("ALL");

    if (filtersMeta?.farms && filtersMeta.farms.length > 0) {
      filtersMeta.farms.forEach((f: { id: string; name: string }) => {
        if (f.id && !seen.has(f.id.toUpperCase())) {
          seen.add(f.id.toUpperCase());
          list.push(f);
        }
      });
    }
    return list;
  }, [filtersMeta]);
  const [startDate, setStartDate] = useState<string>(() =>
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [fileFormat, setFileFormat] = useState<ReportFileFormat>("PDF");
  const [pageOrientation, setPageOrientation] = useState<
    "AUTOMATIC" | "PORTRAIT" | "LANDSCAPE"
  >("AUTOMATIC");
  const [includeSummaryCards, setIncludeSummaryCards] = useState<boolean>(true);
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [includeDetailedTable, setIncludeDetailedTable] =
    useState<boolean>(true);
  const [includeConfidentialLabel, setIncludeConfidentialLabel] =
    useState<boolean>(true);

  if (initialReportType !== prevInitialReportType) {
    setPrevInitialReportType(initialReportType);
    setReportType(initialReportType);
  }

  if (!isOpen) return null;

  const isDateValid = validateDateRange(startDate, endDate);
  const isFormValid =
    reportType && farmId && startDate && endDate && fileFormat && isDateValid;

  const buildRequestObj = (): ReportDownloadRequest => ({
    reportType,
    farmId,
    animalId: animalTag || undefined,
    startDate,
    endDate,
    fileFormat,
    pageOrientation,
    includeSummaryCards,
    includeCharts,
    includeDetailedTable,
    includeConfidentialLabel,
  });

  const handleDownload = () => {
    if (!isFormValid || isExporting) return;
    onExecuteDownload(buildRequestObj());
  };

  const handlePreview = () => {
    if (!isFormValid) return;
    onOpenPreview(buildRequestObj());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#171717] w-full max-w-lg rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#e5e5e5] dark:border-[#303030] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                All Reports Download & Preview
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                Configure export parameters, preview document layout, or
                download.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Report Type */}
          <div>
            <label className="block font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1">
              Report Module *
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full h-9 px-3 text-xs rounded-xl bg-[#f9f9f9] dark:bg-[#212121] text-[#0d0d0d] dark:text-white border border-[#e5e5e5] dark:border-[#303030] focus:outline-none focus:ring-1 focus:ring-[#10a37f]"
            >
              <option value="OVERVIEW">Executive Overview Summary</option>
              <option value="PRODUCTION">
                Milk Production Analytics Report
              </option>
              <option value="HEALTH">Animal Health & Clinical Audit</option>
              <option value="FEEDING">Feed Consumption & Nutrition Log</option>
              <option value="BREEDING">Breeding & Gestation Performance</option>
              <option value="TRACEABILITY">
                Traceability & Movement Audit
              </option>
              <option value="ANIMAL_LIFETIME">
                Individual Animal Lifetime History
              </option>
            </select>
          </div>

          {/* Farm Location */}
          <div>
            <label className="block font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1 items-center gap-1">
              <Building2 className="w-3 h-3 text-[#10a37f]" /> Farm Scope *
            </label>
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl bg-[#f9f9f9] dark:bg-[#212121] text-[#0d0d0d] dark:text-white border border-[#e5e5e5] dark:border-[#303030] focus:outline-none focus:ring-1 focus:ring-[#10a37f]"
            >
              {availableFarms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Animal Tag (if lifetime or individual) */}
          {(reportType === "ANIMAL_LIFETIME" ||
            reportType === "PRODUCTION") && (
            <div>
              <AnimalTagAutocomplete
                value={animalTag}
                onSelect={(tag) => setAnimalTag(tag)}
                label={`Animal Tag ID ${reportType === "ANIMAL_LIFETIME" ? "*" : "(Optional)"}`}
                required={reportType === "ANIMAL_LIFETIME"}
                placeholder="e.g. AITS-LK-9041"
              />
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1 items-center gap-1">
                <Calendar className="w-3 h-3 text-[#10a37f]" /> From Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl bg-[#f9f9f9] dark:bg-[#212121] text-[#0d0d0d] dark:text-white border border-[#e5e5e5] dark:border-[#303030] focus:outline-none focus:ring-1 focus:ring-[#10a37f]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1 items-center gap-1">
                <Calendar className="w-3 h-3 text-[#10a37f]" /> To Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl bg-[#f9f9f9] dark:bg-[#212121] text-[#0d0d0d] dark:text-white border border-[#e5e5e5] dark:border-[#303030] focus:outline-none focus:ring-1 focus:ring-[#10a37f]"
              />
            </div>
          </div>

          {!isDateValid && (
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>From Date cannot be later than To Date.</span>
            </div>
          )}

          {/* Export File Format */}
          <div>
            <label className="block font-semibold text-[#737373] dark:text-[#8e8e8e] mb-2">
              Export File Format *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFileFormat("PDF")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  fileFormat === "PDF"
                    ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]"
                    : "bg-[#f9f9f9] dark:bg-[#212121] text-[#737373] border-[#e5e5e5] dark:border-[#303030]"
                }`}
              >
                PDF Document (.pdf)
              </button>
              <button
                type="button"
                onClick={() => setFileFormat("CSV")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  fileFormat === "CSV"
                    ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]"
                    : "bg-[#f9f9f9] dark:bg-[#212121] text-[#737373] border-[#e5e5e5] dark:border-[#303030]"
                }`}
              >
                CSV Data File (.csv)
              </button>
            </div>
          </div>

          {/* Page Orientation (for PDF) */}
          {fileFormat === "PDF" && (
            <div>
              <label className="block font-semibold text-[#737373] dark:text-[#8e8e8e] mb-1.5">
                Page Orientation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["AUTOMATIC", "PORTRAIT", "LANDSCAPE"] as const).map(
                  (orient) => (
                    <button
                      key={orient}
                      type="button"
                      onClick={() => setPageOrientation(orient)}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer capitalize ${
                        pageOrientation === orient
                          ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]"
                          : "bg-[#f9f9f9] dark:bg-[#212121] text-[#737373] border-[#e5e5e5] dark:border-[#303030]"
                      }`}
                    >
                      {orient.toLowerCase()}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Document Section Checkboxes */}
          <div className="pt-2 border-t border-[#e5e5e5] dark:border-[#303030] space-y-2">
            <span className="block font-semibold text-[#737373] dark:text-[#8e8e8e]">
              Sections to Include:
            </span>
            <label className="flex items-center gap-2 text-xs text-[#0d0d0d] dark:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSummaryCards}
                onChange={(e) => setIncludeSummaryCards(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#10a37f] focus:ring-[#10a37f] accent-[#10a37f]"
              />
              <span>Include Executive Summary Metrics</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#0d0d0d] dark:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#10a37f] focus:ring-[#10a37f] accent-[#10a37f]"
              />
              <span>Include Analytics Chart Visualizations</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#0d0d0d] dark:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDetailedTable}
                onChange={(e) => setIncludeDetailedTable(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#10a37f] focus:ring-[#10a37f] accent-[#10a37f]"
              />
              <span>Include Detailed Audit Data Table</span>
            </label>
            {fileFormat === "PDF" && (
              <label className="flex items-center gap-2 text-xs text-[#0d0d0d] dark:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeConfidentialLabel}
                  onChange={(e) =>
                    setIncludeConfidentialLabel(e.target.checked)
                  }
                  className="w-3.5 h-3.5 rounded text-[#10a37f] focus:ring-[#10a37f] accent-[#10a37f]"
                />
                <span>Include Confidential Mark in Footer</span>
              </label>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e5e5e5] dark:border-[#303030] bg-[#f9f9f9] dark:bg-[#212121] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!isFormValid || isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#171717] hover:bg-[#ececec] text-[#0d0d0d] dark:text-white text-xs font-semibold border border-[#e5e5e5] dark:border-[#303030] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5 text-[#10a37f]" />
            Preview Report
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!isFormValid || isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? "Generating..." : "Download Report"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
