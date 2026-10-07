"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Syringe,
  HeartPulse,
  Plus,
  Search,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  healthService,
  VaccinationRecordItem,
  VaccineProgramItem,
  VaccineProgramMaster,
  CreateVaccinationInput,
} from "@/services/health.service";
import AnimalTimelineModal from "@/components/health/AnimalTimelineModal";
import AnimalPhoto from "@/components/common/AnimalPhoto";
import { AnimalTagAutocomplete } from "@/components/common/AnimalTagAutocomplete";
import { EditVaccinationModal } from "./components/EditVaccinationModal";

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof CheckCircle2;
  }
> = {
  up_to_date: {
    label: "Up to Date",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  due_soon: {
    label: "Due Soon",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Clock,
  },
  overdue: {
    label: "Overdue",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: AlertTriangle,
  },
};

// ─── Add Vaccination Modal ─────────────────────────────────────────────
function AddVaccinationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [programs, setPrograms] = useState<VaccineProgramMaster[]>([]);
  const [selectedProgId, setSelectedProgId] = useState("");
  const [formData, setFormData] = useState<CreateVaccinationInput>(() => ({
    animalTag: "",
    vaccineName: "Foot and Mouth Disease (FMD) Trivalent Vaccine",
    dose: "2 mL IM",
    vaccinationDate: new Date().toISOString().split("T")[0],
    nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    noNextDose: false,
    batchNumber: "",
    notes: "",
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    healthService
      .getVaccinationProgramMasters()
      .then((data) => setPrograms(data))
      .catch((err) => console.error("Failed to load vaccine programs", err));
  }, []);

  const handleProgramSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProgId(id);
    if (!id) return;

    const prog = programs.find((p) => p.id === id);
    if (prog) {
      const nextDue = prog.boosterIntervalDays
        ? new Date(Date.now() + prog.boosterIntervalDays * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : "";

      setFormData((prev) => ({
        ...prev,
        vaccineName: prog.name,
        programId: prog.id,
        nextDueDate: nextDue,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animalTag.trim()) {
      toast.error("Animal is required");
      return;
    }
    if (!formData.vaccineName.trim()) {
      toast.error("Vaccine name is required");
      return;
    }

    setSaving(true);
    try {
      const { noNextDose, programId, ...payloadData } = formData;
      const payload: Partial<CreateVaccinationInput> = { ...payloadData };

      if (!payload.nextDueDate) delete payload.nextDueDate;
      else payload.nextDueDate = new Date(payload.nextDueDate).toISOString();

      if (!payload.batchNumber) delete payload.batchNumber;
      if (!payload.notes) delete payload.notes;

      if (payload.vaccinationDate) {
        payload.vaccinationDate = new Date(
          payload.vaccinationDate,
        ).toISOString();
      }

      await healthService.createVaccination(payload as CreateVaccinationInput);
      toast.success("Vaccination record logged successfully");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const errResponse = (
        err as { response?: { status?: number; data?: { message?: string } } }
      ).response;

      if (errResponse?.status === 409) {
        toast.error(
          errResponse.data?.message ||
            "This animal already has this vaccination recorded for today.",
        );
      } else {
        toast.error("Failed to log vaccination. Please check animal tag.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                Administer & Record Vaccination
              </h2>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                Link to standard vaccination program and calculate booster due
                date
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
                  Vaccination Date
                </label>
                <input
                  type="date"
                  value={formData.vaccinationDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vaccinationDate: e.target.value,
                    })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                  required
                />
              </div>
            </div>

            {/* Standard Vaccine Program Selector */}
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Standard Vaccination Program
              </label>
              <select
                value={selectedProgId}
                onChange={handleProgramSelect}
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
              >
                <option value="">
                  -- Choose Program (Auto-fills Vaccine & Booster) --
                </option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.targetDisease}){" "}
                    {p.mandatory ? "★ Mandatory" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Vaccine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vaccineName}
                  onChange={(e) =>
                    setFormData({ ...formData, vaccineName: e.target.value })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Dose & Route
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 mL IM"
                  value={formData.dose}
                  onChange={(e) =>
                    setFormData({ ...formData, dose: e.target.value })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Batch / Lot Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. FMD-2025-B44"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white">
                    Next Booster Due Date
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#5d5d5d] dark:text-[#b4b4b4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.noNextDose}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({
                          ...formData,
                          noNextDose: checked,
                          nextDueDate: checked ? "" : formData.nextDueDate,
                        });
                      }}
                      className="rounded border-[#e5e5e5] dark:border-[#383838] text-[#10a37f] focus:ring-[#10a37f]"
                    />
                    No Next Dose
                  </label>
                </div>
                <input
                  type="date"
                  value={formData.nextDueDate || ""}
                  disabled={formData.noNextDose}
                  onChange={(e) =>
                    setFormData({ ...formData, nextDueDate: e.target.value })
                  }
                  className={`chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] ${formData.noNextDose ? "opacity-50 cursor-not-allowed bg-[#f4f4f4] dark:bg-[#383838]" : ""}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Clinical Notes / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Manufacturer, site of injection, adverse observation…"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-5 border-t border-[#e5e5e5] dark:border-[#383838]">
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
              {saving ? "Recording…" : "Record Vaccination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Vaccinations Page ────────────────────────────────────────────
export default function VaccinationsPage() {
  const [programs, setPrograms] = useState<VaccineProgramItem[]>([]);
  const [records, setRecords] = useState<VaccinationRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTimelineTag, setActiveTimelineTag] = useState<string | null>(
    null,
  );
  const [editingRecord, setEditingRecord] =
    useState<VaccinationRecordItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [progRes, recRes] = await Promise.all([
        healthService.getVaccinePrograms(),
        healthService.getVaccinations({
          search: search.trim() || undefined,
        }),
      ]);
      setPrograms(progRes);
      setRecords(recRes.data);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to load vaccination data");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const filteredRecords = records.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

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
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/20">
            <Syringe className="w-5 h-5" />
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
              <span className="text-[11px] font-semibold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                Vaccinations
              </span>
            </div>
            <h1 className="text-lg font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
              Vaccination Programs & Herd Immunity Coverage
            </h1>
            <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
              Scheduled immunizations, batch tracking, and booster reminders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
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
            <span>Record Vaccination</span>
          </button>
        </div>
      </div>

      {/* Program Coverage Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {programs.map((p, i) => {
          const pct = Math.round((p.covered / (p.total || 1)) * 100);
          return (
            <div
              key={i}
              className="bg-white dark:bg-[#2f2f2f] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${p.light} ${p.text} border ${p.border}`}
                  >
                    {p.abbr}
                  </span>
                  <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white mt-2 leading-tight">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-[#8e8e8e]">{p.interval}</p>
                </div>
                <span className="text-base font-extrabold text-[#0d0d0d] dark:text-white">
                  {pct}%
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-[#8e8e8e] mb-1">
                  <span>Coverage</span>
                  <span className="font-semibold text-[#0d0d0d] dark:text-white">
                    {p.covered} / {p.total}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${p.color} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
          <input
            type="text"
            placeholder="Search by animal tag, vaccine, batch, or vet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="chatgpt-input w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px]"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "up_to_date", "due_soon", "overdue"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer capitalize ${
                statusFilter === s
                  ? "bg-[#10a37f] text-white border-[#10a37f]"
                  : "bg-white dark:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f]/40"
              }`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Vaccination Records */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8e8e8e]">
            Loading vaccination logs…
          </div>
        ) : filteredRecords.length > 0 ? (
          filteredRecords.map((r) => {
            const sc = statusConfig[r.status] || statusConfig.up_to_date;

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-sm p-5 hover:border-[#10a37f]/40 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  {/* Left info */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
                    {/* Animal Photo & Status Badge */}
                    <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-xs border border-[#e5e5e5] dark:border-[#444]">
                      <AnimalPhoto
                        src={r.imageUrl}
                        animalNumber={r.animalTag}
                        species={r.species}
                        showBadge={false}
                        className="w-full h-full"
                      />
                      <div className="absolute -top-1 -right-1">
                        <div
                          className={`w-7 h-7 rounded-bl-lg rounded-tr-lg ${sc.bg} ${sc.color} flex items-center justify-center border-b border-l ${sc.border} shadow-xs backdrop-blur-sm bg-opacity-90`}
                          title={`Status: ${sc.label}`}
                        >
                          <Syringe className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[15px] font-bold text-[#0d0d0d] dark:text-white">
                            {r.vaccine}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}
                          >
                            {sc.label}
                          </span>
                          {r.batchNo && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f4f4f4] dark:bg-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] border border-[#e5e5e5] dark:border-[#444]">
                              Batch: {r.batchNo}
                            </span>
                          )}
                        </div>

                        <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4] font-medium mb-2">
                          <button
                            onClick={() => setActiveTimelineTag(r.animalTag)}
                            className="font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] transition-colors cursor-pointer"
                          >
                            #{r.animalTag}
                          </button>{" "}
                          — {r.animalName}{" "}
                          <span className="opacity-70">({r.breed})</span>
                          <span className="mx-2 opacity-30">•</span>
                          <span className="text-[12px] opacity-80">
                            {r.farmName}
                          </span>
                        </p>

                        <p className="text-[11px] text-[#8e8e8e] mt-1 font-medium flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#f4f4f4] dark:bg-[#383838] rounded-md border border-[#e5e5e5] dark:border-[#444]">
                            Dose: {r.dose}
                          </span>
                          <span className="px-2 py-0.5 bg-[#f4f4f4] dark:bg-[#383838] rounded-md border border-[#e5e5e5] dark:border-[#444]">
                            Vaccinated: {r.date}
                          </span>
                          {r.nextDue && (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              · Next Booster: {r.nextDue}
                            </span>
                          )}
                        </p>
                      </div>

                      {r.notes && (
                        <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-3 bg-[#f9f9f9] dark:bg-[#252525] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#383838] leading-relaxed">
                          {r.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right meta & actions */}
                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-1 shrink-0 text-right min-w-30">
                    <span className="text-[13px] font-bold text-[#0d0d0d] dark:text-white flex items-center gap-1.5 justify-end">
                      <Stethoscope className="w-3.5 h-3.5 text-[#10a37f]" />
                      Dr. {r.vet}
                    </span>

                    <div className="flex flex-col gap-2 mt-4 w-full">
                      <button
                        onClick={() => setActiveTimelineTag(r.animalTag)}
                        className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-[#10a37f] bg-[#10a37f]/10 hover:bg-[#10a37f]/20 rounded-lg transition-colors cursor-pointer border border-[#10a37f]/20"
                      >
                        Medical Timeline
                      </button>
                      <button
                        onClick={() => setEditingRecord(r)}
                        className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-white bg-[#0d0d0d] dark:bg-white dark:text-[#0d0d0d] hover:bg-[#262626] dark:hover:bg-[#e5e5e5] rounded-lg transition-colors cursor-pointer"
                      >
                        Edit Record
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#2f2f2f] rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#8e8e8e] text-sm">
            No vaccination logs found matching your filter.
          </div>
        )}
      </div>

      {showAdd && (
        <AddVaccinationModal
          onClose={() => setShowAdd(false)}
          onSuccess={fetchData}
        />
      )}

      {editingRecord && (
        <EditVaccinationModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={fetchData}
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
