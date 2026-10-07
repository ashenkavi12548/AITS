"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ShieldAlert,
  HeartPulse,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  X,
  CheckCircle2,
  RefreshCw,
  Ban,
  Clock,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  healthService,
  QuarantineZoneItem,
  QuarantineRecordItem,
  CreateQuarantineInput,
  MovementRestrictionItem,
} from "@/services/health.service";
import AnimalTimelineModal from "@/components/health/AnimalTimelineModal";
import AnimalPhoto from "@/components/common/AnimalPhoto";
import { AnimalTagAutocomplete } from "@/components/common/AnimalTagAutocomplete";

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof AlertTriangle;
  }
> = {
  active: {
    label: "In Quarantine",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: ShieldAlert,
  },
  released: {
    label: "Released",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
};

// ─── Add Quarantine Modal ──────────────────────────────────────────────
function AddQuarantineModal({
  zones,
  records,
  onClose,
  onSuccess,
}: {
  zones: QuarantineZoneItem[];
  records: QuarantineRecordItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState(() => ({
    animalTag: "",
    startDate: new Date().toISOString().split("T")[0],
    reason: "FMD Suspected — blisters on hooves, excessive salivation",
    zoneName: zones[0]?.zone || "Zone A — Isolation Barn 1",
    expectedRelease: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    contactAnimals: "",
    govtRef: "",
    notes: "",
  }));
  const [saving, setSaving] = useState(false);
  const [contactSearchKey, setContactSearchKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animalTag.trim()) {
      toast.error("Animal is required");
      return;
    }

    const isAlreadyIsolated = records.some(
      (r) => r.animalTag === formData.animalTag.trim() && r.status === "active",
    );
    if (isAlreadyIsolated) {
      toast.error("This animal is already in isolation.");
      return;
    }

    if (new Date(formData.expectedRelease) <= new Date(formData.startDate)) {
      toast.error("Release date must be after the isolation start date.");
      return;
    }

    setSaving(true);
    try {
      const selectedZone = zones.find((z) => z.zone === formData.zoneName);
      const payload: CreateQuarantineInput = {
        animalTag: formData.animalTag.trim(),
        zoneId: selectedZone?.id,
        zoneName: formData.zoneName,
        reason: formData.reason,
        startDate: formData.startDate,
        expectedRelease: formData.expectedRelease,
        govtRef: formData.govtRef.trim() || undefined,
        contactAnimals: formData.contactAnimals
          ? formData.contactAnimals
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        notes: formData.notes.trim() || undefined,
      };

      await healthService.createQuarantine(payload);
      toast.success("Quarantine isolation order executed");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to issue quarantine. Verify animal tag.");
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
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                Initiate Quarantine Order
              </h2>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                Enforce biosecurity isolation and assign containment zone
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
                  Quarantine Zone <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.zoneName}
                  onChange={(e) =>
                    setFormData({ ...formData, zoneName: e.target.value })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                >
                  {zones.map((z, i) => (
                    <option key={i} value={z.zone}>
                      {z.zone} ({z.capacity - z.occupied} spaces left)
                    </option>
                  ))}
                  <option value="Zone C — Perimeter Isolation Pen">
                    Zone C — Perimeter Isolation Pen
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Isolation Reason & Suspected Disease{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Isolation Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] bg-gray-100 dark:bg-[#252525] cursor-not-allowed text-gray-500"
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Expected Release Date
                </label>
                <input
                  type="date"
                  value={formData.expectedRelease}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedRelease: e.target.value,
                    })
                  }
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Exposed / Contact Animal Tags
              </label>

              <div className="flex flex-wrap gap-2 mb-2">
                {formData.contactAnimals
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-md text-xs font-mono border border-red-200 dark:border-red-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = formData.contactAnimals
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                          newTags.splice(idx, 1);
                          setFormData({
                            ...formData,
                            contactAnimals: newTags.join(", "),
                          });
                        }}
                        className="hover:text-red-900 dark:hover:text-red-100 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              <AnimalTagAutocomplete
                key={`contact-search-${contactSearchKey}`}
                value=""
                placeholder="Search and select contact animals..."
                onSelect={(tag) => {
                  if (tag) {
                    const currentTags = formData.contactAnimals
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    if (!currentTags.includes(tag)) {
                      currentTags.push(tag);
                      setFormData({
                        ...formData,
                        contactAnimals: currentTags.join(", "),
                      });
                    }
                    setContactSearchKey((prev) => prev + 1);
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Government / Veterinary Order Ref
              </label>
              <input
                type="text"
                placeholder="e.g. DAPH-Q-2025-081"
                value={formData.govtRef}
                onChange={(e) =>
                  setFormData({ ...formData, govtRef: e.target.value })
                }
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Biosecurity Notes
              </label>
              <textarea
                rows={2}
                placeholder="Sanitation instructions, personal protective gear requirements…"
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
              className="px-4 py-2 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? "Issuing…" : "Issue Quarantine Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Verified Release Modal ─────────────────────────────────────────────
function ReleaseVerificationModal({
  record,
  onClose,
  onSuccess,
}: {
  record: QuarantineRecordItem | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [outcome, setOutcome] = useState(
    "Clinical signs resolved; holding period completed; laboratory clearance negative",
  );
  const [notes, setNotes] = useState("");
  const [releasing, setReleasing] = useState(false);

  if (!record) return null;

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setReleasing(true);
    try {
      await healthService.releaseQuarantine(record.id, {
        verificationOutcome: outcome,
        notes: notes.trim() || undefined,
      });
      toast.success(`Verified release granted for animal ${record.animalTag}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to verify quarantine release");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Veterinary Release Clearance
            </h3>
            <p className="text-xs text-[#777]">
              Animal: {record.animalTag} ({record.animalName})
            </p>
          </div>
        </div>

        <form onSubmit={handleRelease} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#555] dark:text-[#ccc] mb-1">
              Verification Outcome / Criteria Check
            </label>
            <input
              type="text"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="chatgpt-input w-full px-3 py-2 text-xs rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#555] dark:text-[#ccc] mb-1">
              Veterinary Release Sign-off Notes
            </label>
            <textarea
              rows={3}
              placeholder="Clinical exam confirmed afebrile, negative swabs, safe to reintegrate with active herd…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="chatgpt-input w-full px-3 py-2 text-xs rounded-lg resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e5e5e5] dark:border-[#383838]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f0f0f0] dark:bg-[#383838]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={releasing}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {releasing ? "Releasing…" : "Confirm Verified Release"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Extend Quarantine Modal ──────────────────────────────────────────────
function ExtendQuarantineModal({
  record,
  onClose,
  onSuccess,
}: {
  record: QuarantineRecordItem | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [expectedRelease, setExpectedRelease] = useState("");
  const [extending, setExtending] = useState(false);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedRelease) {
      toast.error("Please provide a new expected release date.");
      return;
    }
    const releaseDate = new Date(expectedRelease);
    const startDate = new Date(record.startDate);
    if (releaseDate <= startDate) {
      toast.error("New release date must be after the isolation start date.");
      return;
    }

    try {
      setExtending(true);
      await healthService.extendQuarantine(record.id, expectedRelease);
      toast.success("Quarantine extended successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(
        error.response?.data?.message || "Failed to extend quarantine",
      );
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#252525] w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#e5e5e5] dark:border-[#383838]">
        <div className="flex items-center gap-3 p-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              Extend Quarantine Period
            </h3>
            <p className="text-xs text-[#777]">
              Animal: {record.animalTag} ({record.animalName})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          <div>
            <label className="block text-xs font-semibold text-[#555] dark:text-[#ccc] mb-1">
              Current Isolation Start Date
            </label>
            <input
              type="date"
              value={record.startDate}
              className="chatgpt-input w-full px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-[#252525] cursor-not-allowed text-gray-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#555] dark:text-[#ccc] mb-1">
              New Expected Release Date
            </label>
            <input
              type="date"
              value={expectedRelease}
              onChange={(e) => setExpectedRelease(e.target.value)}
              className="chatgpt-input w-full px-3 py-2 text-xs rounded-lg"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e5e5e5] dark:border-[#383838]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f0f0f0] dark:bg-[#383838]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={extending}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              {extending ? "Extending…" : "Extend"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Quarantine Page ──────────────────────────────────────────────
export default function QuarantinePage() {
  const [zones, setZones] = useState<QuarantineZoneItem[]>([]);
  const [records, setRecords] = useState<QuarantineRecordItem[]>([]);
  const [restrictions, setRestrictions] = useState<MovementRestrictionItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "released"
  >("all");
  const [showAdd, setShowAdd] = useState(false);
  const [releaseTarget, setReleaseTarget] =
    useState<QuarantineRecordItem | null>(null);
  const [extendTarget, setExtendTarget] = useState<QuarantineRecordItem | null>(
    null,
  );
  const [activeTimelineTag, setActiveTimelineTag] = useState<string | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resQuarantine, resRestrictions] = await Promise.all([
        healthService.getQuarantineData(),
        healthService.getMovementRestrictions().catch(() => ({ data: [] })),
      ]);
      setZones(resQuarantine.zones);
      setRecords(resQuarantine.records);
      setRestrictions(resRestrictions.data || []);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to load quarantine data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [resQuarantine, resRestrictions] = await Promise.all([
          healthService.getQuarantineData(),
          healthService.getMovementRestrictions().catch(() => ({ data: [] })),
        ]);
        if (isMounted) {
          setZones(resQuarantine.zones);
          setRecords(resQuarantine.records);
          setRestrictions(resRestrictions.data || []);
        }
      } catch (err: unknown) {
        console.error(err);
        toast.error("Failed to load quarantine data");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLiftRestriction = (id: string) => {
    toast.custom(
      (t) => {
        let reason = "";
        return (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-[#2f2f2f] shadow-lg rounded-xl pointer-events-auto border border-[#e5e5e5] dark:border-[#383838] p-4 flex flex-col gap-3`}
          >
            <p className="text-sm font-medium text-[#0d0d0d] dark:text-white">
              Reason for lifting this restriction:
            </p>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Cleared by vet"
              className="px-3 py-2 text-sm rounded-md border border-[#e5e5e5] dark:border-[#383838] dark:bg-[#252525] dark:text-white outline-none focus:border-emerald-500"
              onChange={(e) => {
                reason = e.target.value;
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f0f0f0] dark:bg-[#383838] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] text-[#5d5d5d] dark:text-[#b4b4b4]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!reason.trim()) {
                    toast.error("Reason is required");
                    return;
                  }
                  toast.dismiss(t.id);
                  try {
                    await healthService.liftMovementRestriction(id, {
                      liftReason: reason,
                    });
                    toast.success("Movement restriction lifted successfully");
                    fetchData();
                  } catch (err: unknown) {
                    console.error(err);
                    toast.error("Failed to lift movement restriction");
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Lift Restriction
              </button>
            </div>
          </div>
        );
      },
      { duration: Infinity, id: `lift-confirm-${id}`, position: "top-center" },
    );
  };

  const handleDeleteQuarantine = (id: string) => {
    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-[#2f2f2f] shadow-lg rounded-xl pointer-events-auto border border-[#e5e5e5] dark:border-[#383838] p-4 flex flex-col gap-3`}
        >
          <p className="text-sm font-medium text-[#0d0d0d] dark:text-white">
            Are you sure you want to delete this quarantine record?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f0f0f0] dark:bg-[#383838] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] text-[#5d5d5d] dark:text-[#b4b4b4]"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await healthService.deleteQuarantine(id);
                  toast.success("Quarantine record deleted successfully");
                  fetchData();
                } catch (err: unknown) {
                  console.error(err);
                  toast.error("Failed to delete quarantine record");
                }
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        id: `delete-confirm-${id}`,
        position: "top-center",
      },
    );
  };

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
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20 outline-none ring-0">
            <ShieldAlert className="w-5 h-5" />
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
              <span className="text-[11px] font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 outline-none ring-0">
                Quarantine & Biosecurity
              </span>
            </div>
            <h1 className="text-lg font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
              Quarantine, Biosecurity & Movement Restrictions
            </h1>
            <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
              Active containment zones, contact tracing, and verified veterinary
              release clearances
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>New Quarantine Order</span>
          </button>
        </div>
      </div>

      {/* Zone Capacity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {zones.map((z, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#2f2f2f] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
                  {z.zone}
                </p>
                <p className="text-[11px] text-[#8e8e8e] mt-0.5">{z.disease}</p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${z.bg} ${z.color} ${z.border}`}
              >
                {z.occupied > 0 ? `${z.occupied} Isolated` : "Available"}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-[11px] text-[#8e8e8e]">
                <span>Occupancy</span>
                <span className="font-semibold text-[#0d0d0d] dark:text-white">
                  {z.occupied} / {z.capacity} (
                  {Math.round((z.occupied / (z.capacity || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#f0f0f0] dark:bg-[#383838] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    z.occupied >= z.capacity ? "bg-red-500" : "bg-orange-500"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((z.occupied / (z.capacity || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Movement Restrictions Strip */}
      {restrictions.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <Ban className="w-4 h-4" />
              Active Movement Restrictions ({restrictions.length} Animals
              Restricted from Sale/Transit)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {restrictions.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-[#252525] p-3 rounded-lg border border-red-500/20 flex items-center justify-between"
              >
                <div>
                  <button
                    onClick={() => setActiveTimelineTag(m.animalTag)}
                    className="text-xs font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] underline decoration-dotted"
                  >
                    {m.animalTag}
                  </button>
                  <p className="text-[11px] text-[#777]">{m.reason}</p>
                </div>
                <button
                  onClick={() => handleLiftRestriction(m.id)}
                  className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border border-emerald-500/30"
                >
                  Lift
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "active", "released"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer capitalize ${
              statusFilter === s
                ? "bg-red-600 text-white border-red-600"
                : "bg-white dark:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] border-[#e5e5e5] dark:border-[#383838] hover:border-red-500/40"
            }`}
          >
            {s === "all"
              ? "All Records"
              : s === "active"
                ? "Active Isolation"
                : "Released"}
          </button>
        ))}
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8e8e8e]">
            Loading quarantine records…
          </div>
        ) : filteredRecords.length > 0 ? (
          filteredRecords.map((r) => {
            const sc = statusConfig[r.status] || statusConfig.active;
            const ScIcon = sc.icon;

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
                          <ScIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[15px] font-bold text-[#0d0d0d] dark:text-white">
                            {r.zone}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}
                          >
                            {sc.label}
                          </span>
                          {r.govtRef && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f4f4f4] dark:bg-[#383838] text-[#5d5d5d] dark:text-[#b4b4b4] border border-[#e5e5e5] dark:border-[#444]">
                              Ref: {r.govtRef}
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

                        <p className="text-[12px] text-red-600 dark:text-red-400 mt-1 font-bold">
                          Reason: {r.reason}
                        </p>

                        {/* Contacts Traced */}
                        {r.contactAnimals && r.contactAnimals.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            <span className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                              Contacts:
                            </span>
                            {r.contactAnimals.map((tag, ti) => (
                              <button
                                key={ti}
                                onClick={() => setActiveTimelineTag(tag)}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono hover:underline cursor-pointer"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {r.notes && (
                        <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-3 leading-relaxed bg-[#f9f9f9] dark:bg-[#252525] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
                          {r.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right meta & actions */}
                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-1 shrink-0 text-right min-w-32.5">
                    <span className="text-[13px] font-bold text-[#0d0d0d] dark:text-white flex items-center gap-1.5 justify-end">
                      {r.orderedBy}
                    </span>
                    <span className="text-[11px] font-medium text-[#8e8e8e] mt-1">
                      {r.startDate} → {r.expectedRelease}
                    </span>

                    <div className="flex flex-col gap-2 mt-4 w-full">
                      <button
                        onClick={() => setActiveTimelineTag(r.animalTag)}
                        className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-[#10a37f] bg-[#10a37f]/10 hover:bg-[#10a37f]/20 rounded-lg transition-colors cursor-pointer border border-[#10a37f]/20"
                      >
                        Medical Timeline
                      </button>
                      {r.status === "active" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExtendTarget(r)}
                            className="flex-1 text-center px-2 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors cursor-pointer"
                          >
                            Extend
                          </button>
                          <button
                            onClick={() => setReleaseTarget(r)}
                            className="flex-1 text-center px-2 py-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                          >
                            Release
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteQuarantine(r.id)}
                        className="w-full justify-center px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#2f2f2f] rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#8e8e8e] text-sm">
            No quarantine records matching your filter.
          </div>
        )}
      </div>

      {showAdd && (
        <AddQuarantineModal
          zones={zones}
          records={records}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchData}
        />
      )}

      {releaseTarget && (
        <ReleaseVerificationModal
          record={releaseTarget}
          onClose={() => setReleaseTarget(null)}
          onSuccess={fetchData}
        />
      )}

      {extendTarget && (
        <ExtendQuarantineModal
          record={extendTarget}
          onClose={() => setExtendTarget(null)}
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
