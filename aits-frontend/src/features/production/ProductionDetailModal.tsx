'use client';

import React from 'react';
import {
  X,
  Milk,
  Calendar,
  Building,
  PawPrint,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  FileText,
  ShieldAlert,
  Ban,
} from 'lucide-react';
import { ProductionRecord } from '@/types/production';

interface ProductionDetailModalProps {
  isOpen: boolean;
  record: ProductionRecord | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeletePermanently?: () => void;
  canManage?: boolean;
  canDeletePermanently?: boolean;
}

export const ProductionDetailModal: React.FC<ProductionDetailModalProps> = ({
  isOpen,
  record,
  onClose,
  onEdit,
  onDelete,
  onDeletePermanently,
  canManage,
  canDeletePermanently,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] w-full max-w-lg rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl overflow-hidden flex flex-col transition-colors duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between bg-[#f8faf8] dark:bg-[#212121]">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              record.isVoided
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-[#166534]/10 dark:bg-[#22C55E]/15 text-[#166534] dark:text-[#22C55E]'
            }`}>
              {record.isVoided ? <Ban className="w-4.5 h-4.5" /> : <Milk className="w-4.5 h-4.5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white">Milking Record Details</h2>
                {record.isVoided && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    VOIDED
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-[#166534] dark:text-[#22C55E] font-semibold">{record.animalTag}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Voided Audit Banner */}
          {record.isVoided && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                VOIDED AUDIT RECORD
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#737373] dark:text-[#a3a3a3]">
                <strong className="text-[#0d0d0d] dark:text-white">Void Reason:</strong>{' '}
                {record.voidReason || 'Record was voided via management action.'}
              </p>
              {(record.voidedBy || record.voidedAt) && (
                <div className="text-[10.5px] pt-1 border-t border-rose-500/20 flex items-center justify-between text-[#737373] dark:text-[#a3a3a3]">
                  <span>Voided by: <strong className="text-[#0d0d0d] dark:text-white">{record.voidedBy || 'Authorized Staff'}</strong></span>
                  {record.voidedAt && <span>{new Date(record.voidedAt).toLocaleString()}</span>}
                </div>
              )}
            </div>
          )}

          {/* Key Metric Card */}
          <div className="p-4 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div>
              <span className="text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] uppercase tracking-wider">
                Logged Volume
              </span>
              <div className={`text-2xl font-extrabold mt-0.5 ${record.isVoided ? 'line-through text-[#737373]' : 'text-[#0d0d0d] dark:text-white'}`}>
                {record.quantityLiters} <span className="text-xs font-semibold text-[#737373]">Liters</span>
              </div>
            </div>
            <div>
              {record.isVoided ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  <Ban className="w-3.5 h-3.5" /> Voided Record
                </span>
              ) : (
                <>
                  {record.qualityStatus === 'ACCEPTED' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                    </span>
                  )}
                  {record.qualityStatus === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" /> Pending Test
                    </span>
                  )}
                  {record.qualityStatus === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <div className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1.5 mb-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#10a37f]" /> Date
              </div>
              <p className="font-bold text-[#0d0d0d] dark:text-white">{record.date}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <div className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1.5 mb-1 font-semibold">
                {record.session === 'MORNING' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                ) : record.session === 'AFTERNOON' ? (
                  <Sun className="w-3.5 h-3.5 text-orange-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-sky-500" />
                )}
                Session
              </div>
              <p className="font-bold text-[#0d0d0d] dark:text-white">{record.session} Session</p>
            </div>

            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <div className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1.5 mb-1 font-semibold">
                <PawPrint className="w-3.5 h-3.5 text-[#10a37f]" /> Animal Name
              </div>
              <p className="font-bold text-[#0d0d0d] dark:text-white">{record.animalName}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <div className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1.5 mb-1 font-semibold">
                <Building className="w-3.5 h-3.5 text-[#10a37f]" /> Farm Facility
              </div>
              <p className="font-bold text-[#0d0d0d] dark:text-white truncate">{record.farmName}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
            <div className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1.5 mb-1 font-semibold">
              <User className="w-3.5 h-3.5 text-[#10a37f]" /> Recorded By Staff
            </div>
            <p className="font-bold text-[#0d0d0d] dark:text-white">{record.recordedBy}</p>
          </div>

          {record.notes && (
            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <div className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1.5 mb-1 font-semibold">
                <FileText className="w-3.5 h-3.5 text-[#10a37f]" /> Notes & Observations
              </div>
              <p className="text-[#0d0d0d] dark:text-white leading-relaxed">{record.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between bg-[#f8faf8] dark:bg-[#212121]">
          <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">ID: {record.id}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 font-semibold text-xs rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition-colors cursor-pointer"
            >
              Close
            </button>
            {canManage && !record.isVoided && (
              <>
                {onDelete && (
                  <button
                    onClick={() => {
                      onClose();
                      onDelete();
                    }}
                    className="px-4 py-2 font-semibold text-xs rounded-xl border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                  >
                    Void Record
                  </button>
                )}
                {canDeletePermanently && onDeletePermanently && (
                  <button
                    onClick={() => {
                      onClose();
                      onDeletePermanently();
                    }}
                    className="px-4 py-2 font-semibold text-xs rounded-xl border border-rose-500/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                  >
                    Delete Permanently
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit();
                    }}
                    className="px-4 py-2 font-semibold text-xs rounded-xl bg-[#166534] text-white hover:bg-[#14532d] transition-colors cursor-pointer"
                  >
                    Edit Record
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
