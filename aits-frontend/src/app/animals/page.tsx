"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  QrCode,
  Grid,
  List,
  X,
  PawPrint,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  Trash2,
} from "lucide-react";
import {
  animalsService,
  AnimalItem,
  AnimalQueryParams,
} from "@/services/animals.service";
import { useAuthStore } from "@/stores/useAuthStore";
import type { HerdStatsResponse } from "@/types/animals";
import EarTagBadgeModal from "@/components/animals/EarTagBadgeModal";
import { HerdStatsCards } from "@/features/animals/HerdStatsCards";
import { AnimalListTable } from "@/features/animals/AnimalListTable";
import { AnimalListGrid } from "@/features/animals/AnimalListGrid";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  downloadBatchEarTagsA4Pdf,
  printBatchEarTagsA4,
  type EarTagBadgeData,
} from "@/utils/earTagBadgeGenerator";

export default function AnimalsPage() {
  const hasPermissionOnFarm = useAuthStore(
    (state) => state.hasPermissionOnFarm,
  );
  const canCreateAnimal = hasPermissionOnFarm("animal:create");

  // Data states
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [stats, setStats] = useState<HerdStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter parameters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBreed, setSelectedBreed] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSpecies] = useState("");
  const [sortBy, setSortBy] =
    useState<AnimalQueryParams["sortBy"]>("createdAt");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals & Batch Actions
  const [badgeModalData, setBadgeModalData] = useState<EarTagBadgeData | null>(
    null,
  );
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportingBatch, setIsExportingBatch] = useState(false);
  const [archiveModalAnimal, setArchiveModalAnimal] =
    useState<AnimalItem | null>(null);
  const [isArchiveSubmitting, setIsArchiveSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Load live herd statistics
  const loadStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const res = await animalsService.getHerdStats();
      setStats(res);
    } catch (err) {
      console.error("Failed to load herd statistics:", err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch paginated animals
  const fetchAnimals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await animalsService.getAnimals({
        search: searchQuery.trim() || undefined,
        breed: selectedBreed || undefined,
        gender: selectedGender || undefined,
        status: selectedStatus || undefined,
        species: selectedSpecies || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });
      setAnimals(res.data || []);
      setTotalCount(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to fetch animals list:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    selectedBreed,
    selectedGender,
    selectedStatus,
    selectedSpecies,
    sortBy,
    sortOrder,
    page,
    limit,
  ]);

  useEffect(() => {
    let cancelled = false;
    animalsService
      .getHerdStats()
      .then((res) => {
        if (!cancelled) setStats(res);
      })
      .catch((err: unknown) => {
        console.error("Failed to load herd statistics:", err);
      })
      .finally(() => {
        if (!cancelled) setIsStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnimals();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAnimals]);

  const handleDownloadCsv = () => {
    const exportUrl = animalsService.getExportUrl({
      search: searchQuery || undefined,
      breed: selectedBreed || undefined,
      gender: selectedGender || undefined,
      status: selectedStatus || undefined,
      species: selectedSpecies || undefined,
    });
    window.open(exportUrl, "_blank");
  };

  const handleArchiveSubmit = async () => {
    if (!archiveModalAnimal) return;
    setIsArchiveSubmitting(true);
    try {
      await animalsService.deleteAnimal(archiveModalAnimal.id);
      showFeedback(
        "success",
        `Animal ${archiveModalAnimal.animalNumber} has been archived successfully.`,
      );
      setArchiveModalAnimal(null);
      fetchAnimals();
      loadStats();
    } catch {
      showFeedback("error", "Failed to archive animal.");
    } finally {
      setIsArchiveSubmitting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedIds.length === animals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(animals.map((a) => a.id));
    }
  };

  const handleOpenBadgeModal = async (animal: AnimalItem) => {
    let qrImg = animal.activeQr?.qrImageUrl || "";
    let qrVal = animal.activeQr?.qrValue || null;
    if (!qrImg) {
      try {
        const qrRes = await animalsService.getAnimalQr(animal.id);
        qrImg = qrRes.qrImageUrl;
        qrVal = qrRes.qrValue;
      } catch (err) {
        console.warn("Could not fetch QR details:", err);
      }
    }

    setBadgeModalData({
      animalNumber: animal.animalNumber,
      name: animal.name || null,
      breed: animal.breed || null,
      species: animal.species || "Cattle",
      gender: animal.gender,
      dateOfBirth: animal.dateOfBirth || null,
      farmName: animal.farm?.name || "Registered Livestock Facility",
      farmLocation:
        animal.farm?.city ||
        animal.farm?.district ||
        animal.farm?.province ||
        "Central",
      farmRegistrationNumber: animal.farm?.registrationNumber || null,
      qrImageUrl: qrImg,
      qrValue: qrVal,
      rfidNumber: null,
      status: animal.status || "ACTIVE",
    });
    setIsBadgeModalOpen(true);
  };

  const getSelectedBadgesData = async (): Promise<EarTagBadgeData[]> => {
    const selectedAnimals = animals.filter((a) => selectedIds.includes(a.id));
    const badgeList: EarTagBadgeData[] = [];
    for (const animal of selectedAnimals) {
      let qrImg = animal.activeQr?.qrImageUrl || "";
      let qrVal = animal.activeQr?.qrValue || null;
      if (!qrImg) {
        try {
          const qrRes = await animalsService.getAnimalQr(animal.id);
          qrImg = qrRes.qrImageUrl;
          qrVal = qrRes.qrValue;
        } catch (err) {
          console.warn("Could not fetch QR for batch:", err);
        }
      }
      badgeList.push({
        animalNumber: animal.animalNumber,
        name: animal.name || null,
        breed: animal.breed || null,
        species: animal.species || "Cattle",
        gender: animal.gender,
        dateOfBirth: animal.dateOfBirth || null,
        farmName: animal.farm?.name || "Registered Livestock Facility",
        farmLocation:
          animal.farm?.city ||
          animal.farm?.district ||
          animal.farm?.province ||
          "Central",
        farmRegistrationNumber: animal.farm?.registrationNumber || null,
        qrImageUrl: qrImg,
        qrValue: qrVal,
        rfidNumber: null,
        status: animal.status || "ACTIVE",
      });
    }
    return badgeList;
  };

  const handlePrintBatchA4 = async () => {
    if (selectedIds.length === 0) {
      showFeedback("error", "Please select at least one animal to print.");
      return;
    }
    setIsExportingBatch(true);
    try {
      const badges = await getSelectedBadgesData();
      if (badges.length === 0) return;
      await printBatchEarTagsA4(
        badges,
        `AITS Batch Ear Tags (${badges.length})`,
      );
    } catch (err) {
      console.error(err);
      showFeedback("error", "Failed to prepare A4 batch print preview.");
    } finally {
      setIsExportingBatch(false);
    }
  };

  const handleDownloadBatchA4 = async () => {
    if (selectedIds.length === 0) {
      showFeedback("error", "Please select at least one animal to export.");
      return;
    }
    setIsExportingBatch(true);
    try {
      const badges = await getSelectedBadgesData();
      if (badges.length === 0) return;
      await downloadBatchEarTagsA4Pdf(badges);
      showFeedback(
        "success",
        `Exported ${badges.length} ear tag badges to A4 PDF.`,
      );
    } catch (err) {
      console.error(err);
      showFeedback("error", "Failed to generate A4 PDF.");
    } finally {
      setIsExportingBatch(false);
    }
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return "—";
    const birth = new Date(dobString);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    if (diffMonths < 0) return "Just born";
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months}m`;
    return `${years}y ${months}m`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-3 rounded-xl border text-sm flex items-center gap-3 animate-in fade-in ${
              feedback.type === "success"
                ? "bg-[#10a37f]/10 border-[#10a37f]/30 text-[#10a37f]"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="flex-1 font-medium">{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss notification"
              className="font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* 1. Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0d0d0d] dark:text-white tracking-tight">
                Livestock Directory &amp; Herd Inventory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#10a37f]/10 text-[#10a37f] text-[11px] font-bold uppercase tracking-wider border border-[#10a37f]/20">
                {totalCount} Total Registered
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#8e8e8e] mt-1">
              Centralized authorized registry of cattle, ear tags, genealogy,
              and operational lifecycle status.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0d0d0d] dark:text-white bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] rounded-xl hover:border-[#10a37f] transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#10a37f]" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/animals/qr"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0d0d0d] dark:text-white bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] rounded-xl hover:border-[#10a37f] transition-all shadow-xs"
            >
              <QrCode className="w-4 h-4 text-[#10a37f]" />
              <span>QR Management</span>
            </Link>

            {canCreateAnimal && (
              <Link
                href="/animals/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs shadow-[#10a37f]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Register Animal</span>
              </Link>
            )}
          </div>
        </div>

        {/* Animals Sub-navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#202020] rounded-2xl w-fit border border-[#e5e5e5] dark:border-[#333333]">
          <Link
            href="/animals"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#2c2c2c] text-[#0d0d0d] dark:text-white shadow-xs"
          >
            <PawPrint className="w-3.5 h-3.5 text-[#10a37f]" />
            <span>All Animals</span>
          </Link>
          {canCreateAnimal && (
            <Link
              href="/animals/register"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0d0d0d] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#282828] transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#10a37f]" />
              <span>Register Animal</span>
            </Link>
          )}
          <Link
            href="/animals/qr"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0d0d0d] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#282828] transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-[#10a37f]" />
            <span>QR Management</span>
          </Link>
        </div>

        {/* 2. Herd Live KPI Metric Cards */}
        <HerdStatsCards stats={stats} isLoading={isStatsLoading} />

        {/* 3. Search & Filter Bar */}
        <div className="bg-white dark:bg-[#262626] p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by Ear Tag #, Nickname, Breed, RFID, or QR Code..."
                className="w-full pl-10 pr-4 py-2 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedBreed}
                onChange={(e) => {
                  setSelectedBreed(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f] cursor-pointer"
              >
                <option value="">All Breeds</option>
                <option value="Holstein-Friesian">Holstein-Friesian</option>
                <option value="Jersey">Jersey</option>
                <option value="Brown Swiss">Brown Swiss</option>
                <option value="Ayrshire">Ayrshire</option>
                <option value="Sahiwal">Sahiwal</option>
                <option value="Girolando">Girolando</option>
              </select>

              <select
                value={selectedGender}
                onChange={(e) => {
                  setSelectedGender(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f] cursor-pointer"
              >
                <option value="">All Genders</option>
                <option value="FEMALE">Female / Cow</option>
                <option value="MALE">Male / Bull</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f] cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="QUARANTINED">Quarantined</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="SOLD">Sold</option>
                <option value="DECEASED">Deceased</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as AnimalQueryParams["sortBy"])
                }
                className="px-3 py-2 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f] cursor-pointer"
              >
                <option value="createdAt">Sort by Registered Date</option>
                <option value="animalNumber">Sort by Ear Tag #</option>
                <option value="name">Sort by Name</option>
                <option value="dateOfBirth">Sort by Age / DoB</option>
                <option value="weight">Sort by Weight</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] p-1 border border-[#e5e5e5] dark:border-[#383838]">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white dark:bg-[#2f2f2f] text-[#10a37f] shadow-xs"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-[#2f2f2f] text-[#10a37f] shadow-xs"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                  title="Grid Card View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Animals Content (Table / Grid) */}
        {isLoading ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#10a37f]" />
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Loading authorized livestock records...
            </p>
          </div>
        ) : animals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] space-y-3">
            <PawPrint className="w-12 h-12 text-[#10a37f]/40 mx-auto" />
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              No livestock records found
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e] max-w-md mx-auto">
              {searchQuery || selectedBreed || selectedStatus
                ? "Try clearing your filters or search keywords."
                : "Your farm currently has no cattle registered." +
                  (canCreateAnimal
                    ? ' Click "Register Animal" to onboard your first cow.'
                    : "")}
            </p>
            {canCreateAnimal && (
              <div className="pt-2">
                <Link
                  href="/animals/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Animal Now</span>
                </Link>
              </div>
            )}
          </div>
        ) : viewMode === "table" ? (
          <AnimalListTable
            animals={animals}
            selectedIds={selectedIds}
            handleToggleSelect={handleToggleSelect}
            handleSelectAllVisible={handleSelectAllVisible}
            handleOpenBadgeModal={handleOpenBadgeModal}
            hasPermissionOnFarm={hasPermissionOnFarm}
            setArchiveModalAnimal={setArchiveModalAnimal}
            calculateAge={calculateAge}
          />
        ) : (
          <AnimalListGrid
            animals={animals}
            selectedIds={selectedIds}
            handleToggleSelect={handleToggleSelect}
            handleOpenBadgeModal={handleOpenBadgeModal}
            hasPermissionOnFarm={hasPermissionOnFarm}
            setArchiveModalAnimal={setArchiveModalAnimal}
            calculateAge={calculateAge}
          />
        )}

        {/* 5. Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838]">
            <span className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Showing page{" "}
              <strong className="text-[#0d0d0d] dark:text-white">{page}</strong>{" "}
              of{" "}
              <strong className="text-[#0d0d0d] dark:text-white">
                {totalPages}
              </strong>{" "}
              ({totalCount} total animals)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] disabled:opacity-40 hover:border-[#10a37f] text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-xs font-bold bg-[#10a37f]/10 text-[#10a37f] rounded-lg">
                {page}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] disabled:opacity-40 hover:border-[#10a37f] text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Batch Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1e1e1e] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-3 duration-200">
            <span className="text-xs font-bold text-emerald-400">
              {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "animal" : "animals"} selected
            </span>
            <div className="h-4 w-px bg-white/20" />
            <button
              onClick={handlePrintBatchA4}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print A4 Sheet</span>
            </button>
            <button
              onClick={handleDownloadBatchA4}
              disabled={isExportingBatch}
              className="px-3 py-1.5 bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {isExportingBatch ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download A4 PDF</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-white transition-colors ml-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Modal: Official Ear Tag Badge (Unified A7 PDF, PNG, Print) */}
        <EarTagBadgeModal
          isOpen={isBadgeModalOpen}
          onClose={() => {
            setIsBadgeModalOpen(false);
            setBadgeModalData(null);
          }}
          data={badgeModalData}
        />

        {/* Modal: Archive Confirmation */}
        {archiveModalAnimal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#262626] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-[#383838] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0d0d0d] dark:text-white tracking-tight">
                    Archive Animal Record
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {archiveModalAnimal.animalNumber} -{" "}
                    {archiveModalAnimal.breed}
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Are you sure you want to archive this animal? Archiving will
                  hide it from the active livestock directory, but its
                  historical data will be retained for traceability and audit
                  purposes.
                </p>
              </div>
              <div className="p-5 border-t border-gray-100 dark:border-[#383838] bg-gray-50 dark:bg-[#1f1f1f] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setArchiveModalAnimal(null)}
                  disabled={isArchiveSubmitting}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#383838] hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleArchiveSubmit}
                  disabled={isArchiveSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-70"
                >
                  {isArchiveSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Archive Record
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
