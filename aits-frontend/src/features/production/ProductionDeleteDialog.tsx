'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Loader2,
  Calendar,
  Building,
  Milk,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';
import { ProductionRecord, MilkQualityStatus, MilkingSession } from '@/types/production';

interface ProductionDeleteDialogProps {
  isOpen: boolean;
  record: ProductionRecord | null;
  isDeleting: boolean;
  isPermanentDelete?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Duplicate entry logged by mistake',
  'Data entry error (incorrect quantity/session)',
  'Contaminated milk batch / discarded yield',
  'Milking parlor sensor calibration defect',
  'Recorded under incorrect animal ear tag',
];

export const ProductionDeleteDialog: React.FC<ProductionDeleteDialogProps> = ({
  isOpen,
  record,
  isDeleting,
  isPermanentDelete = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [prevRecordId, setPrevRecordId] = useState<string | null>(null);

  if (record && record.id !== prevRecordId) {
    setPrevRecordId(record.id);
    setReason('');
    setError('');
  }

  if (!isOpen || !record) return null;

  const handlePresetSelect = (preset: string) => {
    setReason(preset);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!isPermanentDelete && trimmed.length < 5) {
      setError('A descriptive reason of at least 5 characters is required for regulatory audit trail compliance.');
      return;
    }
    setError('');
    await onConfirm(trimmed);
  };

  const renderQualityBadge = (status: MilkQualityStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending Test
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const renderSessionIcon = (session: MilkingSession) => {
    switch (session) {
      case 'MORNING':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'AFTERNOON':
        return <Sun className="w-3.5 h-3.5 text-orange-500" />;
      case 'EVENING':
        return <Moon className="w-3.5 h-3.5 text-sky-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] w-full max-w-lg rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xl overflow-hidden flex flex-col transition-colors duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center gap-3 bg-rose-500/5 dark:bg-rose-950/20">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Void Milk Production Record
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              AITS Auditable Traceability & Deletion Confirmation
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Regulatory Warning Callout */}
          {isPermanentDelete ? (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                Permanent Deletion Warning
              </div>
              <p className="text-[11.5px] text-[#737373] dark:text-[#a3a3a3]">
                This action will <strong className="text-rose-600 dark:text-rose-400">PERMANENTLY DESTROY</strong> this record from the database. It cannot be undone. All associated historical data for this specific entry will be erased.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                Traceability & Historical Data Protection
              </div>
              <p className="text-[11.5px] text-[#737373] dark:text-[#a3a3a3]">
                Under livestock traceability standards, production records represent auditable legal history. This record will <strong className="text-[#0d0d0d] dark:text-white">NOT</strong> be destroyed; it will be marked as <strong className="text-rose-600 dark:text-rose-400">VOIDED</strong>, an immutable audit log entry will be created, and its volume will be excluded from production KPIs.
              </p>
            </div>
          )}

          {/* Record Details Card */}
          <div className="p-3.5 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#e5e5e5]/60 dark:border-[#383838]/60 pb-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
                Record Summary
              </span>
              <span className="font-mono text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                ID: {record.id.slice(0, 8)}...
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] block">Animal / Ear Tag</span>
                <span className="font-mono font-bold text-[#166534] dark:text-[#22C55E]">
                  {record.animalTag}
                </span>
                <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] ml-1">
                  ({record.animalName})
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] block">Farm Facility</span>
                <span className="font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-1">
                  <Building className="w-3 h-3 text-[#10a37f]" />
                  {record.farmName}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] block">Date & Session</span>
                <span className="font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#10a37f]" />
                  {record.date} • {renderSessionIcon(record.session)} {record.session}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] block">Quantity & Quality</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-extrabold text-[#0d0d0d] dark:text-white flex items-center gap-1">
                    <Milk className="w-3.5 h-3.5 text-[#166534] dark:text-[#22C55E]" />
                    {record.quantityLiters} Liters
                  </span>
                  {renderQualityBadge(record.qualityStatus)}
                </div>
              </div>
            </div>
          </div>

          {/* Void Reason Input */}
          {!isPermanentDelete && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="void-reason" className="text-xs font-bold text-[#0d0d0d] dark:text-white">
                  Reason for Voiding / Cancellation <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10.5px] text-[#737373] dark:text-[#8e8e8e]">
                  Required for Audit Log
                </span>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {PRESET_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="px-2 py-1 text-[10.5px] rounded-lg bg-[#f0f0f0] dark:bg-[#383838] text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#10a37f]/15 hover:text-[#10a37f] border border-transparent hover:border-[#10a37f]/30 transition-all cursor-pointer text-left"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <textarea
                id="void-reason"
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Provide a detailed explanation justifying this record void/cancellation..."
                disabled={isDeleting}
                className="w-full text-xs p-3 rounded-xl border border-[#e5e5e5] dark:border-[#383838] bg-[#f8faf8] dark:bg-[#212121] text-[#0d0d0d] dark:text-white focus:outline-hidden focus:border-rose-500 dark:focus:border-rose-500 transition-colors"
              />
              {error && <p className="text-[11px] font-semibold text-rose-500">{error}</p>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#383838] transition-colors cursor-pointer"
            >
              Keep Record
            </button>
            <button
              type="submit"
              disabled={isDeleting || (!isPermanentDelete && reason.trim().length < 5)}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isPermanentDelete ? 'Deleting...' : 'Voiding Record...'}</span>
                </>
              ) : (
                <>
                  {isPermanentDelete ? <ShieldAlert className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                  <span>{isPermanentDelete ? 'Delete Permanently' : 'Confirm Void Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
