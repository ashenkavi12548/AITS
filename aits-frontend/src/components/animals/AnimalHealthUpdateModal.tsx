"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  HeartPulse,
  Syringe,
  Pill,
  Stethoscope,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Thermometer,
  Clock,
} from "lucide-react";
import { healthService, DiagnosisItem } from "@/services/health.service";
import toast from "react-hot-toast";

export interface AnimalHealthUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animal: {
    id: string;
    animalNumber: string;
    name?: string | null;
    species: string;
    breed: string;
    farmId?: string;
  };
}

type UpdateType = "HEALTH_CHECK" | "VACCINATION" | "TREATMENT";

const COMMON_SYMPTOMS = [
  "Normal Vitals",
  "Fever (>39.5°C)",
  "Reduced Milk Yield",
  "Udder Swelling / Mastitis",
  "Loss of Appetite",
  "Lethargy / Dullness",
  "Lameness / Foot Rot",
  "Coughing / Nasal Discharge",
  "Rumen Stasis",
];

const COMMON_CONDITIONS = [
  "Routine Health Examination",
  "Mastitis Screening & Teat Exam",
  "Post-Calving Health Check",
  "Fever & Anorexia Evaluation",
  "Lameness & Hoof Health Check",
  "Deworming & Parasite Check",
  "Respiratory Clinical Check",
];

const COMMON_VACCINES = [
  {
    name: "Foot & Mouth Disease (FMD) Vaccine",
    dose: "2 mL Subcutaneous",
    intervalMonths: 6,
  },
  {
    name: "Anthrax Spore Vaccine",
    dose: "1 mL Subcutaneous",
    intervalMonths: 12,
  },
  {
    name: "Blackleg (Clostridium chauvoei)",
    dose: "2 mL IM",
    intervalMonths: 12,
  },
  {
    name: "Hemorrhagic Septicemia (HS) Vaccine",
    dose: "3 mL IM",
    intervalMonths: 12,
  },
  {
    name: "Brucellosis S19 (Heifer Vaccine)",
    dose: "2 mL Subcutaneous",
    intervalMonths: 0,
  },
  { name: "Rabies Inactivated Vaccine", dose: "1 mL IM", intervalMonths: 12 },
];

const COMMON_MEDICATIONS = [
  {
    name: "Oxytetracycline 20% L.A.",
    category: "Antibiotic",
    dose: "10 mL / 100kg IM",
    milkWithdrawal: 7,
    meatWithdrawal: 28,
  },
  {
    name: "Penicillin-Streptomycin",
    category: "Antibiotic",
    dose: "1 mL / 25kg IM",
    milkWithdrawal: 3,
    meatWithdrawal: 14,
  },
  {
    name: "Flunixin Meglumine",
    category: "NSAID",
    dose: "2.2 mg/kg IV/IM",
    milkWithdrawal: 2,
    meatWithdrawal: 4,
  },
  {
    name: "Albendazole 10% Oral",
    category: "Antiparasitic",
    dose: "10 mg/kg Oral",
    milkWithdrawal: 3,
    meatWithdrawal: 14,
  },
  {
    name: "Ivermectin 1%",
    category: "Antiparasitic",
    dose: "1 mL / 50kg Subcutaneous",
    milkWithdrawal: 28,
    meatWithdrawal: 28,
  },
  {
    name: "Vitamin B-Complex + Liver Extract",
    category: "Supplement",
    dose: "10 mL IM",
    milkWithdrawal: 0,
    meatWithdrawal: 0,
  },
  {
    name: "Calcium Borogluconate 40%",
    category: "Mineral Supplement",
    dose: "250 mL Slow IV",
    milkWithdrawal: 0,
    meatWithdrawal: 0,
  },
];

