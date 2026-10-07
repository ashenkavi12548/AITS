'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Stethoscope,
  Activity,
  Pill,
  Clock,
  FlaskConical,
  Syringe,
  ShieldAlert,
  FileCheck2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Flame,
} from 'lucide-react';
import {
  healthService,
  AnimalHealthTimelineResponse,
  TimelineEventItem,
} from '@/services/health.service';

interface AnimalTimelineModalProps {
  animalTag: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<
  TimelineEventItem['category'],
  { icon: typeof Stethoscope; color: string; bg: string; border: string }
> = {
  EXAMINATION: {
    icon: Stethoscope,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  DIAGNOSIS: {
    icon: Activity,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  TREATMENT: {
    icon: Pill,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  WITHDRAWAL: {
    icon: Clock,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  LAB: {
    icon: FlaskConical,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
  },
  VACCINATION: {
    icon: Syringe,
    color: 'text-[#10a37f]',
    bg: 'bg-[#10a37f]/10',
    border: 'border-[#10a37f]/30',
  },
  QUARANTINE: {
    icon: ShieldAlert,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  CLEARANCE: {
    icon: FileCheck2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  FOLLOWUP: {
    icon: Calendar,
    color: 'text-[#10a37f]',
    bg: 'bg-[#10a37f]/10',
    border: 'border-[#10a37f]/30',
  },
};

export default function AnimalTimelineModal({
  animalTag,
  isOpen,
  onClose,
}: AnimalTimelineModalProps) {
  const [data, setData] = useState<AnimalHealthTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !animalTag) {
      return;
    }

    let isMounted = true;
    const fetchTimeline = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await healthService.getAnimalTimeline(animalTag);
        if (isMounted) {
          setData(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load animal timeline', err);
          const axiosErr = err as { response?: { data?: { message?: string } } };
          setError(
            axiosErr.response?.data?.message ||
              'Could not load medical timeline for this animal.',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchTimeline();

    return () => {
      isMounted = false;
    };
  }, [isOpen, animalTag]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-[#202020] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] dark:border-[#383838] bg-[#fcfcfc] dark:bg-[#252525]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-red-600 dark:text-red-400 uppercase">
                  {animalTag}
                </h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#f0f0f0] dark:bg-[#333] text-[#10a37f]">
                  Medical Record & Timeline
                </span>
              </div>
              <p className="text-xs text-[#6e6e6e] dark:text-[#a0a0a0]">
                Authoritative composite health state, food-safety withholdings, and medical history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6e6e6e] hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-[#10a37f] animate-spin" />
              <p className="text-sm font-medium text-[#6e6e6e]">
                Retrieving clinical records, withdrawal logs, and lab results...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Animal Overview Card */}
              <div className="bg-[#f9fafb] dark:bg-[#282828] rounded-xl border border-[#e5e5e5] dark:border-[#383838] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {data.animal.species.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0d0d0d] dark:text-white text-sm">
                        {data.animal.name || data.animal.tag}
                      </span>
                      <span className="text-xs text-[#888]">
                        ({data.animal.breed} · {data.animal.species})
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6e6e] dark:text-[#a0a0a0] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#10a37f]" />
                      <span>{data.animal.farmName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                      (data.compositeState?.primaryHealthState || 'HEALTHY') === 'HEALTHY'
                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                        : data.compositeState?.primaryHealthState === 'UNDER_TREATMENT'
                        ? 'bg-purple-500/15 text-purple-600 border-purple-500/30'
                        : data.compositeState?.primaryHealthState === 'QUARANTINED'
                        ? 'bg-red-500/15 text-red-600 border-red-500/30'
                        : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                    }`}
                  >
                    {(data.compositeState?.primaryHealthState || 'HEALTHY').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Authoritative Food Safety & Movement Eligibility Box */}
              <div className="bg-white dark:bg-[#252525] rounded-xl border border-[#e5e5e5] dark:border-[#383838] p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#6e6e6e] dark:text-[#a0a0a0] uppercase tracking-wider">
                  Authoritative Herd & Food-Safety Eligibility
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div
                    className={`p-2.5 rounded-lg border text-center ${
                      data.compositeState?.eligibility?.canCollectMilk
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase">Milk Collection</p>
                    <p className="text-xs font-bold mt-0.5">
                      {data.compositeState?.eligibility?.canCollectMilk ? 'Allowed' : 'Prohibited'}
                    </p>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border text-center ${
                      data.compositeState?.eligibility?.canSlaughter
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase">Slaughter</p>
                    <p className="text-xs font-bold mt-0.5">
                      {data.compositeState?.eligibility?.canSlaughter ? 'Allowed' : 'Prohibited'}
                    </p>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border text-center ${
                      data.compositeState?.eligibility?.canTransfer
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase">Movement / Sale</p>
                    <p className="text-xs font-bold mt-0.5">
                      {data.compositeState?.eligibility?.canTransfer ? 'Allowed' : 'Restricted'}
                    </p>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border text-center ${
                      data.compositeState?.eligibility?.canIssueClearance
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase">Clearance Permit</p>
                    <p className="text-xs font-bold mt-0.5">
                      {data.compositeState?.eligibility?.canIssueClearance ? 'Eligible' : 'Ineligible'}
                    </p>
                  </div>
                </div>

                {((data.compositeState?.eligibility?.reasons && data.compositeState.eligibility.reasons.length > 0) ||
                  (data.compositeState?.eligibility?.blockingReasons && data.compositeState.eligibility.blockingReasons.length > 0)) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                      Active Restrictions & Contraindications:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {(data.compositeState?.eligibility?.reasons || data.compositeState?.eligibility?.blockingReasons || []).map((r, i) => (
                        <li key={i} className="text-xs text-amber-900 dark:text-amber-200">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Active Withdrawals Countdown */}
              {(data.compositeState?.withdrawals?.milk?.active ||
                data.compositeState?.withdrawals?.meat?.active) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.compositeState?.withdrawals?.milk?.active && (
                    <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-xs">
                        <Flame className="w-4 h-4" />
                        <span>Active Milk Withdrawal</span>
                      </div>
                      <p className="text-lg font-extrabold text-orange-900 dark:text-orange-200 mt-1">
                        {data.compositeState.withdrawals.milk.hoursRemaining} Hours Remaining
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Rx: {data.compositeState.withdrawals.milk.treatmentName || 'Antibiotic therapy'}
                      </p>
                    </div>
                  )}

                  {data.compositeState?.withdrawals?.meat?.active && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs">
                        <Clock className="w-4 h-4" />
                        <span>Active Meat Withdrawal</span>
                      </div>
                      <p className="text-lg font-extrabold text-red-900 dark:text-red-200 mt-1">
                        {data.compositeState.withdrawals.meat.daysRemaining} Days Remaining
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        Rx: {data.compositeState.withdrawals.meat.treatmentName || 'Systemic medication'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Chronological Medical Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#6e6e6e] dark:text-[#a0a0a0] uppercase tracking-wider">
                  Chronological Medical History ({(data.timeline || []).length} Events)
                </h3>

                {(data.timeline || []).length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8e8e8e]">
                    No medical events logged yet for this animal.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e5e5e5] dark:before:bg-[#383838]">
                    {(data.timeline || []).map((event, idx) => {
                      const cfg = categoryIcons[event.category] || categoryIcons.EXAMINATION;
                      const Icon = cfg.icon;

                      return (
                        <div key={idx} className="relative group">
                          {/* Dot / Icon Node */}
                          <div
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full ${cfg.bg} ${cfg.color} border-2 ${cfg.border} flex items-center justify-center`}
                          >
                            <Icon className="w-2.5 h-2.5" />
                          </div>

                          <div className="bg-[#f9fafb] dark:bg-[#282828] rounded-xl border border-[#e5e5e5] dark:border-[#383838] p-3.5 space-y-1 hover:border-[#10a37f]/30 transition-colors">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#0d0d0d] dark:text-white">
                                {event.title}
                              </span>
                              <span className="text-[11px] font-mono text-[#888]">
                                {new Date(event.date).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-[#555] dark:text-[#ccc] leading-relaxed">
                              {event.description}
                            </p>

                            <div className="flex items-center justify-between pt-1 text-[11px] text-[#888]">
                              <span>Logged by: {event.actor}</span>
                              {event.status && (
                                <span className="font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                                  {event.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e5e5e5] dark:border-[#383838] bg-[#fcfcfc] dark:bg-[#252525] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#f0f0f0] dark:bg-[#333] hover:bg-[#e4e4e4] dark:hover:bg-[#444] text-[#333] dark:text-[#eee] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
