'use client';

import React, { useState } from 'react';
import {
  X,
  CalendarDays,
  Syringe,
  Pill,
  HeartPulse,
  Stethoscope,
  Loader2,
  Mail,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import { CreateScheduleEventInput } from '@/types/dashboard';
import toast from 'react-hot-toast';
import { AnimalTagAutocomplete } from '@/components/common/AnimalTagAutocomplete';

interface ScheduleEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string | null;
  defaultAnimalTag?: string;
  userEmail?: string;
}

type EventType = 'VACCINATION' | 'TREATMENT' | 'CALVING' | 'VET_VISIT';

const EVENT_PRESETS: Record<EventType, { title: string; placeholder: string; dose?: string }[]> = {
  VACCINATION: [
    { title: 'Foot & Mouth Disease (FMD) Booster', placeholder: 'FMD Bivalent Oil Adjuvant Vaccine', dose: '2 mL Subcutaneous' },
    { title: 'Anthrax Annual Spore Vaccine', placeholder: 'Anthrax Spore Vaccine', dose: '1 mL Subcutaneous' },
    { title: 'Blackleg (Clostridium chauvoei) Vaccine', placeholder: 'Blackleg 7-way Vaccine', dose: '2 mL IM' },
    { title: 'Haemorrhagic Septicaemia (HS) Vaccination', placeholder: 'HS Alum Precipitated Vaccine', dose: '3 mL Subcutaneous' },
  ],
  TREATMENT: [
    { title: 'Mastitis Antibiotic & Anti-inflammatory Course', placeholder: 'Oxytetracycline 20% LA + Flunixin', dose: '20 mL IM once daily for 3 days' },
    { title: 'Routine Herd Deworming Protocol', placeholder: 'Albendazole 10% Oral Drench', dose: '15 mL per 100 kg bodyweight' },
    { title: 'Post-Calving Uterine Therapy', placeholder: 'Intrauterine Pessaries / Oxytetracycline', dose: 'Standard uterine bolus' },
    { title: 'Foot Rot / Lameness Antimicrobial Treatment', placeholder: 'Procaine Penicillin + Streptomycin', dose: '15 mL IM once daily for 5 days' },
  ],
  CALVING: [
    { title: 'Expected Full-Term Calving', placeholder: 'Confirmed Pregnancy Calving Date' },
    { title: 'Pre-Calving Transition Monitoring & Buffer Pen Prep', placeholder: 'Transition Diet Protocol' },
  ],
  VET_VISIT: [
    { title: 'Routine Herd Health Examination', placeholder: 'General Clinical & Body Condition Check' },
    { title: 'Post-Partum Reproductive Exam & Ultrasound', placeholder: 'Post-Calving Uterine Involution Check' },
    { title: 'Subclinical Mastitis California Mastitis Test (CMT)', placeholder: 'Quarter Milk Screening' },
    { title: 'Breeding Soundness Evaluation', placeholder: 'Reproductive Tract Scoring' },
  ],
};

