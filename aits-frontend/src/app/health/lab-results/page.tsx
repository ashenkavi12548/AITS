"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  FlaskConical,
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
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  healthService,
  LabResultItem,
  CreateLabResultInput,
  LabCatalogItem,
} from "@/services/health.service";
import AnimalTimelineModal from "@/components/health/AnimalTimelineModal";
import AnimalPhoto from "@/components/common/AnimalPhoto";
import { AnimalTagAutocomplete } from "@/components/common/AnimalTagAutocomplete";
import animalsService from "@/services/animals.service";
import { useAuthStore } from "@/stores/useAuthStore";
import Image from "next/image";

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
  pending: {
    label: "Awaiting Results",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Clock,
  },
  positive: {
    label: "Positive",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: AlertTriangle,
  },
  negative: {
    label: "Negative",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  flagged: {
    label: "Flagged",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: AlertTriangle,
  },
};

// ─── Upload / Request Result Modal ─────────────────────────────────────
function UploadResultModal({
  onClose,
  onSuccess,
  initialAnimalTag,
  initialCaseId,
}: {
  onClose: () => void;
  onSuccess: () => void;
  initialAnimalTag?: string;
  initialCaseId?: string;
}) {
  const [catalogs, setCatalogs] = useState<LabCatalogItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [formData, setFormData] = useState<
    CreateLabResultInput & { documentUrlsText?: string }
  >({
    animalTag: initialAnimalTag || "",
    caseId: initialCaseId || undefined,
    sampleDate: new Date().toISOString().split("T")[0],
    testType: "PCR — Foot and Mouth Disease",
    laboratory: "National Veterinary Research Institute",
    status: "PENDING",
    resultText: "",
    isFlagged: false,
    notes: "",
    documentUrlsText: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const res = await animalsService.uploadPhoto(file);
        if (res.success) {
          urls.push(res.imageUrl);
        }
      }
      setUploadedUrls((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} lab sheet(s) uploaded successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload lab sheets.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    healthService
      .getLabCatalogs()
      .then((data) => {
        if (data && data.length > 0) {
          setCatalogs(data);
        } else {
          // Fallback catalogs if none are returned
          setCatalogs([
            {
              id: "cat-1",
              name: "PCR - Foot and Mouth Disease",
              category: "Virology",
              sampleType: "Blood/Serum",
              turnaroundHours: 48,
              targetDisease: "FMD",
              code: "PCR-FMD",
              normalRangeMin: null,
              normalRangeMax: null,
              unit: null,
            },
            {
              id: "cat-2",
              name: "BVD Antigen ELISA",
              category: "Immunology",
              sampleType: "Serum",
              turnaroundHours: 72,
              targetDisease: "BVD",
              code: "BVD-ELISA",
              normalRangeMin: null,
              normalRangeMax: null,
              unit: null,
            },
            {
              id: "cat-3",
              name: "Somatic Cell Count",
              category: "Milk Quality",
              sampleType: "Milk",
              turnaroundHours: 24,
              targetDisease: "Mastitis",
              code: "SCC",
              normalRangeMin: 0,
              normalRangeMax: 200000,
              unit: "cells/mL",
            },
            {
              id: "cat-4",
              name: "Brucellosis RBT",
              category: "Serology",
              sampleType: "Serum",
              turnaroundHours: 24,
              targetDisease: "Brucellosis",
              code: "BRU-RBT",
              normalRangeMin: null,
              normalRangeMax: null,
              unit: null,
            },
            {
              id: "cat-5",
              name: "Complete Blood Count (CBC)",
              category: "Hematology",
              sampleType: "Whole Blood",
              turnaroundHours: 12,
              targetDisease: null,
              code: "CBC",
              normalRangeMin: null,
              normalRangeMax: null,
              unit: null,
            },
          ]);
        }
      })
      .catch((err) => {
        console.error("Failed to load lab catalogs", err);
        setCatalogs([
          {
            id: "cat-1",
            name: "PCR - Foot and Mouth Disease",
            category: "Virology",
            sampleType: "Blood/Serum",
            turnaroundHours: 48,
            targetDisease: "FMD",
            code: "PCR-FMD",
            normalRangeMin: null,
            normalRangeMax: null,
            unit: null,
          },
          {
            id: "cat-2",
            name: "BVD Antigen ELISA",
            category: "Immunology",
            sampleType: "Serum",
            turnaroundHours: 72,
            targetDisease: "BVD",
            code: "BVD-ELISA",
            normalRangeMin: null,
            normalRangeMax: null,
            unit: null,
          },
          {
            id: "cat-3",
            name: "Somatic Cell Count",
            category: "Milk Quality",
            sampleType: "Milk",
            turnaroundHours: 24,
            targetDisease: "Mastitis",
            code: "SCC",
            normalRangeMin: 0,
            normalRangeMax: 200000,
            unit: "cells/mL",
          },
          {
            id: "cat-4",
            name: "Brucellosis RBT",
            category: "Serology",
            sampleType: "Serum",
            turnaroundHours: 24,
            targetDisease: "Brucellosis",
            code: "BRU-RBT",
            normalRangeMin: null,
            normalRangeMax: null,
            unit: null,
          },
          {
            id: "cat-5",
            name: "Complete Blood Count (CBC)",
            category: "Hematology",
            sampleType: "Whole Blood",
            turnaroundHours: 12,
            targetDisease: null,
            code: "CBC",
            normalRangeMin: null,
            normalRangeMax: null,
            unit: null,
          },
        ]);
      });
  }, []);

  const handleCatalogSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCatId(id);
    if (!id) return;

    const cat = catalogs.find((c) => c.id === id);
    if (cat) {
      setFormData((prev) => ({
        ...prev,
        testType: cat.name,
        catalogId: cat.id,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animalTag.trim()) {
      toast.error("Animal is required");
      return;
    }

    setSaving(true);
    try {
      const { documentUrlsText, ...restFormData } = formData;
      const parsedUrls = (documentUrlsText || "")
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
      const documentUrls = [...uploadedUrls, ...parsedUrls];

      await healthService.createLabResult({
        ...restFormData,
        documentUrls,
      });
      toast.success("Laboratory diagnostic record registered");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to register lab result. Please verify animal tag.");
    } finally {
      setSaving(false);
    }
  };

  const selectedCatalog = catalogs.find((c) => c.id === selectedCatId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center border border-teal-500/20">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                Register Laboratory Test Request / Result
              </h2>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                Link to diagnostic catalog and record findings
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <AnimalTagAutocomplete
                value={formData.animalTag || ""}
                onSelect={(tag) => setFormData({ ...formData, animalTag: tag })}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Sample Collection Date
              </label>
              <input
                type="date"
                value={formData.sampleDate}
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] opacity-70 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
                disabled
                required
              />
            </div>
          </div>

          {/* Master Catalog Selector */}
          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
              Standard Lab Test Catalog
            </label>
            <select
              value={selectedCatId}
              onChange={handleCatalogSelect}
              className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
            >
              <option value="">
                -- Select Test from Catalog or Type Custom Below --
              </option>
              {catalogs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.sampleType}) — {c.category}
                </option>
              ))}
            </select>
            {selectedCatalog && (
              <div className="mt-2 p-2.5 rounded-lg bg-[#f9f9f9] dark:bg-[#333] border border-[#e5e5e5] dark:border-[#444] text-[11px] flex items-center justify-between text-[#777] dark:text-[#ccc]">
                <span>
                  Sample Type:{" "}
                  <strong className="text-[#0d0d0d] dark:text-white">
                    {selectedCatalog.sampleType}
                  </strong>
                </span>
                {selectedCatalog.turnaroundHours && (
                  <span>Turnaround: ~{selectedCatalog.turnaroundHours}h</span>
                )}
                {selectedCatalog.targetDisease && (
                  <span className="font-bold text-[#10a37f]">
                    Target: {selectedCatalog.targetDisease}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Test / Assay Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.testType}
                onChange={(e) =>
                  setFormData({ ...formData, testType: e.target.value })
                }
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Diagnostic Laboratory <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Veterinary Research Institute, Gannoruwa"
                value={formData.laboratory}
                onChange={(e) =>
                  setFormData({ ...formData, laboratory: e.target.value })
                }
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Result Date (optional)
              </label>
              <input
                type="date"
                value={formData.resultDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, resultDate: e.target.value })
                }
                min={formData.sampleDate}
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Initial Result Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
              >
                <option value="PENDING">Awaiting Results (Pending)</option>
                <option value="NEGATIVE">Negative (Clear)</option>
                <option value="POSITIVE">Positive (Pathogen Detected)</option>
                <option value="FLAGGED">Flagged for Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
              Result Finding / Quantified Reading
            </label>
            <input
              type="text"
              placeholder="e.g. Antibody Titre: >1:256, Somatic Cell Count: 180,000 cells/mL"
              value={formData.resultText}
              onChange={(e) =>
                setFormData({ ...formData, resultText: e.target.value })
              }
              className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFlagged}
                onChange={(e) =>
                  setFormData({ ...formData, isFlagged: e.target.checked })
                }
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-[13px] font-medium text-red-600 dark:text-red-400">
                Flag this test result for urgent veterinary notification &
                biosecurity review
              </span>
            </label>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
              Clinical Notes
            </label>
            <textarea
              rows={2}
              placeholder="Sample condition, batch reference, special instructions…"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
              Lab Report Documents (Upload Lab Sheets)
            </label>
            <div className="flex flex-col gap-3">
              {uploadedUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg overflow-hidden border border-[#e5e5e5] dark:border-[#383838]"
                    >
                      <Image
                        src={url}
                        alt={`Uploaded sheet ${idx + 1}`}
                        className="w-16 h-16 object-cover"
                        fill
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedUrls((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 m-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#e5e5e5] dark:border-[#4d4d4d] bg-[#fcfcfc] dark:bg-[#2a2a2a] ${isUploading ? "opacity-50" : "hover:bg-[#f4f4f4] dark:hover:bg-[#333]"}`}
                >
                  <FileText className="w-4 h-4 text-[#5d5d5d]" />
                  <span className="text-[13px] font-medium text-[#0d0d0d] dark:text-white">
                    {isUploading
                      ? "Uploading to Cloudinary..."
                      : "Click to select or drag images here"}
                  </span>
                </div>
              </div>

              <textarea
                placeholder="Or paste external URLs here (One per line)&#10;https://company.lab/results/page1.png"
                value={formData.documentUrlsText}
                onChange={(e) =>
                  setFormData({ ...formData, documentUrlsText: e.target.value })
                }
                rows={2}
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e5e5] dark:border-[#383838]">
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
              {saving ? "Submitting…" : "Submit Test Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Result Modal ────────────────────────────────────────────────
function EditLabResultModal({
  result,
  onClose,
  onSuccess,
}: {
  result: LabResultItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    status: result.status.toUpperCase(),
    resultText: result.result || "",
    isFlagged: result.flagged,
    notes: result.notes || "",
    documentUrlsText: result.documentUrls
      ? result.documentUrls.join("\n")
      : result.documentUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const res = await animalsService.uploadPhoto(file);
        if (res.success) {
          urls.push(res.imageUrl);
        }
      }
      setUploadedUrls((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} lab sheet(s) uploaded successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload lab sheets.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { documentUrlsText, ...restFormData } = formData;
      const parsedUrls = (documentUrlsText || "")
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
      const documentUrls = [...uploadedUrls, ...parsedUrls];

      await healthService.updateLabResult(result.id, {
        ...restFormData,
        documentUrls,
      });
      toast.success("Lab result updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update lab result");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl w-full max-w-md shadow-2xl border border-[#e5e5e5] dark:border-[#383838] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-sky-500" />
            Edit Lab Result
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8e8e8e] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
              Result Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
            >
              <option value="PENDING">Awaiting Results (Pending)</option>
              <option value="NEGATIVE">Negative (Clear)</option>
              <option value="POSITIVE">Positive (Pathogen Detected)</option>
              <option value="FLAGGED">Flagged for Review</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
              Diagnostic Result / Findings
            </label>
            <textarea
              placeholder="e.g. Negative for FMDV by real-time RT-PCR"
              value={formData.resultText}
              onChange={(e) =>
                setFormData({ ...formData, resultText: e.target.value })
              }
              className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] h-20 resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-[13px] text-[#0d0d0d] dark:text-white cursor-pointer select-none mt-2">
              <input
                type="checkbox"
                checked={formData.isFlagged}
                onChange={(e) =>
                  setFormData({ ...formData, isFlagged: e.target.checked })
                }
                className="w-4 h-4 text-orange-500 bg-white border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
              />
              Flag for Veterinary Review
            </label>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5 mt-2">
              Additional Notes
            </label>
            <textarea
              placeholder="Any context regarding the sample..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] h-16 resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5 mt-2">
              Lab Report Documents (Upload Lab Sheets)
            </label>
            <div className="flex flex-col gap-3">
              {uploadedUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg overflow-hidden border border-[#e5e5e5] dark:border-[#383838]"
                    >
                      <Image
                        src={url}
                        alt={`Uploaded sheet ${idx + 1}`}
                        className="w-16 h-16 object-cover"
                        fill
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedUrls((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 m-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#e5e5e5] dark:border-[#4d4d4d] bg-[#fcfcfc] dark:bg-[#2a2a2a] ${isUploading ? "opacity-50" : "hover:bg-[#f4f4f4] dark:hover:bg-[#333]"}`}
                >
                  <FileText className="w-4 h-4 text-[#5d5d5d]" />
                  <span className="text-[13px] font-medium text-[#0d0d0d] dark:text-white">
                    {isUploading
                      ? "Uploading to Cloudinary..."
                      : "Click to select or drag images here"}
                  </span>
                </div>
              </div>

              <textarea
                placeholder="Or paste external URLs here (One per line)&#10;https://company.lab/results/page1.png"
                value={formData.documentUrlsText}
                onChange={(e) =>
                  setFormData({ ...formData, documentUrlsText: e.target.value })
                }
                rows={2}
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#e5e5e5] dark:border-[#383838] flex justify-end gap-2">
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
              className="px-4 py-2 text-[13px] font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabResultsContent() {
  const searchParams = useSearchParams();
  const hasPermissionOnFarm = useAuthStore(
    (state) => state.hasPermissionOnFarm,
  );
  const [labResults, setLabResults] = useState<LabResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(
    searchParams.get("openAdd") === "true",
  );
  const [initialAnimalTag, setInitialAnimalTag] = useState(
    searchParams.get("animalTag") || undefined,
  );
  const [initialCaseId, setInitialCaseId] = useState(
    searchParams.get("caseId") || undefined,
  );
  const [editingResult, setEditingResult] = useState<LabResultItem | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTimelineTag, setActiveTimelineTag] = useState<string | null>(
    null,
  );

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await healthService.getLabResults({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined,
      });
      setLabResults(res.data);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to load lab results");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchResults]);

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
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0 border border-teal-500/20">
            <FlaskConical className="w-5 h-5" />
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
              <span className="text-[11px] font-semibold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                Lab Results
              </span>
            </div>
            <h1 className="text-lg font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
              Laboratory Diagnostics & Screening Reports
            </h1>
            <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
              PCR assays, serological screening, somatic cell counts, and
              antimicrobial residue tests
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchResults}
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
            <span>Request Lab Test</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
          <input
            type="text"
            placeholder="Search by animal tag, test type, laboratory, or result…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="chatgpt-input w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "positive", "negative", "flagged"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer capitalize ${
                statusFilter === s
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white dark:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] border-[#e5e5e5] dark:border-[#383838] hover:border-teal-500/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Lab Results Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8e8e8e]">
            Loading lab diagnostic reports…
          </div>
        ) : labResults.length > 0 ? (
          labResults.map((r) => {
            const sc = statusConfig[r.status] || statusConfig.pending;
            const StatusIcon = sc.icon;

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-sm p-5 hover:border-[#10a37f]/40 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
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
                          <StatusIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[15px] font-bold text-[#0d0d0d] dark:text-white">
                            {r.testType}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}
                          >
                            {r.status.toLowerCase() === "pending"
                              ? "LAB REQUEST (PENDING)"
                              : sc.label}
                          </span>
                          {r.flagged && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Urgent Review
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
                            Lab: {r.lab}
                          </span>
                          <span className="px-2 py-0.5 bg-[#f4f4f4] dark:bg-[#383838] rounded-md border border-[#e5e5e5] dark:border-[#444]">
                            Sample: {r.sampleDate}
                          </span>
                          {r.resultDate && (
                            <span className="px-2 py-0.5 bg-[#f4f4f4] dark:bg-[#383838] rounded-md border border-[#e5e5e5] dark:border-[#444]">
                              Result: {r.resultDate}
                            </span>
                          )}
                        </p>

                        {r.result && (
                          <p className="text-[12px] font-mono font-medium text-[#0d0d0d] dark:text-white mt-3 bg-[#f9f9f9] dark:bg-[#252525] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
                            Result: {r.result}
                          </p>
                        )}

                        {r.notes && (
                          <p className="text-[11px] text-[#777] mt-2 italic px-1">
                            Notes: {r.notes}
                          </p>
                        )}

                        {r.documentUrls && r.documentUrls.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {r.documentUrls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] font-semibold text-[#10a37f] hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View Lab Report Document{" "}
                                {r.documentUrls!.length > 1
                                  ? `(${idx + 1})`
                                  : ""}
                              </a>
                            ))}
                          </div>
                        ) : (
                          r.documentUrl && (
                            <div className="mt-2">
                              <a
                                href={r.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] font-semibold text-[#10a37f] hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View Lab Report Document
                              </a>
                            </div>
                          )
                        )}
                        {r.healthRecordId && r.diagnosisName && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#0d0d0d] dark:text-white bg-sky-50/50 dark:bg-sky-950/30 p-2.5 rounded-lg border border-sky-100 dark:border-sky-900/50">
                            <span className="font-semibold text-sky-700 dark:text-sky-300">
                              Linked to Diagnosis:
                            </span>
                            <Link
                              href={`/health/diagnoses?search=${r.animalTag}`}
                              className="hover:underline font-bold"
                            >
                              {r.diagnosisName}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-1 shrink-0 text-right min-w-32.5">
                    <span className="text-[13px] font-bold text-[#0d0d0d] dark:text-white flex items-center gap-1.5 justify-end">
                      {r.requestedBy}
                    </span>

                    <div className="flex flex-col gap-2 mt-4 w-full">
                      <button
                        onClick={() => setActiveTimelineTag(r.animalTag)}
                        className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-[#10a37f] bg-[#10a37f]/10 hover:bg-[#10a37f]/20 rounded-lg transition-colors cursor-pointer border border-[#10a37f]/20"
                      >
                        Medical Timeline
                      </button>

                      {hasPermissionOnFarm("health:record") && (
                        <button
                          onClick={() => setEditingResult(r)}
                          className="w-full text-center px-3 py-1.5 text-[12px] font-semibold text-white bg-[#0d0d0d] dark:bg-white dark:text-[#0d0d0d] hover:bg-[#262626] dark:hover:bg-[#e5e5e5] rounded-lg transition-colors cursor-pointer"
                        >
                          Edit Result
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
            No laboratory diagnostic reports found.
          </div>
        )}
      </div>

      {showAdd && (
        <UploadResultModal
          onClose={() => {
            setShowAdd(false);
            setInitialAnimalTag(undefined);
            setInitialCaseId(undefined);
          }}
          onSuccess={fetchResults}
          initialAnimalTag={initialAnimalTag}
          initialCaseId={initialCaseId}
        />
      )}

      {editingResult && (
        <EditLabResultModal
          result={editingResult}
          onClose={() => setEditingResult(null)}
          onSuccess={fetchResults}
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

// ─── Main Lab Results Page ─────────────────────────────────────────────
export default function LabResultsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <LabResultsContent />
    </Suspense>
  );
}
