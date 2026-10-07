import React from "react";
import Link from "next/link";
import {
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Loader2,
  Stethoscope,
  Plus,
  Syringe,
  Pill,
  Edit2,
} from "lucide-react";
import { AnimalDetailResponse } from "@/services/animals.service";
import {
  AnimalCompositeHealthState,
  AnimalHealthTimelineResponse,
} from "@/services/health.service";

interface CowHealthTabProps {
  animal: AnimalDetailResponse;
  healthEligibility: AnimalCompositeHealthState | null;
  healthTimeline: AnimalHealthTimelineResponse | null;
  isLoadingHealth: boolean;
  loadHealthData: (animalNumber: string) => Promise<void>;
  setIsHealthModalOpen: (open: boolean) => void;
  healthFilter: "DIAGNOSIS" | "TREATMENT" | "VACCINATION" | "QUARANTINE" | "ALL";
  setHealthFilter: (
    filter: "DIAGNOSIS" | "TREATMENT" | "VACCINATION" | "QUARANTINE" | "ALL",
  ) => void;
  setSelectedVaccinationEvent: (event: {
    id: string;
    vaccineName: string;
    vaccinationDate: string;
    dose: string;
    nextDueDate: string | null;
    status?: string;
  }) => void;
  setIsVaccinationEditModalOpen: (open: boolean) => void;
}

