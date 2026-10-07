"use client";

import { IssueClearanceModal } from "@/components/health/IssueClearanceModal";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  FileCheck2,
  HeartPulse,
  Plus,
  Search,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Download,
  Eye,
  Stamp,
  ShieldCheck,
  Check,
  RefreshCw,
  Ban,
  FileEdit,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  healthService,
  HealthClearanceItem,
} from "@/services/health.service";
import AnimalTimelineModal from "@/components/health/AnimalTimelineModal";

const statusConfig = {
  approved: {
    label: "Approved",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending Approval",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Clock,
  },
  expired: {
    label: "Expired",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: AlertTriangle,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: AlertTriangle,
  },
  revoked: {
    label: "Revoked",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: Ban,
  },
};

// ─── Certificate View Modal ─────────────────────────────────────────────
function CertificateModal({
  clearance,
  onClose,
}: {
  clearance: HealthClearanceItem;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:m-0 print:bg-white print:z-99999"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#222] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:border-none print:max-w-none print:w-[210mm] print:h-auto print:max-h-none print:overflow-visible print:rounded-none">
        {/* Certificate Header Banner */}
        <div className="bg-linear-to-r from-[#10a37f]/15 via-emerald-500/10 to-teal-500/15 p-6 border-b border-[#e5e5e5] dark:border-[#383838] relative print:border-b-2">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer print:hidden"
          >
            <X className="w-4 h-4 text-[#5d5d5d] dark:text-[#b4b4b4]" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Logo Placeholder */}
            <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-2 border-emerald-500/20 shadow-sm flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-[#10a37f]">
                AITS
              </span>
            </div>

            <div className="text-center sm:text-left flex-1">
              <p className="text-[11px] sm:text-[13px] font-bold text-[#10a37f] uppercase tracking-widest">
                Department of Animal Production & Health
              </p>
              <h2 className="text-lg sm:text-xl font-black text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
                Veterinary Health & Movement Clearance Certificate
              </h2>
              <div className="inline-block mt-2 px-3 py-1 bg-white dark:bg-[#333] rounded-md border border-[#e5e5e5] dark:border-[#444]">
                <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                  Permit No:{" "}
                  <span className="font-mono font-bold text-[#0d0d0d] dark:text-white">
                    {clearance.permitNo}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-6 print:space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#f9f9f9] dark:bg-[#2a2a2a] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
              <p className="text-[12px] font-bold text-[#8e8e8e] uppercase tracking-wider mb-3 border-b border-[#e5e5e5] pb-2">
                Animal Identification
              </p>
              <div className="space-y-2 text-[13px] print:text-[14px]">
                <p className="flex justify-between">
                  <span className="text-[#5d5d5d]">Tag ID:</span>
                  <span className="font-bold text-[#0d0d0d] dark:text-white">
                    {clearance.animalTag}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[#5d5d5d]">Name:</span>
                  <span className="font-medium">{clearance.animalName}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[#5d5d5d]">Breed:</span>
                  <span className="font-medium">{clearance.breed}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[#5d5d5d]">Origin Farm:</span>
                  <span className="font-medium">{clearance.farmName}</span>
                </p>
              </div>
            </div>

            <div className="bg-[#f9f9f9] dark:bg-[#2a2a2a] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
              <p className="text-[12px] font-bold text-[#8e8e8e] uppercase tracking-wider mb-3 border-b border-[#e5e5e5] pb-2">
                Clearance Details
              </p>
              <div className="space-y-2 text-[13px] print:text-[14px]">
                <p className="flex justify-between">
                  <span className="text-[#5d5d5d]">Purpose:</span>
                  <span className="font-medium">{clearance.purpose}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[#5d5d5d]">Destination:</span>
                  <span className="font-medium">{clearance.destination}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[#5d5d5d]">Valid Until:</span>
                  <span className="font-bold text-emerald-600">
                    {clearance.validUntil}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[#5d5d5d]">Status:</span>
                  <span className="font-bold uppercase">
                    {clearance.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[13px] print:text-[14px] space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold border-b border-emerald-500/20 pb-2">
              <ShieldCheck className="w-5 h-5 print:hidden" />
              <span>Veterinary Certification Statement</span>
            </div>
            <p className="text-[#4a4a4a] dark:text-[#ccc] leading-relaxed font-medium">
              {clearance.conditions ||
                "I hereby certify that the animal designated above has undergone official clinical examination, shows no symptoms of contagious or infectious diseases, is free from quarantine restrictions, and satisfies all statutory withdrawal periods."}
            </p>
          </div>

          <div className="flex flex-row justify-between items-end pt-8 print:pt-16 text-[12px] print:text-[13px]">
            <div className="space-y-1">
              <p className="text-[#8e8e8e] font-medium">
                Authorized Veterinarian:
              </p>
              <p className="font-bold text-[#0d0d0d] dark:text-white text-[14px]">
                {clearance.issuedBy}
              </p>
              <p className="text-[#8e8e8e]">
                Approved by: {clearance.approvedBy}
              </p>
            </div>

            {/* Physical Signature Space */}
            <div className="text-center pb-2">
              <div className="w-40 border-b-2 border-[#0d0d0d] dark:border-white print:border-[#0d0d0d] mb-2 mx-auto"></div>
              <p className="text-[11px] print:text-[12px] font-bold uppercase text-[#8e8e8e]">
                Physical Signature
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-16 border-2 border-dashed border-[#10a37f]/40 rounded-lg mb-2 flex items-center justify-center mx-auto">
                <Stamp className="w-8 h-8 text-[#10a37f] opacity-60 print:opacity-100" />
              </div>
              <p className="text-[10px] print:text-[12px] font-bold uppercase text-[#8e8e8e]">
                Official Digital Seal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 bg-[#f9f9f9] dark:bg-[#252525] border-t border-[#e5e5e5] dark:border-[#383838] print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Print Official Permit</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Revoke Clearance Modal ─────────────────────────────────────────────
function RevokeClearanceModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#212121] rounded-2xl border border-[#e5e5e5] dark:border-[#303030] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        <div className="p-4 md:p-5 border-b border-[#e5e5e5] dark:border-[#303030] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Revoke Clearance Certificate
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Please specify the reason for revoking
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#737373] hover:bg-[#ececec] dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="p-4 md:p-5 space-y-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for revocation..."
            className="w-full p-3 bg-[#f9f9f9] dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-sm focus:outline-none focus:border-red-500 min-h-25"
            autoFocus
          />
        </div>
        <div className="p-4 border-t border-[#e5e5e5] dark:border-[#303030] flex items-center justify-end gap-3 bg-[#f9f9f9] dark:bg-[#252525]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-[#737373] hover:bg-[#ececec] dark:hover:bg-[#2d2d2d] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (reason.trim()) {
                onConfirm(reason.trim());
                setReason("");
              } else {
                toast.error("Reason is required");
              }
            }}
            disabled={!reason.trim()}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Issue Clearance Modal with Eligibility Check ───────────────────────
export default function ClearancesPage() {
  const [clearances, setClearances] = useState<HealthClearanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingClearance, setEditingClearance] =
    useState<HealthClearanceItem | null>(null);
  const [selectedCertificate, setSelectedCertificate] =
    useState<HealthClearanceItem | null>(null);
  const [activeTimelineTag, setActiveTimelineTag] = useState<string | null>(
    null,
  );

  const fetchClearances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await healthService.getClearances({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setClearances(res.data);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to load clearances");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClearances();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchClearances]);

  const handleApprove = async (id: string) => {
    try {
      await healthService.approveClearance(id);
      toast.success("Clearance permit approved by authorized veterinarian");
      fetchClearances();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to approve clearance");
    }
  };

  const [revokingClearanceId, setRevokingClearanceId] = useState<string | null>(
    null,
  );

  const handleRevoke = async (id: string) => {
    setRevokingClearanceId(id);
  };

  const confirmRevoke = async (reason: string) => {
    if (!revokingClearanceId) return;
    const id = revokingClearanceId;

    try {
      await healthService.revokeClearance(id, reason);
      toast.success("Health clearance certificate revoked immediately");
      fetchClearances();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to revoke clearance");
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
          <div className="w-10 h-10 rounded-xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-[#10a37f]/20">
            <FileCheck2 className="w-5 h-5" />
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
              <span className="text-[11px] font-semibold text-[#10a37f] bg-[#10a37f]/10 px-2 py-0.5 rounded-full border border-[#10a37f]/20">
                Clearances
              </span>
            </div>
            <h1 className="text-lg font-semibold text-[#0d0d0d] dark:text-white tracking-tight mt-0.5">
              Veterinary Health Clearance Certificates
            </h1>
            <p className="text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
              Transit permits, commercial slaughter clearance, and biosecure
              trade certificates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchClearances}
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
            <span>Issue Clearance</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
          <input
            type="text"
            placeholder="Search by permit no, animal tag, destination, or purpose…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="chatgpt-input w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "approved", "pending", "expired", "revoked"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer capitalize ${
                statusFilter === s
                  ? "bg-[#10a37f] text-white border-[#10a37f]"
                  : "bg-white dark:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f]/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Certificates Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8e8e8e]">
            Loading clearance certificates…
          </div>
        ) : clearances.length > 0 ? (
          clearances.map((c) => {
            const sc =
              statusConfig[c.status as keyof typeof statusConfig] ||
              statusConfig.pending;
            const StatusIcon = sc.icon;

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-[#2f2f2f] rounded-xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs p-4 hover:border-[#10a37f]/30 hover:shadow-sm transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center shrink-0 border border-[#10a37f]/20 mt-0.5">
                      <Stamp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white font-mono">
                          {c.permitNo}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                        <span className="text-[11px] text-[#8e8e8e]">
                          {c.purpose}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                        Animal:{" "}
                        <button
                          onClick={() => setActiveTimelineTag(c.animalTag)}
                          className="font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] underline decoration-dotted cursor-pointer"
                        >
                          {c.animalTag}
                        </button>{" "}
                        ({c.animalName} · {c.breed}) → Destination:{" "}
                        <span className="font-medium text-[#0d0d0d] dark:text-white">
                          {c.destination}
                        </span>
                      </p>
                      <p className="text-[11px] text-[#8e8e8e] mt-0.5">
                        Issued by: {c.issuedBy} · {c.issuedDate} → Valid until:{" "}
                        {c.validUntil}
                      </p>
                      {c.conditions && (
                        <p className="text-[11px] text-[#5d5d5d] dark:text-[#b4b4b4] mt-2 bg-[#f9f9f9] dark:bg-[#252525] p-2 rounded-lg border border-[#e5e5e5] dark:border-[#383838] line-clamp-2">
                          {c.conditions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 shrink-0 text-right">
                    <button
                      onClick={() => setSelectedCertificate(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#383838] text-[12px] font-semibold text-[#0d0d0d] dark:text-white hover:border-[#10a37f] hover:text-[#10a37f] transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Certificate</span>
                    </button>

                    <button
                      onClick={() => setActiveTimelineTag(c.animalTag)}
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Medical Timeline &rarr;
                    </button>

                    {c.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingClearance(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20 text-[12px] font-semibold transition-all cursor-pointer"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 text-[12px] font-semibold transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Permit</span>
                        </button>
                      </div>
                    )}

                    {(c.status === "approved" || c.status === "pending") && (
                      <button
                        onClick={() => handleRevoke(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#2f2f2f] rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#8e8e8e] text-sm">
            No health clearance certificates found.
          </div>
        )}
      </div>

      {(showAdd || editingClearance) && (
        <IssueClearanceModal
          editItem={editingClearance}
          onClose={() => {
            setShowAdd(false);
            setEditingClearance(null);
          }}
          onSuccess={fetchClearances}
        />
      )}

      {selectedCertificate && (
        <CertificateModal
          clearance={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      <RevokeClearanceModal
        isOpen={Boolean(revokingClearanceId)}
        onClose={() => setRevokingClearanceId(null)}
        onConfirm={(reason) => {
          confirmRevoke(reason).then(() => setRevokingClearanceId(null));
        }}
      />

      {/* Animal Medical Timeline Modal */}
      <AnimalTimelineModal
        animalTag={activeTimelineTag}
        isOpen={Boolean(activeTimelineTag)}
        onClose={() => setActiveTimelineTag(null)}
      />
    </DashboardLayout>
  );
}
