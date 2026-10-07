'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  QrCode,
  Download,
  Printer,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  History,
  X,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Tag,
  Loader2,
} from 'lucide-react';
import {
  animalsService,
  AnimalItem,
  AnimalQrResponse,
} from '@/services/animals.service';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  downloadBatchEarTagsA4Pdf,
  printBatchEarTagsA4,
  type EarTagBadgeData,
} from '@/utils/earTagBadgeGenerator';
import EarTagBadgeModal from '@/components/animals/EarTagBadgeModal';
import toast from 'react-hot-toast';

export default function QrManagementPage() {
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);

  // Modals & Drawers
  const [activeAnimalQrData, setActiveAnimalQrData] = useState<AnimalQrResponse | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [selectedForAction, setSelectedForAction] = useState<AnimalItem | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Form states for QR Replace
  const [replaceReason, setReplaceReason] = useState('DAMAGED_TAG');
  const [replaceNotes, setReplaceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchAnimalsWithQr = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await animalsService.getAnimals({
        search: searchQuery.trim() || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setAnimals(res.data || []);
    } catch (err: unknown) {
      console.error('Failed to fetch animals for QR:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnimalsWithQr();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAnimalsWithQr]);

  const handleOpenBadgeModal = async (animal: AnimalItem) => {
    setSelectedForAction(animal);
    try {
      const qrRes = await animalsService.getAnimalQr(animal.id);
      setActiveAnimalQrData(qrRes);
      setIsBadgeModalOpen(true);
    } catch {
      showFeedback('error', 'Failed to retrieve QR code details.');
    }
  };

  const handleOpenHistoryDrawer = async (animal: AnimalItem) => {
    setSelectedForAction(animal);
    try {
      const qrRes = await animalsService.getAnimalQr(animal.id);
      setActiveAnimalQrData(qrRes);
      setIsHistoryDrawerOpen(true);
    } catch {
      showFeedback('error', 'Failed to load QR history.');
    }
  };

  const handleReplaceQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForAction) return;

    setIsSubmitting(true);
    try {
      await animalsService.replaceQr(selectedForAction.id, {
        reason: replaceReason,
        notes: replaceNotes.trim() || undefined,
      });
      showFeedback(
        'success',
        `New QR code activated for #${selectedForAction.animalNumber}. Old QR marked as REPLACED.`,
      );
      setIsReplaceModalOpen(false);
      setReplaceNotes('');
      fetchAnimalsWithQr();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to replace QR code.';
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedBadgeData = (): EarTagBadgeData | null => {
    if (!selectedForAction) return null;
    return {
      animalNumber: selectedForAction.animalNumber,
      name: selectedForAction.name || null,
      breed: selectedForAction.breed || null,
      species: selectedForAction.species || 'Cattle',
      gender: selectedForAction.gender,
      dateOfBirth: selectedForAction.dateOfBirth || null,
      farmName: selectedForAction.farm?.name || 'Registered Livestock Facility',
      farmLocation:
        selectedForAction.farm?.city ||
        selectedForAction.farm?.district ||
        selectedForAction.farm?.province ||
        'Central',
      farmRegistrationNumber: selectedForAction.farm?.registrationNumber || null,
      qrImageUrl: activeAnimalQrData?.qrImageUrl || selectedForAction.activeQr?.qrImageUrl || '',
      qrValue: activeAnimalQrData?.qrValue || selectedForAction.activeQr?.qrValue || null,
      rfidNumber: null,
      status: selectedForAction.status || 'ACTIVE',
    };
  };

  const getTargetBatchBadges = async (): Promise<EarTagBadgeData[]> => {
    const targetAnimals =
      selectedAnimalIds.length > 0
        ? animals.filter((a) => selectedAnimalIds.includes(a.id))
        : animals;

    if (targetAnimals.length === 0) {
      toast.error('No cattle available to export.');
      return [];
    }

    const badgeList: EarTagBadgeData[] = [];
    for (const animal of targetAnimals) {
      let qrImg = animal.activeQr?.qrImageUrl;
      let qrVal = animal.activeQr?.qrValue;
      if (!qrImg) {
        try {
          const qrRes = await animalsService.getAnimalQr(animal.id);
          qrImg = qrRes.qrImageUrl;
          qrVal = qrRes.qrValue;
        } catch (err) {
          console.warn(`Could not load QR for ${animal.animalNumber}:`, err);
        }
      }
      badgeList.push({
        animalNumber: animal.animalNumber,
        name: animal.name || null,
        breed: animal.breed || null,
        species: animal.species || 'Cattle',
        gender: animal.gender,
        dateOfBirth: animal.dateOfBirth || null,
        farmName: animal.farm?.name || 'Registered Livestock Facility',
        farmLocation:
          animal.farm?.city ||
          animal.farm?.district ||
          animal.farm?.province ||
          'Central',
        farmRegistrationNumber: animal.farm?.registrationNumber || null,
        qrImageUrl: qrImg || '',
        qrValue: qrVal || null,
        rfidNumber: null,
        status: animal.status || 'ACTIVE',
      });
    }

    return badgeList;
  };

  const handleBatchPrintA4 = async () => {
    try {
      setIsBatchProcessing(true);
      const badges = await getTargetBatchBadges();
      if (badges.length === 0) return;
      await printBatchEarTagsA4(badges, `AITS Batch Ear Tags (${badges.length})`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare A4 batch print preview.');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDownloadA4Pdf = async () => {
    try {
      setIsBatchProcessing(true);
      const badges = await getTargetBatchBadges();
      if (badges.length === 0) return;
      toast.loading(`Generating A4 PDF sheet for ${badges.length} cattle tags...`, {
        id: 'batch-pdf',
      });
      await downloadBatchEarTagsA4Pdf(badges, 'AITS-Official-Ear-Tags-Batch-A4');
      toast.success(
        `Downloaded A4 PDF with ${badges.length} official cattle ear tags!`,
        { id: 'batch-pdf' },
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate A4 PDF batch sheet.', { id: 'batch-pdf' });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleDownloadSingleQr = (animalNumber: string, qrImageUrl?: string) => {
    if (!qrImageUrl) return;
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${animalNumber}-AITS-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAnimal = (id: string) => {
    setSelectedAnimalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedAnimalIds.length === animals.length) {
      setSelectedAnimalIds([]);
    } else {
      setSelectedAnimalIds(animals.map((a) => a.id));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-4 py-3 rounded-xl border text-sm flex items-center gap-3 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-[#10a37f]/10 border-[#10a37f]/30 text-[#10a37f]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="flex-1 font-medium">{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="font-bold opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/animals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10a37f] hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Livestock Directory</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0d0d0d] dark:text-white tracking-tight">
                QR Tag Management &amp; Print Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#10a37f]/10 text-[#10a37f] text-[11px] font-bold uppercase tracking-wider border border-[#10a37f]/20">
                Active Encrypted Tags
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#8e8e8e] mt-1">
              Search, generate, batch print, and atomically replace ear tag identification while preserving historical traceability logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleBatchPrintA4}
              disabled={isBatchProcessing || animals.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0d0d0d] dark:text-white bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-40"
              title="Print all selected badges in standard A4 sheets"
            >
              <Printer className="w-4 h-4 text-[#10a37f]" />
              <span>
                Print A4 Sheet ({selectedAnimalIds.length > 0 ? `${selectedAnimalIds.length} Selected` : `All (${animals.length})`})
              </span>
            </button>

            <button
              type="button"
              onClick={handleBatchDownloadA4Pdf}
              disabled={isBatchProcessing || animals.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-all shadow-xs shadow-[#10a37f]/20 cursor-pointer disabled:opacity-40"
              title="Download multi-badge official A4 PDF document"
            >
              {isBatchProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                Download A4 PDF ({selectedAnimalIds.length > 0 ? `${selectedAnimalIds.length} Selected` : `All (${animals.length})`})
              </span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-[#262626] p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ear Tag #, Nickname, Breed, or RFID..."
              className="w-full pl-10 pr-4 py-2 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f]"
            >
              <option value="">All Animal Statuses</option>
              <option value="ACTIVE">Active Herd</option>
              <option value="QUARANTINED">Quarantined</option>
              <option value="TRANSFERRED">Transferred</option>
            </select>

            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {selectedAnimalIds.length === animals.length && animals.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[#10a37f]" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>Select All</span>
            </button>
          </div>
        </div>

        {/* QR Inventory Grid */}
        {isLoading ? (
          <div className="p-16 rounded-3xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#10a37f]" />
            <p className="text-xs text-gray-500">Loading authorized QR ear tags...</p>
          </div>
        ) : animals.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] space-y-3">
            <QrCode className="w-12 h-12 text-[#10a37f]/40 mx-auto" />
            <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
              No QR records found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No cattle match your search criteria. Try modifying your search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {animals.map((animal) => {
              const isSelected = selectedAnimalIds.includes(animal.id);
              return (
                <div
                  key={animal.id}
                  className={`bg-white dark:bg-[#262626] rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#10a37f] ring-2 ring-[#10a37f]/20'
                      : 'border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f]/50'
                  }`}
                >
                  <div>
                    {/* Header: Checkbox + Tag + Status */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#f1f5f9] dark:border-[#333333]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSelectAnimal(animal.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#10a37f]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <div>
                          <Link
                            href={`/animals/${animal.id}`}
                            className="text-xs font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] hover:underline"
                          >
                            {animal.animalNumber}
                          </Link>
                          {animal.name && animal.name !== animal.animalNumber && (
                            <p className="text-[10px] text-gray-500">
                              &ldquo;{animal.name}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
                        {animal.activeQr?.status || 'ACTIVE'}
                      </span>
                    </div>

                    {/* QR Code Graphic Box */}
                    <div className="p-4 my-3 bg-white rounded-2xl border border-gray-200 text-center shadow-inner">
                      {animal.activeQr?.qrImageUrl ? (
                        <Image
                          src={animal.activeQr.qrImageUrl}
                          alt={`QR code for ${animal.animalNumber}`}
                          width={128}
                          height={128}
                          className="w-32 h-32 mx-auto cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => handleOpenBadgeModal(animal)}
                          unoptimized
                        />
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center text-[10px] text-gray-400 mx-auto">
                          QR Tag Ready
                        </div>
                      )}
                      <p className="text-[10px] font-mono text-gray-400 truncate mt-2">
                        {animal.activeQr?.qrValue || `AITS-QR-${animal.animalNumber}`}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 text-[11px] text-gray-500">
                      <div className="flex justify-between">
                        <span>Breed:</span>
                        <strong className="text-gray-800 dark:text-gray-200">{animal.breed}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Farm:</span>
                        <strong className="text-gray-800 dark:text-gray-200 truncate max-w-32">
                          {animal.farm?.name || '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] dark:border-[#333333] grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenBadgeModal(animal)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="View & Download Official Ear Badge"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Badge</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenHistoryDrawer(animal)}
                      className="py-1.5 px-2 rounded-xl bg-gray-50 dark:bg-[#1f1f1f] hover:bg-[#10a37f]/10 text-gray-700 dark:text-gray-300 hover:text-[#10a37f] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="View Tag History"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">History</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedForAction(animal);
                        setIsReplaceModalOpen(true);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Replace Damaged Tag"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Replace</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* Drawer: QR History Timeline */}
        {isHistoryDrawerOpen && activeAnimalQrData && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
            <div className="bg-white dark:bg-[#242424] max-w-md w-full h-full p-6 border-l border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-4 overflow-y-auto animate-in slide-in-from-right">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#10a37f]" />
                  <h3 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                    QR Lifecycle History (#{activeAnimalQrData.animalNumber})
                  </h3>
                </div>
                <button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {activeAnimalQrData.qrHistory?.map((qr, index) => (
                  <div
                    key={qr.id}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      qr.status === 'ACTIVE'
                        ? 'bg-[#10a37f]/5 border-[#10a37f]/30'
                        : 'bg-gray-50 dark:bg-[#1f1f1f] border-gray-200 dark:border-gray-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          qr.status === 'ACTIVE'
                            ? 'bg-[#10a37f] text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {qr.status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(qr.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="font-mono text-[10px] text-gray-500 break-all">
                      {qr.qrValue}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400">
                        Tag Version #{activeAnimalQrData.qrHistory.length - index}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleQr(activeAnimalQrData.animalNumber, qr.qrImageUrl)}
                        className="text-[11px] font-bold text-[#10a37f] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download This Version</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Replace QR Tag */}
        {isReplaceModalOpen && selectedForAction && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#242424] rounded-3xl max-w-md w-full p-6 border border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                  Replace QR Ear Tag (#{selectedForAction.animalNumber})
                </h3>
                <button
                  onClick={() => setIsReplaceModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReplaceQrSubmit} className="space-y-3 text-xs">
                <p className="text-gray-500">
                  This operation marks the current active QR as <strong>REPLACED</strong>, generates a new cryptographic token, and preserves traceability history.
                </p>

                <div>
                  <label className="font-bold block mb-1">Reason for Replacement *</label>
                  <select
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl font-bold focus:outline-none focus:border-[#10a37f]"
                  >
                    <option value="DAMAGED_TAG">Physical Tag Damaged / Broken</option>
                    <option value="FADED_QR">QR Code Print Faded / Unscannable</option>
                    <option value="LOST_IN_PASTURE">Tag Lost in Pasture</option>
                    <option value="SYSTEM_REISSUE">Official Re-issue / Re-tagging</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Administrative Notes</label>
                  <textarea
                    rows={2}
                    value={replaceNotes}
                    onChange={(e) => setReplaceNotes(e.target.value)}
                    placeholder="Provide additional details..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#10a37f]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsReplaceModalOpen(false)}
                    className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Issue Replacement QR</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Official A7 Cattle Ear Tag Badge Modal */}
        <EarTagBadgeModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          data={getSelectedBadgeData()}
        />
      </div>
    </DashboardLayout>
  );
}