export function CowHealthTab({
  animal,
  healthEligibility,
  healthTimeline,
  isLoadingHealth,
  loadHealthData,
  setIsHealthModalOpen,
  healthFilter,
  setHealthFilter,
  setSelectedVaccinationEvent,
  setIsVaccinationEditModalOpen,
}: CowHealthTabProps) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-3xl border border-[#e5e5e5] dark:border-[#383838] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-emerald-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                Veterinary &amp; Health Records
              </h3>
              {healthEligibility && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${
                    healthEligibility.primaryHealthState === "HEALTHY"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : healthEligibility.primaryHealthState === "QUARANTINED"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  }`}
                >
                  {healthEligibility.primaryHealthState.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Biosecurity health checks, vaccination boosters &amp; withdrawal
              tracking for #{animal.animalNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void loadHealthData(animal.animalNumber)}
            disabled={isLoadingHealth}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 hover:border-gray-400 rounded-xl transition-all cursor-pointer"
            title="Refresh medical history"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingHealth ? "animate-spin text-[#10a37f]" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHealthModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <HeartPulse className="w-4 h-4" />
            <span>Record Health Update</span>
          </button>

          <Link
            href={`/health?animalId=${animal.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#444] rounded-xl transition-all"
          >
            <span>Health Module &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 4 Biosecurity & Safeguard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Clinical State */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Clinical Status
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                healthEligibility?.primaryHealthState === "HEALTHY" ||
                (!healthEligibility && animal.status === "ACTIVE")
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="text-base font-black text-gray-900 dark:text-white">
              {healthEligibility?.primaryHealthState
                ? healthEligibility.primaryHealthState.replace(/_/g, " ")
                : animal.status === "ACTIVE"
                  ? "Biosecurity Cleared"
                  : animal.status}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            {healthTimeline?.timeline?.length || 0} recorded veterinary events
            &amp; diagnostics.
          </p>
        </div>

        {/* Card 2: Milk Withdrawal Safeguard */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Milk Safety Safeguard
          </span>
          {healthEligibility?.flags.hasMilkWithdrawal ? (
            <div>
              <span className="text-base font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Withholding Active</span>
              </span>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                {healthEligibility.withdrawals.milk.hoursRemaining} hours
                remaining
              </p>
            </div>
          ) : (
            <div>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Safe For Collection</span>
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                0 active medication withholding periods
              </p>
            </div>
          )}
        </div>

        {/* Card 3: Meat Withdrawal Safeguard */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Slaughter Clearance
          </span>
          {healthEligibility?.flags.hasMeatWithdrawal ? (
            <div>
              <span className="text-base font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Withholding Active</span>
              </span>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                {healthEligibility.withdrawals.meat.daysRemaining} days
                remaining
              </p>
            </div>
          ) : (
            <div>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Eligible For Processing</span>
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Biosecurity meat clearance standards met
              </p>
            </div>
          )}
        </div>

        {/* Card 4: Biosecurity & Transit */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Transit &amp; Movement
          </span>
          {healthEligibility?.eligibility.canTransfer === false ? (
            <div>
              <span className="text-base font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Movement Restricted</span>
              </span>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 truncate mt-0.5">
                {healthEligibility.eligibility.blockingReasons?.[0] ||
                  "Active quarantine restriction"}
              </p>
            </div>
          ) : (
            <div>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Transit Permitted</span>
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Clear for farm movement &amp; market transit
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>Medical &amp; Clinical History</span>
              {healthTimeline?.timeline && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300">
                  {healthTimeline.timeline.length} updates
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-500">
              Chronological record of clinical checkups, vaccination boosters,
              treatments, and biosecurity observations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { id: "ALL", label: "All Updates" },
                { id: "DIAGNOSIS", label: "Health Checks" },
                { id: "VACCINATION", label: "Vaccinations" },
                { id: "TREATMENT", label: "Treatments" },
                { id: "QUARANTINE", label: "Biosecurity" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHealthFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  healthFilter === tab.id
                    ? "bg-[#10a37f] text-white shadow-xs"
                    : "bg-gray-100 dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Events List */}
        {isLoadingHealth && !healthTimeline ? (
          <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800">
            <Loader2 className="w-6 h-6 animate-spin text-[#10a37f] mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-500">
              Loading veterinary timeline...
            </p>
          </div>
        ) : (
          (() => {
            const allEvents = healthTimeline?.timeline || [];
            const filteredEvents = allEvents.filter((ev) => {
              if (healthFilter === "ALL") return true;
              if (healthFilter === "DIAGNOSIS")
                return (
                  ev.category === "DIAGNOSIS" || ev.category === "EXAMINATION"
                );
              if (healthFilter === "VACCINATION")
                return ev.category === "VACCINATION";
              if (healthFilter === "TREATMENT")
                return (
                  ev.category === "TREATMENT" || ev.category === "WITHDRAWAL"
                );
              if (healthFilter === "QUARANTINE")
                return (
                  ev.category === "QUARANTINE" || ev.category === "CLEARANCE"
                );
              return true;
            });

            if (filteredEvents.length === 0) {
              return (
                <div className="p-8 text-center rounded-3xl bg-gray-50 dark:bg-[#1a1a1a] border border-dashed border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#10a37f] flex items-center justify-center mx-auto">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                      No health updates matching filter
                    </h5>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                      Record routine clinical examinations, vaccinations, or
                      prescriptions to start tracking #{animal.animalNumber}
                      &apos;s medical history.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHealthModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record First Health Update</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filteredEvents.map((ev, index) => {
                  const isCheck =
                    ev.category === "DIAGNOSIS" ||
                    ev.category === "EXAMINATION";
                  const isVac = ev.category === "VACCINATION";
                  const isTreat =
                    ev.category === "TREATMENT" || ev.category === "WITHDRAWAL";
                  const isQuar = ev.category === "QUARANTINE";

                  const iconBg = isCheck
                    ? "bg-emerald-500/10 text-[#10a37f] border-emerald-500/20"
                    : isVac
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                      : isTreat
                        ? "bg-[#10a37f]/10 text-[#10a37f] dark:text-[#12b88f] border-[#10a37f]/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";

                  const categoryLabel = isCheck
                    ? "Health Examination"
                    : isVac
                      ? "Vaccination"
                      : isTreat
                        ? "Treatment & Prescription"
                        : isQuar
                          ? "Biosecurity Isolation"
                          : ev.category;

                  return (
                    <div
                      key={index}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all space-y-2 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${iconBg}`}
                          >
                            {isCheck ? (
                              <Stethoscope className="w-4 h-4" />
                            ) : isVac ? (
                              <Syringe className="w-4 h-4" />
                            ) : isTreat ? (
                              <Pill className="w-4 h-4" />
                            ) : (
                              <ShieldAlert className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {categoryLabel}
                              </span>
                              {ev.status && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300">
                                  {ev.status}
                                </span>
                              )}
                            </div>
                            <h5 className="text-sm font-black text-gray-900 dark:text-white">
                              {ev.title}
                            </h5>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                            {new Date(ev.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-gray-500 block">
                            {new Date(ev.date).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="pl-12 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <p className="leading-relaxed">{ev.description}</p>
                        <p className="text-[11px] text-gray-500 font-semibold pt-0.5 flex items-center justify-between">
                          <span>
                            Recorded by:{" "}
                            <span className="text-gray-700 dark:text-gray-300">
                              {ev.actor}
                            </span>
                          </span>
                          {isVac && ev.id && (
                            <button
                              type="button"
                              onClick={() => {
                                const parsedDose =
                                  ev.description.match(
                                    /Dose:\s*(.*?)(?:\.|$)/,
                                  )?.[1] || "";
                                const parsedNextDueDate =
                                  ev.description.match(
                                    /Next Booster Due:\s*(.*?)(?:$)/,
                                  )?.[1] || "";

                                setSelectedVaccinationEvent({
                                  id: ev.id || "",
                                  vaccineName: ev.title.replace(
                                    "Vaccinated: ",
                                    "",
                                  ),
                                  vaccinationDate: ev.date,
                                  dose: parsedDose,
                                  nextDueDate:
                                    parsedNextDueDate === "None"
                                      ? null
                                      : parsedNextDueDate,
                                  status: ev.status,
                                });
                                setIsVaccinationEditModalOpen(true);
                              }}
                              className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-400 rounded transition-colors border border-purple-200 dark:border-purple-800"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
