'use client';

import React, { useEffect, useState } from 'react';
import { X, Printer, Download, FileCheck, Loader2 } from 'lucide-react';
import { ReportDownloadRequest, ReportPreviewData } from '@/types/report.types';
import { reportService } from '@/services/report.service';
import { triggerPrintReport } from '@/utils/report.utils';
import { ReportPrintLayout } from '@/components/reports/ReportPrintLayout';

interface ReportPreviewModalProps {
  isOpen: boolean;
  request: ReportDownloadRequest;
  onClose: () => void;
  onExecuteDownload: (request: ReportDownloadRequest) => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  request,
  onClose,
  onExecuteDownload,
}) => {
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && request) {
      let isMounted = true;
      reportService.generateReportPreview(request).then((res) => {
        if (isMounted) {
          setPreviewData(res);
          setIsLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, request]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white print:static print:block">
      <div className="bg-white dark:bg-[#171717] w-full max-w-4xl rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none print:w-full">
        {/* Modal Toolbar (Hidden during print) */}
        <div className="p-4 border-b border-[#e5e5e5] dark:border-[#303030] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#10a37f]" />
            <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">Report Document Preview</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerPrintReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f9f9f9] dark:bg-[#212121] hover:bg-[#ececec] text-[#0d0d0d] dark:text-white text-xs font-semibold border border-[#e5e5e5] dark:border-[#303030] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#10a37f]" />
              Print Report
            </button>

            <button
              type="button"
              onClick={() => onExecuteDownload(request)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download {request.fileFormat}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#ececec] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 md:p-8 overflow-y-auto print:p-0 print:overflow-visible">
          {isLoading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#10a37f] animate-spin mb-2" />
              <p className="text-xs font-semibold text-[#737373]">Rendering printable report document layout...</p>
            </div>
          ) : (
            previewData && <ReportPrintLayout request={request} previewData={previewData} />
          )}
        </div>
      </div>
    </div>
  );
};
