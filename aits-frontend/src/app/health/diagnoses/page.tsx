"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Stethoscope,
  Plus,
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Activity,
  Beaker,
  Edit3,
  Trash2,
} from "lucide-react";
import { AnimalTagAutocomplete } from "@/components/common/AnimalTagAutocomplete";
import toast from "react-hot-toast";
import {
  healthService,
  DiagnosisItem,
  CreateDiagnosisInput,
  DiseaseMaster,
} from "@/services/health.service";
import AnimalTimelineModal from "@/components/health/AnimalTimelineModal";
import AnimalPhoto from "@/components/common/AnimalPhoto";

const severityConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof AlertTriangle;
  }
> = {
  critical: {
    label: "Critical",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: AlertTriangle,
  },
  high: {
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: AlertCircle,
  },
  moderate: {
    label: "Moderate",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertCircle,
  },
  low: {
    label: "Low",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    icon: Info,
  },
};

const statusColors: Record<string, string> = {
  QUARANTINED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  UNDER_TREATMENT:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  SICK: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  RECOVERED:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  HEALTHY:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

// ─── Add Diagnosis Modal ───────────────────────────────────────────────
function AddDiagnosisModal({
  onClose,
  onSuccess,
  diagnosisToEdit,
}: {
  onClose: () => void;
  onSuccess: () => void;
  diagnosisToEdit?: DiagnosisItem | null;
}) {
  const [diseases, setDiseases] = useState<DiseaseMaster[]>([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState("");
  const [formData, setFormData] = useState<CreateDiagnosisInput>({
    animalTag: diagnosisToEdit?.animalTag || "",
    condition: diagnosisToEdit?.condition || "",
    severity: diagnosisToEdit?.severity ? diagnosisToEdit.severity.toLowerCase() : "moderate",
    symptoms: diagnosisToEdit?.symptoms || [],
    notes: diagnosisToEdit?.notes || "",
    recommendIsolation: false,
    certainty: "CONFIRMED",
  });
  const [vitals, setVitals] = useState({
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    rumenMotility: "",
  });
  const [symptomInput, setSymptomInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    healthService
      .getDiseases()
      .then((data) => setDiseases(data))
      .catch((err) => console.error("Failed to load diseases catalog", err));
  }, []);

  const handleDiseaseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDiseaseId(id);
    if (!id) return;

    const matched = diseases.find((d) => d.id === id);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        condition: matched.name,
        diseaseId: matched.id,
        severity: matched.severity
          ? matched.severity.toLowerCase()
          : "moderate",
        recommendIsolation: matched.isolationRequired ?? false,
      }));
    }
  };

  const handleAddSymptom = (symptom?: string) => {
    const sym = symptom || symptomInput.trim();
    if (sym && !formData.symptoms?.includes(sym)) {
      setFormData({
        ...formData,
        symptoms: [...(formData.symptoms || []), sym],
      });
      if (!symptom) setSymptomInput("");
    }
  };

  const handleRemoveSymptom = (index: number) => {
    const updated = [...(formData.symptoms || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, symptoms: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animalTag.trim()) {
      toast.error("Animal is required");
      return;
    }
    if (!formData.condition.trim()) {
      toast.error("Condition / Diagnosis is required");
      return;
    }

    setSaving(true);
    try {
      if (diagnosisToEdit) {
        await healthService.updateDiagnosis(diagnosisToEdit.id, formData);
        toast.success("Diagnosis updated successfully");
      } else {
        // 1. If vitals provided, log Clinical Examination
        const hasVitals =
          vitals.temperature ||
          vitals.heartRate ||
          vitals.respiratoryRate ||
          vitals.rumenMotility;

        if (hasVitals) {
          await healthService.createClinicalExamination({
            animalTag: formData.animalTag.trim(),
            examDate: new Date().toISOString(),
            temperature: vitals.temperature
              ? parseFloat(vitals.temperature)
              : undefined,
            heartRate: vitals.heartRate
              ? parseInt(vitals.heartRate, 10)
              : undefined,
            respiratoryRate: vitals.respiratoryRate
              ? parseInt(vitals.respiratoryRate, 10)
              : undefined,
            rumenMotility: vitals.rumenMotility
              ? parseInt(vitals.rumenMotility, 10)
              : undefined,
            clinicalSigns: formData.symptoms,
            initialAssessment: formData.condition,
            certainty: formData.certainty || "CONFIRMED",
            notes: formData.notes,
          });
        }

        // 2. Log formal Diagnosis
        await healthService.createDiagnosis(formData);
        toast.success("Clinical exam & diagnosis recorded successfully");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to log diagnosis. Please verify the animal tag.");
    } finally {
      setSaving(false);
    }
  };

  const selectedDisease = diseases.find((d) => d.id === selectedDiseaseId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                {diagnosisToEdit ? "Edit Clinical Diagnosis" : "New Clinical Diagnosis & Examination"}
              </h2>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                {diagnosisToEdit ? "Update diagnosis details and severity" : "Record vitals, master catalog diagnosis, and certainty rating"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-[#5d5d5d] dark:text-[#b4b4b4]" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <AnimalTagAutocomplete
                  value={formData.animalTag || ""}
                  onSelect={(tag) =>
                    setFormData({ ...formData, animalTag: tag })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Diagnostic Certainty
                </label>
                <select
                  value={formData.certainty || "CONFIRMED"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certainty: e.target.value as
                        | "SUSPECTED"
                        | "PROBABLE"
                        | "CONFIRMED"
                        | "RULED_OUT",
                    })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                >
                  <option value="CONFIRMED">
                    CONFIRMED (Pathology / Lab / Clear Signs)
                  </option>
                  <option value="PROBABLE">
                    PROBABLE (Strong Clinical Presentation)
                  </option>
                  <option value="SUSPECTED">
                    SUSPECTED (Initial Differential)
                  </option>
                  <option value="RULED_OUT">
                    RULED_OUT (Differential Ruled Out)
                  </option>
                </select>
              </div>
            </div>

            {/* Disease Master Selector */}
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Standard Disease Catalog
              </label>
              <select
                value={selectedDiseaseId || ""}
                onChange={handleDiseaseSelect}
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
              >
                <option value="">
                  -- Choose from Standard Catalog or Type Custom Condition Below
                  --
                </option>
                {diseases.map((dis) => (
                  <option key={dis.id} value={dis.id}>
                    {dis.name} ({dis.category}){" "}
                    {dis.contagious ? "⚠️ Contagious" : ""}{" "}
                    {dis.reportable ? "🚨 Reportable" : ""}
                  </option>
                ))}
              </select>
              {selectedDisease && (
                <div className="mt-2 p-2.5 rounded-lg bg-[#f9f9f9] dark:bg-[#333] border border-[#e5e5e5] dark:border-[#444] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#10a37f]">
                      {selectedDisease.category}
                    </span>
                    {selectedDisease.contagious && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/20">
                        Contagious (Biosecurity alert)
                      </span>
                    )}
                    {selectedDisease.reportable && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Statutory Reportable Disease
                      </span>
                    )}
                  </div>
                  {(selectedDisease.commonSymptoms || []).length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-[#888]">Suggest:</span>
                      {(selectedDisease.commonSymptoms || [])
                        .slice(0, 3)
                        .map((sym, si) => (
                          <button
                            key={si}
                            type="button"
                            onClick={() => handleAddSymptom(sym)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#444] border border-[#ddd] hover:border-[#10a37f] text-[#555] dark:text-[#eee]"
                          >
                            + {sym}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Condition / Diagnosis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mastitis (Clinical), Foot and Mouth Disease"
                  value={formData.condition || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Severity Rating
                </label>
                <select
                  value={formData.severity || "moderate"}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                >
                  <option value="critical">
                    Critical (Immediate emergency)
                  </option>
                  <option value="high">High (Severe clinical symptoms)</option>
                  <option value="moderate">
                    Moderate (Clinical management)
                  </option>
                  <option value="low">Low (Mild / routine observation)</option>
                </select>
              </div>
            </div>

            {/* Clinical Vital Signs Section */}
            {!diagnosisToEdit && (
              <div className="p-3.5 rounded-xl bg-[#fcfcfc] dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#383838] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#10a37f]" />
                  Clinical Examination Vitals (Optional)
                </span>
                <span className="text-[10px] text-[#8e8e8e]">
                  Standard bovine parameters
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-[#8e8e8e] mb-1">
                    Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="38.5"
                    value={vitals.temperature ?? ""}
                    onChange={(e) =>
                      setVitals({ ...vitals, temperature: e.target.value })
                    }
                    className="chatgpt-input w-full px-2.5 py-1.5 text-xs rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8e8e8e] mb-1">
                    Pulse (BPM)
                  </label>
                  <input
                    type="number"
                    placeholder="65"
                    value={vitals.heartRate ?? ""}
                    onChange={(e) =>
                      setVitals({ ...vitals, heartRate: e.target.value })
                    }
                    className="chatgpt-input w-full px-2.5 py-1.5 text-xs rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8e8e8e] mb-1">
                    Resp (/min)
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    value={vitals.respiratoryRate ?? ""}
                    onChange={(e) =>
                      setVitals({ ...vitals, respiratoryRate: e.target.value })
                    }
                    className="chatgpt-input w-full px-2.5 py-1.5 text-xs rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8e8e8e] mb-1">
                    Rumen (/2m)
                  </label>
                  <input
                    type="number"
                    placeholder="3"
                    value={vitals.rumenMotility ?? ""}
                    onChange={(e) =>
                      setVitals({ ...vitals, rumenMotility: e.target.value })
                    }
                    className="chatgpt-input w-full px-2.5 py-1.5 text-xs rounded-md"
                  />
                </div>
              </div>
            </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Observed Clinical Symptoms
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Type symptom and press Add"
                  value={symptomInput || ""}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSymptom();
                    }
                  }}
                  className="chatgpt-input flex-1 px-3 py-2 rounded-lg text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => handleAddSymptom()}
                  className="px-3 py-2 bg-[#f4f4f4] dark:bg-[#383838] hover:bg-[#ececec] text-[13px] font-medium rounded-lg"
                >
                  Add
                </button>
              </div>
              {formData.symptoms && formData.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.symptoms.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(i)}
                        className="hover:text-red-800 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recommendIsolation ?? false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recommendIsolation: e.target.checked,
                    })
                  }
                  className="rounded text-[#10a37f] focus:ring-[#10a37f]"
                />
                <span className="text-[13px] font-medium text-red-600 dark:text-red-400">
                  Recommend immediate biosecurity isolation (Quarantine order)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Clinical Notes & Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Treatment plan, isolation protocol, sampling instructions…"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-[#e5e5e5] dark:border-[#383838]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? (diagnosisToEdit ? "Updating…" : "Recording…") : (diagnosisToEdit ? "Update Diagnosis" : "Record Diagnosis")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DiagnosesPage() {
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [diagnosisToEdit, setDiagnosisToEdit] = useState<DiagnosisItem | null>(null);
  const [activeTimelineTag, setActiveTimelineTag] = useState<string | null>(
    null,
  );

  const fetchDiagnoses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await healthService.getDiagnoses({
        search: search || undefined,
        severity: severityFilter !== "all" ? severityFilter : undefined,
      });
      setDiagnoses(res.data);
    } catch (err: unknown) {
      console.error("Failed to load diagnoses", err);
      toast.error("Could not load diagnoses records");
    } finally {
      setLoading(false);
    }
  }, [search, severityFilter]);

  const handleDeleteDiagnosis = async (id: string) => {
    if (!confirm("Are you sure you want to delete this diagnosis?")) return;
    try {
      await healthService.deleteDiagnosis(id);
      toast.success("Diagnosis deleted successfully");
      fetchDiagnoses();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to delete diagnosis");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiagnoses();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchDiagnoses]);

  return (
    <DashboardLayout>
      {/* ── Page Header ── */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/health"
            className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20 shadow-2xs">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                Clinical Diagnoses
              </span>
            </div>
            <h1 className="text-lg font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
              Clinical Diagnoses & Health Checks
            </h1>
            <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
              Veterinary examination logs, disease surveillance, and symptom
              tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiagnoses}
            className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Diagnosis</span>
          </button>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
          <input
            type="text"
            placeholder="Search by tag, animal name, condition, or symptoms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="chatgpt-input w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "critical", "high", "moderate", "low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer capitalize ${
                severityFilter === sev
                  ? "bg-[#10a37f] text-white border-[#10a37f]"
                  : "bg-white dark:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f]/40"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* ── Diagnoses List ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8e8e8e]">
            Loading diagnoses records…
          </div>
        ) : diagnoses.length > 0 ? (
          diagnoses.map((d) => {
            const sev = severityConfig[d.severity] || severityConfig.moderate;
            const SevIcon = sev.icon;

            return (
              <div
                key={d.id}
                className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-sm p-5 hover:border-[#10a37f]/40 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  {/* Left info - Photo & Details */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
                    {/* Animal Photo & Severity Badge */}
                    <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-xs border border-[#e5e5e5] dark:border-[#444]">
                      <AnimalPhoto
                        src={d.imageUrl}
                        animalNumber={d.animalTag}
                        species={d.species}
                        showBadge={false}
                        className="w-full h-full"
                      />
                      <div className="absolute -top-1 -right-1">
                        <div
                          className={`w-7 h-7 rounded-bl-lg rounded-tr-lg ${sev.bg} ${sev.color} flex items-center justify-center border-b border-l ${sev.border} shadow-xs backdrop-blur-sm bg-opacity-90`}
                          title={`Severity: ${sev.label}`}
                        >
                          <SevIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[15px] font-bold text-[#0d0d0d] dark:text-white">
                            {d.condition}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color} ${sev.border}`}
                          >
                            {sev.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              statusColors[d.status] ||
                              "bg-[#f4f4f4] text-[#5d5d5d] border-[#e5e5e5]"
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4] font-medium mb-2">
                          <button
                            onClick={() => setActiveTimelineTag(d.animalTag)}
                            className="font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] transition-colors cursor-pointer"
                            title="View Animal Medical Timeline"
                          >
                            #{d.animalTag}
                          </button>{" "}
                          — {d.animalName}{" "}
                          <span className="opacity-70">({d.breed})</span>
                          <span className="mx-2 opacity-30">•</span>
                          <span className="text-[12px] opacity-80">
                            {d.farmName}
                          </span>
                        </p>

                        {/* Symptoms */}
                        {d.symptoms && d.symptoms.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                              Symptoms:
                            </span>
                            {d.symptoms.map((s, si) => (
                              <span
                                key={si}
                                className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#f4f4f4] dark:bg-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] border border-[#e5e5e5] dark:border-[#444] font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {d.notes && (
                        <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-3 leading-relaxed bg-[#f9f9f9] dark:bg-[#252525] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
                          {d.notes}
                        </p>
                      )}

                      {d.labResultRequired && (
                        <div className="mt-3 bg-sky-50/50 dark:bg-sky-950/20 p-3 rounded-xl border border-sky-200/60 dark:border-sky-900/40">
                          <div className="flex flex-col gap-2">
                            <span className="text-[12px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                              <Beaker className="w-3.5 h-3.5" />
                              Lab Result Required
                            </span>
                            {d.labResults && d.labResults.length > 0 ? (
                              <div className="space-y-1.5">
                                {d.labResults.map((lr, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[11px] bg-white dark:bg-[#2f2f2f] border border-sky-200 dark:border-sky-800 p-2 rounded-lg flex items-center justify-between"
                                  >
                                    <div>
                                      <span className="font-semibold">
                                        {lr.testType}
                                      </span>{" "}
                                      -{" "}
                                      <span className="text-gray-500">
                                        {lr.lab}
                                      </span>
                                      {lr.result && (
                                        <div className="mt-1 text-gray-700 dark:text-gray-300 font-medium">
                                          Result: {lr.result}
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${lr.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                                    >
                                      {lr.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-sky-600 dark:text-sky-400">
                                Waiting for lab request generation...
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right meta & actions */}
                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-1 shrink-0 text-right min-w-30">
                    <span className="text-[13px] font-bold text-[#0d0d0d] dark:text-white flex items-center gap-1.5 justify-end">
                      <Stethoscope className="w-3.5 h-3.5 text-[#10a37f]" />
                      {d.vet}
                    </span>
                    <span className="text-[12px] font-medium text-[#8e8e8e] flex items-center gap-1.5 justify-end mt-1">
                      <Calendar className="w-3.5 h-3.5" /> {d.date}
                    </span>

                    <div className="flex items-center gap-2 justify-end mt-2">
                      <button
                        onClick={() => {
                          setDiagnosisToEdit(d);
                          setShowAdd(true);
                        }}
                        className="p-1.5 rounded-lg text-[#5d5d5d] hover:bg-[#f4f4f4] dark:text-[#b4b4b4] dark:hover:bg-[#383838] transition-colors cursor-pointer"
                        title="Edit Diagnosis"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDiagnosis(d.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Diagnosis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 w-full">
                      <button
                        onClick={() => setActiveTimelineTag(d.animalTag)}
                        className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-[#10a37f] bg-[#10a37f]/10 hover:bg-[#10a37f]/20 rounded-lg transition-colors cursor-pointer border border-[#10a37f]/20"
                      >
                        Medical Timeline
                      </button>

                      {d.labResultRequired &&
                      (!d.labResults || d.labResults.length === 0) ? (
                        <Link
                          href={`/health/lab-results?openAdd=true&animalTag=${d.animalTag}&caseId=${d.id}`}
                          className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
                        >
                          Request Lab Test
                        </Link>
                      ) : d.labResultRequired &&
                        d.labResults?.every(
                          (r: { status: string }) =>
                            r.status.toLowerCase() === "pending",
                        ) ? (
                        <span className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-sky-700 bg-sky-100 rounded-lg">
                          Awaiting Lab
                        </span>
                      ) : (
                        <Link
                          href={`/health/treatments?caseId=${d.id}`}
                          className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-white bg-[#0d0d0d] dark:bg-white dark:text-[#0d0d0d] hover:bg-[#262626] dark:hover:bg-[#e5e5e5] rounded-lg transition-colors"
                        >
                          Prescribe Rx
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#2f2f2f] rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#8e8e8e] text-sm">
            No clinical diagnoses found matching your criteria.
          </div>
        )}
      </div>

      {showAdd && (
        <AddDiagnosisModal
          diagnosisToEdit={diagnosisToEdit}
          onClose={() => {
            setShowAdd(false);
            setDiagnosisToEdit(null);
          }}
          onSuccess={fetchDiagnoses}
        />
      )}

      {/* Animal Medical Timeline Modal */}
      <AnimalTimelineModal
        animalTag={activeTimelineTag}
        isOpen={Boolean(activeTimelineTag)}
        onClose={() => setActiveTimelineTag(null)}
      />
    </DashboardLayout>
  );
}