export default function AnimalHealthUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  animal,
}: AnimalHealthUpdateModalProps) {
  const [activeType, setActiveType] = useState<UpdateType>("HEALTH_CHECK");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State: Health Check / Diagnosis
  const [condition, setCondition] = useState("Routine Health Examination");
  const [customCondition, setCustomCondition] = useState("");
  const [healthStatus, setHealthStatus] = useState<
    "HEALTHY" | "UNDER_TREATMENT" | "RECOVERED" | "SICK" | "QUARANTINED"
  >("HEALTHY");
  const [severity, setSeverity] = useState("normal");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "Normal Vitals",
  ]);
  const [recommendIsolation, setRecommendIsolation] = useState(false);
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [temperature, setTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [rumenMotility, setRumenMotility] = useState("");
  const [checkNotes, setCheckNotes] = useState("");
  const [labResultRequired, setLabResultRequired] = useState(false);

  // Form State: Vaccination
  const [vaccineName, setVaccineName] = useState(COMMON_VACCINES[0].name);
  const [vaccineDose, setVaccineDose] = useState(COMMON_VACCINES[0].dose);
  const [vaccinationDate, setVaccinationDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [vaccineBatch, setVaccineBatch] = useState("");
  const [vaccineNotes, setVaccineNotes] = useState("");

  // Form State: Treatment
  const [medication, setMedication] = useState(COMMON_MEDICATIONS[0].name);
  const [category, setCategory] = useState(COMMON_MEDICATIONS[0].category);
  const [dose, setDose] = useState(COMMON_MEDICATIONS[0].dose);
  const [duration, setDuration] = useState("3");
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [withdrawalMilk, setWithdrawalMilk] = useState(
    String(COMMON_MEDICATIONS[0].milkWithdrawal),
  );
  const [withdrawalMeat, setWithdrawalMeat] = useState(
    String(COMMON_MEDICATIONS[0].meatWithdrawal),
  );
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [activeDiagnoses, setActiveDiagnoses] = useState<DiagnosisItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    if (isOpen && activeType === "TREATMENT") {
      const fetchCases = async () => {
        setLoadingCases(true);
        try {
          const res = await healthService.getDiagnoses({ search: animal.animalNumber, status: "ACTIVE" });
          setActiveDiagnoses(res.data || []);
          if (res.data && res.data.length > 0) {
            setSelectedCaseId(res.data[0].id);
          } else {
            setSelectedCaseId("");
          }
        } catch (e) {
          console.error("Failed to fetch active diagnoses:", e);
        } finally {
          setLoadingCases(false);
        }
      };
      fetchCases();
    }
  }, [isOpen, activeType, animal.animalNumber]);

  if (!isOpen) return null;

  const toggleSymptom = (sym: string) => {
    if (sym === "Normal Vitals") {
      setSelectedSymptoms(["Normal Vitals"]);
      return;
    }
    const filtered = selectedSymptoms.filter((s) => s !== "Normal Vitals");
    if (filtered.includes(sym)) {
      const next = filtered.filter((s) => s !== sym);
      setSelectedSymptoms(next.length === 0 ? ["Normal Vitals"] : next);
    } else {
      setSelectedSymptoms([...filtered, sym]);
    }
  };

  const handleSelectVaccinePreset = (vac: (typeof COMMON_VACCINES)[0]) => {
    setVaccineName(vac.name);
    setVaccineDose(vac.dose);
    if (vac.intervalMonths > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + vac.intervalMonths);
      setNextDueDate(d.toISOString().split("T")[0]);
    } else {
      setNextDueDate("");
    }
  };

  const handleSelectMedicationPreset = (
    med: (typeof COMMON_MEDICATIONS)[0],
  ) => {
    setMedication(med.name);
    setCategory(med.category);
    setDose(med.dose);
    setWithdrawalMilk(String(med.milkWithdrawal));
    setWithdrawalMeat(String(med.meatWithdrawal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeType === "HEALTH_CHECK") {
        const finalCondition =
          condition === "OTHER" ? customCondition.trim() : condition;
        if (!finalCondition) {
          toast.error("Condition or examination reason is required.");
          setIsSubmitting(false);
          return;
        }

        // 1. If vitals were recorded, create a Clinical Examination
        const hasVitals =
          temperature || heartRate || respiratoryRate || rumenMotility;
        if (hasVitals) {
          try {
            await healthService.createClinicalExamination({
              animalTag: animal.animalNumber,
              examDate: new Date(examDate).toISOString(),
              temperature: temperature ? parseFloat(temperature) : undefined,
              heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
              respiratoryRate: respiratoryRate
                ? parseInt(respiratoryRate, 10)
                : undefined,
              rumenMotility: rumenMotility
                ? parseInt(rumenMotility, 10)
                : undefined,
              clinicalSigns: selectedSymptoms,
              initialAssessment: finalCondition,
              certainty: "CONFIRMED",
              notes: checkNotes.trim() || undefined,
            });
          } catch (examErr) {
            console.warn("Clinical exam log warning:", examErr);
          }
        }

        // 2. Create the Diagnosis / Health Check record
        await healthService.createDiagnosis({
          animalTag: animal.animalNumber,
          condition: finalCondition,
          severity: severity.toLowerCase(),
          healthStatus,
          symptoms: selectedSymptoms,
          notes: checkNotes.trim() || undefined,
          recommendIsolation,
          certainty: "CONFIRMED",
          labResultRequired,
        });

        toast.success(`Health update recorded for #${animal.animalNumber}`);
      } else if (activeType === "VACCINATION") {
        if (!vaccineName.trim()) {
          toast.error("Vaccine name is required.");
          setIsSubmitting(false);
          return;
        }

        await healthService.createVaccination({
          animalTag: animal.animalNumber,
          vaccineName: vaccineName.trim(),
          dose: vaccineDose.trim() || "Standard Dose",
          vaccinationDate,
          nextDueDate: nextDueDate ? nextDueDate : undefined,
          batchNumber: vaccineBatch.trim() || undefined,
          notes: vaccineNotes.trim() || undefined,
        });

        toast.success(`Vaccination recorded for #${animal.animalNumber}`);
      } else if (activeType === "TREATMENT") {
        if (!medication.trim()) {
          toast.error("Medication name is required.");
          setIsSubmitting(false);
          return;
        }

        const durNum = Math.max(1, parseInt(duration, 10) || 1);
        const endD = new Date(startDate);
        endD.setDate(endD.getDate() + durNum);

        await healthService.createTreatment({
          animalTag: animal.animalNumber,
          medication: medication.trim(),
          category: category.trim() || "General",
          dose: dose.trim() || "Standard Dose",
          duration: durNum,
          caseId: selectedCaseId || undefined,
          startDate,
          endDate: endD.toISOString().split("T")[0],
          withdrawalMilk: parseInt(withdrawalMilk, 10) || 0,
          withdrawalMeat: parseInt(withdrawalMeat, 10) || 0,
          notes: treatmentNotes.trim() || undefined,
        });

        toast.success(
          `Treatment prescription recorded for #${animal.animalNumber}`,
        );
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Health update error:", err);
      // Check for Axios 409 Conflict error
      const errResponse = (
        err as { response?: { status?: number; data?: { message?: string } } }
      ).response;
      if (errResponse?.status === 409) {
        toast.error(
          errResponse.data?.message ||
            "This vaccination is already recorded for today.",
        );
      } else {
        const errMsg =
          err instanceof Error ? err.message : "Failed to record health update";
        toast.error(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-[#202020] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a]/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-emerald-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Record Health Update
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
                  #{animal.animalNumber}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {animal.name ? `${animal.name} • ` : ""}
                {animal.breed} {animal.species}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Update Type Selector Tabs */}
        <div className="p-4 sm:px-6 bg-white dark:bg-[#202020] border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-[#161616] rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveType("HEALTH_CHECK")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                activeType === "HEALTH_CHECK"
                  ? "bg-white dark:bg-[#2a2a2a] text-[#10a37f] shadow-xs border border-gray-200/60 dark:border-gray-700"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Health Check</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveType("VACCINATION")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                activeType === "VACCINATION"
                  ? "bg-white dark:bg-[#2a2a2a] text-purple-600 dark:text-purple-400 shadow-xs border border-gray-200/60 dark:border-gray-700"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Syringe className="w-4 h-4" />
              <span>Vaccination</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveType("TREATMENT")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                activeType === "TREATMENT"
                  ? "bg-white dark:bg-[#2a2a2a] text-[#10a37f] dark:text-[#12b88f] shadow-xs border border-gray-200/60 dark:border-gray-700"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Treatment</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
        >
          {/* TAB 1: CLINICAL HEALTH CHECK */}
          {activeType === "HEALTH_CHECK" && (
            <div className="space-y-4">
              {/* Condition / Examination Type */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Examination Reason / Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => {
                    setCondition(e.target.value);
                    if (e.target.value === "Routine Health Examination") {
                      setHealthStatus("HEALTHY");
                      setSeverity("normal");
                      setSelectedSymptoms(["Normal Vitals"]);
                    } else if (
                      e.target.value.includes("Mastitis") ||
                      e.target.value.includes("Fever")
                    ) {
                      setHealthStatus("UNDER_TREATMENT");
                      setSeverity("moderate");
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/50"
                >
                  {COMMON_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="OTHER">Other / Custom Diagnosis...</option>
                </select>
                {condition === "OTHER" && (
                  <input
                    type="text"
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    placeholder="Enter custom condition or clinical diagnosis"
                    className="w-full mt-2 px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/50"
                    required
                  />
                )}
              </div>

              {/* Status & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Target Clinical Status
                  </label>
                  <select
                    value={healthStatus}
                    onChange={(e) =>
                      setHealthStatus(e.target.value as typeof healthStatus)
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/50 font-bold"
                  >
                    <option value="HEALTHY">
                      🟢 HEALTHY (Biosecurity Cleared)
                    </option>
                    <option value="UNDER_TREATMENT">🟡 UNDER TREATMENT</option>
                    <option value="RECOVERED">
                      🔵 RECOVERED (Restored to Active)
                    </option>
                    <option value="SICK">🟠 SICK (Observation)</option>
                    <option value="QUARANTINED">
                      🔴 QUARANTINED (Isolated)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Clinical Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/50"
                  >
                    <option value="normal">Normal / Healthy</option>
                    <option value="low">Low Severity</option>
                    <option value="moderate">Moderate Severity</option>
                    <option value="high">High Severity</option>
                    <option value="critical">Critical Severity</option>
                  </select>
                </div>
              </div>

              {/* Observed Symptoms Chips */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Observed Clinical Signs & Vitals
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SYMPTOMS.map((sym) => {
                    const isSelected = selectedSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(sym)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? sym === "Normal Vitals"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            : "bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vitals Measurements (Optional) */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300">
                  <Thermometer className="w-4 h-4 text-[#10a37f]" />
                  <span>Vitals (Optional)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block">
                      Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 38.6"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">
                      Heart Rate (BPM)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 68"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">
                      Resp. Rate (/min)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block">
                      Rumen (/2m)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 3"
                      value={rumenMotility}
                      onChange={(e) => setRumenMotility(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Biosecurity Isolation Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Recommend Biosecurity Isolation
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Instantly isolates animal and locks movement / milk
                      collection
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={recommendIsolation}
                  onChange={(e) => setRecommendIsolation(e.target.checked)}
                  className="w-4 h-4 rounded text-[#10a37f] focus:ring-[#10a37f]"
                />
              </div>

              {/* Lab Result Required Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Lab Result Required
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Requires a lab result before a prescription can be written
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={labResultRequired}
                  onChange={(e) => setLabResultRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-[#10a37f] focus:ring-[#10a37f]"
                />
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Examination Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Clinical Examination Notes
                </label>
                <textarea
                  rows={2}
                  value={checkNotes}
                  onChange={(e) => setCheckNotes(e.target.value)}
                  placeholder="Record treatment instructions, veterinary findings, or observations..."
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/50"
                />
              </div>
            </div>
          )}

          {/* TAB 2: VACCINATION */}
          {activeType === "VACCINATION" && (
            <div className="space-y-4">
              {/* Quick Vaccine Presets */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  National Vaccination Presets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMON_VACCINES.map((vac) => {
                    const isSelected = vaccineName === vac.name;
                    return (
                      <button
                        key={vac.name}
                        type="button"
                        onClick={() => handleSelectVaccinePreset(vac)}
                        className={`text-left p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 shadow-xs"
                            : "bg-gray-50 dark:bg-[#181818] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <p className="font-black truncate">{vac.name}</p>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                          {vac.dose} • Interval:{" "}
                          {vac.intervalMonths > 0
                            ? `${vac.intervalMonths} mo`
                            : "Once"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vaccine Name */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Vaccine Name *
                </label>
                <input
                  type="text"
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>

              {/* Dose & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Dose Administered *
                  </label>
                  <input
                    type="text"
                    value={vaccineDose}
                    onChange={(e) => setVaccineDose(e.target.value)}
                    placeholder="e.g. 2 mL IM"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 items-center justify-between">
                    <span>Vaccination Date</span>
                  </label>
                  <input
                    type="date"
                    value={vaccinationDate}
                    onChange={(e) => setVaccinationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Next Booster Due
                  </label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Batch & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    value={vaccineBatch}
                    onChange={(e) => setVaccineBatch(e.target.value)}
                    placeholder="e.g. FMD-LK-2026-B8"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Reactions / Notes
                  </label>
                  <input
                    type="text"
                    value={vaccineNotes}
                    onChange={(e) => setVaccineNotes(e.target.value)}
                    placeholder="No adverse reactions observed"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TREATMENT */}
          {activeType === "TREATMENT" && (
            <div className="space-y-4">
              {/* Quick Medication Presets */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Common Veterinary Medications
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMON_MEDICATIONS.map((med) => {
                    const isSelected = medication === med.name;
                    return (
                      <button
                        key={med.name}
                        type="button"
                        onClick={() => handleSelectMedicationPreset(med)}
                        className={`text-left p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-[#10a37f]/5 dark:bg-[#10a37f]/30/40 border-[#10a37f]/30 dark:border-[#10a37f]/60 text-[#0e8c6d] dark:text-[#12b88f] shadow-xs"
                            : "bg-gray-50 dark:bg-[#181818] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <p className="font-black truncate">{med.name}</p>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                          {med.category} • Milk: {med.milkWithdrawal}d • Meat:{" "}
                          {med.meatWithdrawal}d
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medication & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Antibiotic, NSAID"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Link to Diagnosis */}
              <div className="mb-4">
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Link to Active Diagnosis (Required)
                </label>
                {loadingCases ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Fetching active diagnoses...
                  </div>
                ) : activeDiagnoses.length === 0 ? (
                  <div className="text-xs text-red-500 font-bold p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl">
                    No active diagnosis found for this animal. You must create a health check with a diagnosis first before prescribing a treatment.
                  </div>
                ) : (
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  >
                    <option value="" disabled>Select Diagnosis</option>
                    {activeDiagnoses.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.condition} (Severity: {d.severity})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dose, Duration, Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Dose & Route
                  </label>
                  <input
                    type="text"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Course Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Food Safety & Withdrawal Periods */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4" />
                  <span>Mandatory Food Safety Withholding Periods</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-600 dark:text-gray-400 block font-bold">
                      Milk Withholding (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={withdrawalMilk}
                      onChange={(e) => setWithdrawalMilk(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 dark:text-gray-400 block font-bold">
                      Meat Withholding (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={withdrawalMeat}
                      onChange={(e) => setWithdrawalMeat(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Prescription & Treatment Notes
                </label>
                <textarea
                  rows={2}
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                  placeholder="Veterinary instructions, follow-up advice..."
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/50"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (activeType === "TREATMENT" && !selectedCaseId)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#10a37f] hover:bg-[#0e8c6d] disabled:opacity-50 transition-all shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {activeType === "HEALTH_CHECK"
                      ? "Record Health Check"
                      : activeType === "VACCINATION"
                        ? "Save Vaccination Log"
                        : "Prescribe Treatment"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
