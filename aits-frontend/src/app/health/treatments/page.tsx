"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Pill,
  HeartPulse,
  Plus,
  Search,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Ban,
  RefreshCw,
  Flame,
  Stethoscope,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  healthService,
  TreatmentItem,
  MedicationMaster,
  WithdrawalPeriodItem,
  DiagnosisItem,
} from "@/services/health.service";
import AnimalTimelineModal from "@/components/health/AnimalTimelineModal";
import AnimalPhoto from "@/components/common/AnimalPhoto";

const categoryColors: Record<string, string> = {
  Antibiotic: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  "Anti-inflammatory (NSAID)":
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  "Calcium Supplement":
    "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  "Vitamin / Tonic": "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20",
};

// ─── New Treatment Workflow ───────────────────────────────────────────────
function NewTreatmentWorkflow({
  onClose,
  onSuccess,
  treatmentToEdit,
  initialCaseId,
}: {
  onClose: () => void;
  onSuccess: () => void;
  treatmentToEdit?: TreatmentItem | null;
  initialCaseId?: string | null;
}) {
  const [medications, setMedications] = useState<MedicationMaster[]>([]);

  // Diagnosed Animals State
  const [cases, setCases] = useState<DiagnosisItem[]>([]);
  const [loadingCases, setLoadingCases] = useState(!treatmentToEdit);
  const [selectedCase, setSelectedCase] = useState<DiagnosisItem | null>(null);

  interface TreatmentFormData {
    medication: string;
    medicationId: string;
    category: string;
    dose: string;
    duration: number;
    startDate: string;
    withdrawalMilk: number;
    withdrawalMeat: number;
    notes: string;
    condition: string;
    followUpDate: string;
  }

  const createDefaultMed = (): TreatmentFormData => ({
    medication: "",
    medicationId: "",
    category: "Antibiotic",
    dose: "",
    duration: 7,
    startDate: new Date().toISOString().split("T")[0],
    withdrawalMilk: 0,
    withdrawalMeat: 0,
    notes: "",
    condition: "",
    followUpDate: "",
  });

  const [formDataList, setFormDataList] = useState<TreatmentFormData[]>(
    treatmentToEdit
      ? [
          {
            medication: treatmentToEdit.medication || "",
            medicationId: "",
            category: treatmentToEdit.category || "Antibiotic",
            dose: treatmentToEdit.dose || "",
            duration: treatmentToEdit.duration || 7,
            startDate:
              treatmentToEdit.startDate ||
              new Date().toISOString().split("T")[0],
            withdrawalMilk: treatmentToEdit.withdrawalMilk || 0,
            withdrawalMeat: treatmentToEdit.withdrawalMeat || 0,
            notes: treatmentToEdit.notes || "",
            condition: treatmentToEdit.condition || "",
            followUpDate: "",
          },
        ]
      : [createDefaultMed()],
  );
  const [saving, setSaving] = useState(false);
  const [requireQuarantine, setRequireQuarantine] = useState(false);
  const [quarantineZone, setQuarantineZone] = useState("Emergency Isolation Pen");
  const [quarantineDays, setQuarantineDays] = useState(14);
  const [isRequestingLab, setIsRequestingLab] = useState(false);

  const handleRequestLabReport = async () => {
    if (!selectedCase) return;
    setIsRequestingLab(true);
    try {
      await healthService.createLabResult({
        animalTag: selectedCase.animalTag,
        testType: "General Diagnostics",
        laboratory: "AITS Diagnostics",
        sampleDate: new Date().toISOString().split("T")[0],
        caseId: selectedCase.id,
        status: "PENDING",
      });
      toast.success("Lab report requested successfully.");
      
      const res = await healthService.getDiagnoses({ limit: 100 });
      if (res.data) {
        const updated = res.data.find((c) => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to request lab report.");
    } finally {
      setIsRequestingLab(false);
    }
  };

  useEffect(() => {
    healthService
      .getMedications()
      .then((data) => setMedications(data))
      .catch((err) => console.error("Failed to load medications", err));
  }, []);

  useEffect(() => {
    if (!treatmentToEdit) {
      healthService
        .getDiagnoses({ limit: 100 })
        .then((res: { data?: DiagnosisItem[] }) => {
          const allCases = res.data || [];
          const active = allCases.filter((c) =>
            ["sick", "under_treatment", "quarantined"].includes(
              c.status.toLowerCase(),
            ),
          );
          setCases(active);

          if (initialCaseId) {
            const matchedCase = active.find((c) => c.id === initialCaseId);
            if (matchedCase) setSelectedCase(matchedCase);
          }
        })
        .catch((err) => {
          console.error("Failed to load diagnoses", err);
          toast.error("Failed to load diagnosed animals.");
        })
        .finally(() => setLoadingCases(false));
    }
  }, [treatmentToEdit, initialCaseId]);

  const handleMedSelect = (
    index: number,
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const id = e.target.value;
    const med = medications.find((m) => m.id === id);

    setFormDataList((prev) => {
      const newList = [...prev];
      if (med) {
        newList[index] = {
          ...newList[index],
          medication: med.name,
          medicationId: med.id,
          category: med.category,
          dose: med.defaultDose || "",
          withdrawalMilk: med.withdrawalPeriodMilkDays || 0,
          withdrawalMeat: med.withdrawalPeriodMeatDays || 0,
        };
      } else {
        newList[index] = {
          ...newList[index],
          medicationId: "",
        };
      }
      return newList;
    });
  };

  const updateFormData = <K extends keyof TreatmentFormData>(
    index: number,
    field: K,
    value: TreatmentFormData[K],
  ) => {
    setFormDataList((prev) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  const addMedication = () => {
    setFormDataList((prev) => [...prev, createDefaultMed()]);
  };

  const removeMedication = (index: number) => {
    setFormDataList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentToEdit && !selectedCase) {
      toast.error("Please select a diagnosed animal first");
      return;
    }
    for (const item of formDataList) {
      if (!item.medication?.trim()) {
        toast.error("Medication name is required for all entries");
        return;
      }
    }

    if (!treatmentToEdit && selectedCase?.labResultRequired) {
      const isFulfilled = selectedCase.labResults?.some(
        (lr) => lr.status.toLowerCase() !== "pending" || (lr.documentUrls && lr.documentUrls.length > 0)
      );
      if (!isFulfilled) {
        toast.error("Cannot prescribe: Lab Report requirement is not fulfilled.");
        return;
      }
    }

    setSaving(true);
    try {
      if (treatmentToEdit) {
        const updatePayload = Object.fromEntries(
          Object.entries(formDataList[0]).filter(([_, v]) => v !== "")
        );
        await healthService.updateTreatment(
          treatmentToEdit.id,
          updatePayload,
        );
        toast.success("Treatment record updated");
      } else {
        await Promise.all(
          formDataList.map((item) => {
            const basePayload = {
              ...item,
              animalTag: selectedCase!.animalTag,
              healthRecordId: selectedCase!.id,
              condition: item.condition || selectedCase!.condition || "",
            };
            
            // Clean up empty strings for optional fields
            const payload = Object.fromEntries(
              Object.entries(basePayload).filter(([_, v]) => v !== "")
            );
            return healthService.createTreatment(
              payload as unknown as Parameters<
                typeof healthService.createTreatment
              >[0],
            );
          }),
        );
        toast.success("Prescription recorded and active course initiated");

        if (requireQuarantine && selectedCase) {
          try {
            const startDate = new Date();
            const expectedRelease = new Date();
            expectedRelease.setDate(startDate.getDate() + quarantineDays);
            
            await healthService.createQuarantine({
              animalTag: selectedCase.animalTag,
              zoneName: quarantineZone,
              reason: `Prescription Requirement: ${formDataList.map(f => f.medication).join(', ')}`,
              startDate: startDate.toISOString(),
              expectedRelease: expectedRelease.toISOString(),
            });
            toast.success("Animal added to Quarantine & Biosecurity");
          } catch (qErr) {
            console.error("Quarantine error:", qErr);
            toast.error("Prescription saved, but failed to create quarantine record.");
          }
        }
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      let errorMsg = "Failed to save treatment record.";
      if (err && typeof err === "object" && "response" in err) {
        const errObj = err as Record<string, unknown>;
        const responseData = (errObj.response as Record<string, unknown>)
          ?.data as Record<string, unknown>;
        if (responseData && typeof responseData.message === "string") {
          errorMsg = responseData.message;
        } else if (
          responseData?.message &&
          Array.isArray(responseData.message) &&
          responseData.message.length > 0
        ) {
          errorMsg = String(responseData.message[0]);
        }
      }
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Step 1: Select Diagnosed Animal (if not editing)
  if (!treatmentToEdit && !selectedCase) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#383838]">
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                Animals with Diagnoses
              </h2>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                Select an animal with an active diagnosis to proceed with
                treatment.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-[#5d5d5d] dark:text-[#b4b4b4]" />
            </button>
          </div>
          <div className="p-5 overflow-y-auto flex-1">
            {loadingCases ? (
              <p className="text-sm text-[#8e8e8e] text-center p-8">
                Loading diagnosed animals...
              </p>
            ) : cases.length === 0 ? (
              <p className="text-sm text-[#8e8e8e] text-center p-8">
                No animals with eligible diagnoses found.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#f9f9f9] dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#383838] p-4 rounded-xl flex flex-col gap-3 hover:border-[#10a37f]/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-[14px] text-[#0d0d0d] dark:text-white">
                        {c.animalTag} — {c.animalName}
                      </h3>
                      <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-0.5">
                        {c.farmName}
                      </p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-lg">
                      <p className="text-[12px] font-medium text-purple-700 dark:text-purple-300">
                        Diagnosis: {c.condition || "Unknown"}
                      </p>
                      <p className="text-[11px] text-purple-600/70 dark:text-purple-400/70 mt-1">
                        Diagnosed: {c.date?.split("T")[0]} · Status: {c.status}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="mt-auto w-full py-2 bg-white dark:bg-[#383838] border border-[#e5e5e5] dark:border-[#4d4d4d] text-[#0d0d0d] dark:text-white text-[13px] font-medium rounded-lg hover:bg-[#10a37f] hover:text-white hover:border-[#10a37f] transition-colors cursor-pointer"
                    >
                      Select / Treat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Prescription Form
  const displayTag = treatmentToEdit
    ? treatmentToEdit.animalTag
    : selectedCase?.animalTag;
  const displayDiagnosis = treatmentToEdit
    ? formDataList[0].condition
    : selectedCase?.condition || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#383838] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                {treatmentToEdit ? "Edit Treatment Record" : "Prescription"}
              </h2>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                {treatmentToEdit
                  ? "Modify the selected treatment prescription details"
                  : "Enter medications and dosages for the selected animal"}
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            {/* Selected Animal Info Banner */}
            <div className="bg-[#f4f4f4] dark:bg-[#252525] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#383838] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold text-[#8e8e8e] uppercase tracking-wider mb-1">
                  Selected Animal
                </p>
                <p className="text-[14px] font-semibold text-[#0d0d0d] dark:text-white">
                  {displayTag}
                </p>
                {!treatmentToEdit && selectedCase && (
                  <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                    {selectedCase.animalName}
                  </p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] font-bold text-[#8e8e8e] uppercase tracking-wider mb-1">
                  Diagnosis
                </p>
                <p className="text-[14px] font-medium text-purple-600 dark:text-purple-400">
                  {displayDiagnosis || "N/A"}
                </p>
              </div>
            </div>

            {/* Lab Report Requirement Block */}
            {!treatmentToEdit && selectedCase && (
              <div className="bg-sky-500/10 p-4 rounded-xl border border-sky-500/20 flex flex-col gap-3 relative">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-semibold text-[13px]">
                  <Stethoscope className="w-4 h-4" />
                  <span>{selectedCase.labResultRequired ? "Lab Report Required" : "Lab Report (Optional)"}</span>
                </div>
                {selectedCase.labResults && selectedCase.labResults.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCase.labResults.map(lr => (
                      <div key={lr.id} className="bg-white dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#383838] rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-[13px] text-[#0d0d0d] dark:text-white">{lr.testType}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${lr.status.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {lr.status.toUpperCase()}
                          </span>
                        </div>
                        {lr.result && <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">Result: {lr.result}</p>}
                        {lr.documentUrls && lr.documentUrls.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {lr.documentUrls.map((doc, idx) => (
                              <a key={idx} href={doc} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-sky-600 hover:underline bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded border border-sky-200 dark:border-sky-800">
                                View Document {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {!selectedCase.labResults.some(lr => lr.status.toLowerCase() !== 'pending' || (lr.documentUrls && lr.documentUrls.length > 0)) && (
                      <p className="text-[12px] text-sky-700 dark:text-sky-400 font-medium">Waiting for lab results to be uploaded...</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-[12px] text-sky-700 dark:text-sky-400 mb-3">
                      {selectedCase.labResultRequired ? "A lab report is required before prescribing medication for this diagnosis." : "You can request a lab report if additional diagnostics are needed before prescribing."}
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestLabReport}
                      disabled={isRequestingLab}
                      className="text-[12px] font-semibold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      {isRequestingLab ? "Requesting..." : "Request Lab Report"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Medications List */}
            {formDataList.map((formData, index) => (
              <div
                key={index}
                className="bg-[#fcfcfc] dark:bg-[#2a2a2a] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#4d4d4d] space-y-4 relative"
              >
                {formDataList.length > 1 && !treatmentToEdit && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-600 dark:hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                    Standard Medication Catalog
                  </label>
                  <select
                    value={formData.medicationId || ""}
                    onChange={(e) => handleMedSelect(index, e)}
                    className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                  >
                    <option value="">
                      -- Choose from Catalog or Type Custom --
                    </option>
                    {medications.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.category}) — Milk:{" "}
                        {m.withdrawalPeriodMilkDays}d, Meat:{" "}
                        {m.withdrawalPeriodMeatDays}d
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                      Medication Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Oxytetracycline 20% LA"
                      value={formData.medication}
                      onChange={(e) =>
                        updateFormData(index, "medication", e.target.value)
                      }
                      className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        updateFormData(index, "category", e.target.value)
                      }
                      className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                    >
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Anti-inflammatory (NSAID)">
                        Anti-inflammatory (NSAID)
                      </option>
                      <option value="Calcium Supplement">
                        Calcium Supplement
                      </option>
                      <option value="Vitamin / Tonic">Vitamin / Tonic</option>
                      <option value="Antiparasitic">Antiparasitic</option>
                      <option value="Antifungal">Antifungal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                      Dose & Route
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1 mL/10kg IM"
                      value={formData.dose}
                      onChange={(e) =>
                        updateFormData(index, "dose", e.target.value)
                      }
                      className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) =>
                        updateFormData(
                          index,
                          "duration",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                      <Ban className="w-3 h-3 text-red-500" />
                      Milk Withdrawal (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.withdrawalMilk}
                      onChange={(e) =>
                        updateFormData(
                          index,
                          "withdrawalMilk",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                      <Ban className="w-3 h-3 text-orange-500" />
                      Meat Withdrawal (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.withdrawalMeat}
                      onChange={(e) =>
                        updateFormData(
                          index,
                          "withdrawalMeat",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                    />
                  </div>
                </div>

                {formData.withdrawalMilk && formData.withdrawalMilk > 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-amber-800 dark:text-amber-300">
                      Milk withdrawal protocol: Milk will be flagged and
                      excluded from collection for {formData.withdrawalMilk}{" "}
                      days.
                    </p>
                  </div>
                ) : null}

                <div>
                  <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                    Treatment Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Treatment plan, follow-up schedule, special instructions…"
                    value={formData.notes}
                    onChange={(e) =>
                      updateFormData(index, "notes", e.target.value)
                    }
                    className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                    Rechecking / Follow-up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate || ""}
                    onChange={(e) =>
                      updateFormData(index, "followUpDate", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                  />
                </div>
              </div>
            ))}

            {!treatmentToEdit && (
              <button
                type="button"
                onClick={addMedication}
                className="w-full py-3 border border-dashed border-[#10a37f] text-[#10a37f] bg-[#10a37f]/5 hover:bg-[#10a37f]/10 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Medicine
              </button>
            )}

            {!treatmentToEdit && selectedCase && (
              <div className="mt-6 border-t border-[#e5e5e5] dark:border-[#383838] pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={requireQuarantine}
                    onChange={(e) => setRequireQuarantine(e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-[14px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    Quarantine Animal (Add to Biosecurity & Isolation)
                  </span>
                </label>

                {requireQuarantine && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-red-900 dark:text-red-200 mb-1.5">
                        Quarantine Zone / Pen
                      </label>
                      <input
                        type="text"
                        value={quarantineZone}
                        onChange={(e) => setQuarantineZone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-[13px] bg-white dark:bg-[#2f2f2f] border border-red-500/30 text-red-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-red-900 dark:text-red-200 mb-1.5">
                        Duration (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quarantineDays}
                        onChange={(e) => setQuarantineDays(parseInt(e.target.value) || 14)}
                        className="w-full px-3 py-2 rounded-lg text-[13px] bg-white dark:bg-[#2f2f2f] border border-red-500/30 text-red-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 p-5 border-t border-[#e5e5e5] dark:border-[#383838] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4] bg-[#f4f4f4] dark:bg-[#383838] rounded-xl hover:bg-[#ececec] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Treatments Page ──────────────────────────────────────────────
export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const [activeWithdrawals, setActiveWithdrawals] = useState<
    WithdrawalPeriodItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTimelineTag, setActiveTimelineTag] = useState<string | null>(
    null,
  );
  const [treatmentToEdit, setTreatmentToEdit] = useState<TreatmentItem | null>(
    null,
  );
  const [initialCaseId, setInitialCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const caseId = urlParams.get("caseId");
      if (caseId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInitialCaseId(caseId);
        setShowAdd(true);
      }
    }
  }, []);

  const loadTreatments = useCallback(async () => {
    setLoading(true);
    try {
      const [resTreatments, resWithdrawals] = await Promise.all([
        healthService.getTreatments({ search: search.trim() || undefined }),
        healthService.getActiveWithdrawals().catch(() => []),
      ]);
      setTreatments(resTreatments.data);
      setActiveWithdrawals(resWithdrawals);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to load treatments");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTreatments();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadTreatments]);

  const handleComplete = async (id: string) => {
    try {
      await healthService.completeTreatment(id);
      toast.success(
        "Treatment course completed. Note: Food safety withdrawal periods remain active if withholding duration has not elapsed.",
      );
      loadTreatments();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to complete treatment");
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white dark:bg-[#2f2f2f] p-5 md:p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/health"
            className="p-1.5 rounded-lg hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#5d5d5d] dark:text-[#b4b4b4]" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/health"
                className="text-[11px] text-[#8e8e8e] hover:text-[#10a37f] transition-colors flex items-center gap-1"
              >
                <HeartPulse className="w-3 h-3" /> Health
              </Link>
              <ChevronRight className="w-3 h-3 text-[#8e8e8e]" />
              <span className="text-[11px] font-semibold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Treatments
              </span>
            </div>
            <h1 className="text-lg font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
              Treatments, Prescriptions & Food Safety
            </h1>
            <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
              Active medication courses with strict milk and meat withdrawal
              period monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTreatments}
            className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setInitialCaseId(null);
              setTreatmentToEdit(null);
              setShowAdd(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Prescription</span>
          </button>
        </div>
      </div>

      {/* ── Active Food Safety Withholdings Banner ── */}
      {activeWithdrawals.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              Active Withholding Tracker ({activeWithdrawals.length} Animals in
              Mandatory Withdrawal)
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              Food safety protocol enforced
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {activeWithdrawals.map((w) => (
              <div
                key={w.id}
                className="bg-white dark:bg-[#252525] p-3 rounded-lg border border-amber-500/20 flex items-center justify-between"
              >
                <div>
                  <button
                    onClick={() => setActiveTimelineTag(w.animalTag)}
                    className="text-xs font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] underline decoration-dotted"
                  >
                    {w.animalTag}
                  </button>
                  <p className="text-[11px] text-[#777]">{w.treatmentName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    {w.productType}
                  </span>
                  <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                    {w.productType === "MILK"
                      ? `${w.hoursRemaining}h left`
                      : `${w.daysRemaining}d left`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
        <input
          type="text"
          placeholder="Search by tag, animal, medication, or condition…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="chatgpt-input w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px]"
        />
      </div>

      {/* Treatment Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8e8e8e]">
            Loading treatments…
          </div>
        ) : treatments.length > 0 ? (
          treatments.map((t) => {
            const progressPct = Math.min(
              100,
              Math.round((t.day / (t.duration || 1)) * 100),
            );

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-sm p-5 hover:border-[#10a37f]/40 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  {/* Left info */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
                    {/* Animal Photo & Status Badge */}
                    <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-xs border border-[#e5e5e5] dark:border-[#444]">
                      <AnimalPhoto
                        src={t.imageUrl}
                        animalNumber={t.animalTag}
                        species={t.species}
                        showBadge={false}
                        className="w-full h-full"
                      />
                      <div className="absolute -top-1 -right-1">
                        <div
                          className={`w-7 h-7 rounded-bl-lg rounded-tr-lg bg-purple-500/10 text-purple-600 flex items-center justify-center border-b border-l border-purple-500/20 shadow-xs backdrop-blur-sm bg-opacity-90`}
                          title="Treatment"
                        >
                          <Pill className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[15px] font-bold text-[#0d0d0d] dark:text-white">
                            {t.medication}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              categoryColors[t.category] ??
                              "bg-[#f4f4f4] text-[#5d5d5d] border-[#e5e5e5]"
                            }`}
                          >
                            {t.category}
                          </span>
                          {t.status === "completed" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Active (Day {t.day}/
                              {t.duration})
                            </span>
                          )}
                        </div>

                        <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4] font-medium mb-2">
                          <button
                            onClick={() => setActiveTimelineTag(t.animalTag)}
                            className="font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] transition-colors cursor-pointer"
                          >
                            #{t.animalTag}
                          </button>{" "}
                          — {t.animalName}{" "}
                          <span className="opacity-70">({t.breed})</span>
                          <span className="mx-2 opacity-30">•</span>
                          <span className="text-[12px] opacity-80">
                            {t.farmName}
                          </span>
                        </p>

                        {t.condition && (
                          <p className="text-[11px] text-[#8e8e8e] mt-1 font-medium flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#f4f4f4] dark:bg-[#383838] rounded-md border border-[#e5e5e5] dark:border-[#444]">
                              Condition: {t.condition}
                            </span>
                            <span className="px-2 py-0.5 bg-[#f4f4f4] dark:bg-[#383838] rounded-md border border-[#e5e5e5] dark:border-[#444]">
                              Dose: {t.dose}
                            </span>
                          </p>
                        )}

                        {/* Withdrawal Indicators */}
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {t.withdrawalMilk > 0 && (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                t.milkWithheld
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                  : "bg-[#f4f4f4] text-[#8e8e8e] border-[#e5e5e5]"
                              }`}
                            >
                              <Ban className="w-3 h-3 text-amber-600" />
                              Milk Withholding: {t.withdrawalMilk}d{" "}
                              {t.milkWithheld ? "(Active)" : "(Cleared)"}
                            </span>
                          )}
                          {t.withdrawalMeat > 0 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30 flex items-center gap-1">
                              <Ban className="w-3 h-3 text-orange-600" />
                              Meat Withholding: {t.withdrawalMeat}d
                            </span>
                          )}
                        </div>

                        {/* Course progress bar */}
                        {t.status === "active" && (
                          <div className="mt-3 w-full">
                            <div className="flex items-center justify-between text-[11px] text-[#8e8e8e] mb-1">
                              <span>Treatment Progress</span>
                              <span className="font-bold text-purple-600">
                                {progressPct}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-1 shrink-0 text-right min-w-32.5">
                    <span className="text-[13px] font-bold text-[#0d0d0d] dark:text-white flex items-center gap-1.5 justify-end">
                      <Stethoscope className="w-3.5 h-3.5 text-[#10a37f]" />
                      Dr. {t.prescribedBy}
                    </span>
                    <span className="text-[11px] font-medium text-[#8e8e8e] mt-1">
                      {t.startDate} → {t.endDate}
                    </span>

                    <div className="flex flex-col gap-2 mt-4 w-full">
                      <button
                        onClick={() => setActiveTimelineTag(t.animalTag)}
                        className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-[#10a37f] bg-[#10a37f]/10 hover:bg-[#10a37f]/20 rounded-lg transition-colors cursor-pointer border border-[#10a37f]/20"
                      >
                        Medical Timeline
                      </button>
                      <button
                        onClick={() => {
                          setTreatmentToEdit(t);
                          setShowAdd(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#10a37f] bg-[#10a37f]/10 hover:bg-[#10a37f]/20 border border-[#10a37f]/30 rounded-lg transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      {t.status === "active" && (
                        <button
                          onClick={() => handleComplete(t.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          Complete Course
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#2f2f2f] rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#8e8e8e] text-sm">
            No treatments found matching your criteria.
          </div>
        )}
      </div>

      {showAdd && (
        <NewTreatmentWorkflow
          treatmentToEdit={treatmentToEdit}
          initialCaseId={initialCaseId}
          onClose={() => {
            setShowAdd(false);
            setTreatmentToEdit(null);
            setInitialCaseId(null);
          }}
          onSuccess={() => {
            setShowAdd(false);
            setTreatmentToEdit(null);
            setInitialCaseId(null);
            loadTreatments();
          }}
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