export default function ScheduleEventModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  defaultAnimalTag = '',
  userEmail,
}: ScheduleEventModalProps) {
  const getDefaultDateTime = () => {
    if (initialDate) {
      return `${initialDate}T09:00`;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const [eventType, setEventType] = useState<EventType>('VACCINATION');
  const [animalTag, setAnimalTag] = useState(defaultAnimalTag);
  const [title, setTitle] = useState(EVENT_PRESETS.VACCINATION[0].title);
  const [scheduledDate, setScheduledDate] = useState(getDefaultDateTime());
  const [dose, setDose] = useState(EVENT_PRESETS.VACCINATION[0].dose || '');
  const [medicationOrVaccine, setMedicationOrVaccine] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [createNotification, setCreateNotification] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleEventTypeChange = (type: EventType) => {
    setEventType(type);
    const presets = EVENT_PRESETS[type];
    if (presets && presets.length > 0) {
      setTitle(presets[0].title);
      setDose(presets[0].dose || '');
    } else {
      setTitle('');
      setDose('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = animalTag.trim();
    if (!cleanTag) {
      toast.error('Please specify an animal ear tag number.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please specify a title or purpose for this schedule item.');
      return;
    }
    if (!scheduledDate) {
      toast.error('Please select a scheduled date and time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateScheduleEventInput = {
        animalTag: cleanTag,
        eventType,
        title: title.trim(),
        scheduledDate: new Date(scheduledDate).toISOString(),
        dose: dose.trim() || undefined,
        notes: notes.trim() || undefined,
        vaccineName: eventType === 'VACCINATION' ? (medicationOrVaccine.trim() || title.trim()) : undefined,
        medication: eventType === 'TREATMENT' ? (medicationOrVaccine.trim() || title.trim()) : undefined,
        sendEmail,
        createNotification,
      };

      await dashboardService.createScheduleEvent(payload);

      toast.success(
        `Scheduled ${eventType.replace(/_/g, ' ').toLowerCase()} for #${cleanTag}! Inside notification & email sent.`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule veterinary event';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#202020] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0d0d0d] dark:text-white leading-tight">
                Schedule Veterinary Activity
              </h3>
              <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e]">
                Vaccinations, treatments, calving & follow-ups
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#737373] dark:text-[#8e8e8e] hover:bg-gray-100 dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Category Selector */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Activity Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-gray-100 dark:bg-[#161616] rounded-xl">
              <button
                type="button"
                onClick={() => handleEventTypeChange('VACCINATION')}
                className={`py-2 px-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  eventType === 'VACCINATION'
                    ? 'bg-white dark:bg-[#2b2b2b] text-[#0ea5e9] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                <span className="text-[10px]">Vaccination</span>
              </button>

              <button
                type="button"
                onClick={() => handleEventTypeChange('TREATMENT')}
                className={`py-2 px-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  eventType === 'TREATMENT'
                    ? 'bg-white dark:bg-[#2b2b2b] text-[#10a37f] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span className="text-[10px]">Treatment</span>
              </button>

              <button
                type="button"
                onClick={() => handleEventTypeChange('CALVING')}
                className={`py-2 px-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  eventType === 'CALVING'
                    ? 'bg-white dark:bg-[#2b2b2b] text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span className="text-[10px]">Calving Date</span>
              </button>

              <button
                type="button"
                onClick={() => handleEventTypeChange('VET_VISIT')}
                className={`py-2 px-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  eventType === 'VET_VISIT'
                    ? 'bg-white dark:bg-[#2b2b2b] text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span className="text-[10px]">Vet Visit</span>
              </button>
            </div>
          </div>

          {/* 2. Animal Ear Tag */}
          <div>
            <AnimalTagAutocomplete
              value={animalTag}
              onSelect={(tag) => setAnimalTag(tag)}
              label="Animal Ear Tag Number"
              required
            />
          </div>

          {/* 3. Event Title / Preset Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                Title / Protocol <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10.5px] text-gray-400">Select preset or edit</span>
            </div>
            <div className="space-y-2">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  setTitle(val);
                  const found = EVENT_PRESETS[eventType].find((p) => p.title === val);
                  if (found?.dose) setDose(found.dose);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#10a37f]"
              >
                {EVENT_PRESETS[eventType].map((preset, idx) => (
                  <option key={idx} value={preset.title}>
                    {preset.title}
                  </option>
                ))}
              </select>

              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Custom title or procedure name"
                className="w-full px-3.5 py-2 bg-white dark:bg-[#242424] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
              />
            </div>
          </div>

          {/* 4. Date & Dose Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                Scheduled Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                Dosage / Frequency
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 2 mL Subcutaneous"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
              />
            </div>
          </div>

          {/* 5. Product / Vaccine Name */}
          {(eventType === 'VACCINATION' || eventType === 'TREATMENT') && (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                {eventType === 'VACCINATION' ? 'Vaccine Commercial Name' : 'Medication / Drug Name'}
              </label>
              <input
                type="text"
                value={medicationOrVaccine}
                onChange={(e) => setMedicationOrVaccine(e.target.value)}
                placeholder={
                  eventType === 'VACCINATION'
                    ? 'e.g. FMD Bivalent Oil Adjuvant Vaccine'
                    : 'e.g. Oxytetracycline 20% LA'
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
              />
            </div>
          )}

          {/* 6. Clinical Instructions / Notes */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
              Instructions & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical directions, injection site, buffer pen assignment, or veterinary follow-up instructions..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f] resize-none"
            />
          </div>

          {/* 7. Notification & Email Checkboxes */}
          <div className="p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-2">
            <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider block">
              Automated Alerts
            </span>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createNotification}
                onChange={(e) => setCreateNotification(e.target.checked)}
                className="w-4 h-4 rounded text-[#10a37f] focus:ring-[#10a37f] cursor-pointer"
              />
              <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <Bell className="w-3.5 h-3.5 text-[#10a37f]" />
                <span>Show inside system notification in top bell</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded text-[#10a37f] focus:ring-[#10a37f] cursor-pointer"
              />
              <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  Send email alert to user{' '}
                  {userEmail ? <span className="font-semibold text-gray-900 dark:text-white">({userEmail})</span> : ''}
                </span>
              </div>
            </label>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#e5e5e5] dark:border-[#383838]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b2b2b] rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs shadow-[#10a37f]/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
