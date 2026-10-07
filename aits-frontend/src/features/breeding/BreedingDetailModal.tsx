'use client';

import React from 'react';
import {
  X,
  Dna,
  Calendar,
  Building,
  User,
  CheckCircle2,
  FileText,
  CalendarCheck,
  Baby,
  Activity,
} from 'lucide-react';
import { BreedingRecord } from '@/types/breeding';

interface BreedingDetailModalProps {
  isOpen: boolean;
  record: BreedingRecord | null;
  onClose: () => void;
  onEdit?: () => void;
  onRecordPD?: () => void;
  canManage?: boolean;
}

export const BreedingDetailModal: React.FC<BreedingDetailModalProps> = ({
  isOpen,
  record,
  onClose,
  onEdit,
  onRecordPD,
  canManage,
}) => {
  if (!isOpen || !record) return null;

  const timelineSteps = [
    {
      title: 'Breeding Service Recorded',
      date: record.serviceDate,
      desc: `${record.serviceMethod === 'ARTIFICIAL_INSEMINATION' ? 'AI Insemination' : 'Natural Mating'} (Attempt #${record.attemptNumber}) by ${record.technician}`,
      completed: true,
      icon: Dna,
    },
    {
      title: '60-Day Pregnancy Check Scheduled',
      date: record.firstPregnancyCheckDate,
      desc: 'Transrectal ultrasound / palpation diagnosis',
      completed: record.status === 'SUCCESSFUL' || record.status === 'UNSUCCESSFUL',
      active: record.status === 'PREGNANCY_CHECK_PENDING',
      icon: CalendarCheck,
    },
    {
      title: 'Pregnancy Result Confirmation',
      date: record.secondPregnancyCheckDate,
      desc: record.status === 'SUCCESSFUL' ? 'Confirmed Pregnant (Gestation active)' : 'Pending laboratory confirmation',
      completed: record.status === 'SUCCESSFUL',
      icon: CheckCircle2,
    },
    {
      title: 'Expected Bovine Birth (Calving)',
      date: record.estimatedCalvingDate,
      desc: 'Calculated 283-day gestation cycle',
      completed: false,
      icon: Baby,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] w-full max-w-xl rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between bg-[#f8faf8] dark:bg-[#212121]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center">
              <Dna className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white">Breeding Log Details</h2>
              <p className="text-xs font-mono font-semibold text-[#166534] dark:text-[#22C55E]">{record.femaleAnimalTag} ({record.femaleAnimalName})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#737373] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#383838] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Key Info Banner */}
          <div className="p-4 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-between">
            <div>
              <span className="text-[10.5px] font-bold text-[#737373] dark:text-[#8e8e8e] uppercase tracking-wider">
                Sire / Straw Lineage
              </span>
              <p className="text-sm font-extrabold text-[#0d0d0d] dark:text-white mt-0.5">
                {record.bullName || record.semenStrawId || 'Natural Bull Mating'}
              </p>
            </div>
            <div>
              {record.status === 'SUCCESSFUL' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Confirmed Pregnant
                </span>
              )}
              {record.status === 'PREGNANCY_CHECK_PENDING' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  PD Pending
                </span>
              )}
              {record.status === 'COMPLETED' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#10a37f]/10 text-[#0e8c6d] dark:text-[#12b88f] border border-[#10a37f]/20">
                  Inseminated
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1 mb-0.5 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#10a37f]" /> Service Date
              </span>
              <p className="font-bold text-[#0d0d0d] dark:text-white">{record.serviceDate}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1 mb-0.5 font-semibold">
                <Activity className="w-3.5 h-3.5 text-[#10a37f]" /> Method & Attempt
              </span>
              <p className="font-bold text-[#0d0d0d] dark:text-white">
                {record.serviceMethod === 'ARTIFICIAL_INSEMINATION' ? 'AI Service' : 'Natural Breeding'} (Attempt #{record.attemptNumber})
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1 mb-0.5 font-semibold">
                <Building className="w-3.5 h-3.5 text-[#10a37f]" /> Farm Facility
              </span>
              <p className="font-bold text-[#0d0d0d] dark:text-white truncate">{record.farmName}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1 mb-0.5 font-semibold">
                <User className="w-3.5 h-3.5 text-[#10a37f]" /> Technician
              </span>
              <p className="font-bold text-[#0d0d0d] dark:text-white truncate">{record.technician}</p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="p-4 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] space-y-3">
            <div className="text-xs font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider">
              Gestation & Activity Timeline
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e5e5e5] dark:before:bg-[#383838]">
              {timelineSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex items-start justify-between gap-2">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                        step.completed
                          ? 'bg-[#10a37f] text-white border-[#10a37f]'
                          : step.active
                          ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
                          : 'bg-white dark:bg-[#2f2f2f] text-[#737373] border-[#e5e5e5] dark:border-[#383838]'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0d0d0d] dark:text-white text-xs">{step.title}</h4>
                      <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">{step.desc}</p>
                    </div>
                    <span className="font-semibold text-[11px] text-[#737373] dark:text-[#8e8e8e] whitespace-nowrap">
                      {step.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {record.notes && (
            <div className="p-3 rounded-xl bg-[#f8faf8] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] flex items-center gap-1 mb-1 font-semibold">
                <FileText className="w-3.5 h-3.5 text-[#10a37f]" /> Notes & Observations
              </span>
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
            {canManage && onRecordPD && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPD();
                }}
                className="px-3.5 py-2 font-semibold text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
              >
                Record PD Check
              </button>
            )}
            {canManage && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-3.5 py-2 font-semibold text-xs rounded-xl bg-[#166534] text-white hover:bg-[#14532d] transition-colors cursor-pointer"
              >
                Edit Record
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
