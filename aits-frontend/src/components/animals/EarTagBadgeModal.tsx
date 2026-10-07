"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Download,
  Printer,
  QrCode,
  Tag,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  EarTagBadgeData,
  downloadEarTagBadge,
  downloadEarTagBadgePdf,
  printEarTagBadge,
} from "@/utils/earTagBadgeGenerator";
import toast from "react-hot-toast";

interface EarTagBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: EarTagBadgeData | null;
}

export default function EarTagBadgeModal({
  isOpen,
  onClose,
  data,
}: EarTagBadgeModalProps) {
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !data) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadEarTagBadgePdf(data);
      toast.success(`A7 Ear Tag PDF downloaded for #${data.animalNumber}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate ear tag badge PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setIsGeneratingPng(true);
      await downloadEarTagBadge(data);
      toast.success(`A7 Ear Tag PNG downloaded for #${data.animalNumber}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate ear tag badge image.");
    } finally {
      setIsGeneratingPng(false);
    }
  };

  const handleDownloadRawQr = () => {
    if (!data.qrImageUrl) return;
    const link = document.createElement("a");
    link.href = data.qrImageUrl;
    link.download = `${data.animalNumber}-AITS-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Raw QR code saved for #${data.animalNumber}`);
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printEarTagBadge(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to prepare badge for printing. Please allow popups.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl border border-[#e5e5e5] dark:border-[#333333] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] dark:border-[#2f2f2f] bg-gray-50/50 dark:bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
                <span>Official Cattle Ear Tag Badge</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#10a37f]/15 text-[#10a37f] border border-[#10a37f]/30">
                  A7 Size (74×105mm)
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Optimized high-contrast physical ear tag without photo for
                direct tag printing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Interactive Badge Preview */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-gray-100 dark:bg-[#141414]">
          {/* Visual Badge Card in Exact A7 Proportions (Aspect ratio 74:105) */}
          <div className="relative w-full max-w-85 aspect-74/105 bg-white rounded-2xl shadow-xl border-4 border-[#10a37f] p-4 flex flex-col justify-between select-none text-[#0f172a] overflow-hidden">
            {/* Top Ear Pin Hole Punch Guide */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center relative bg-gray-50">
                <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-600" />
                <span className="absolute -top-1 w-full border-t border-gray-300 pointer-events-none" />
              </div>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                Pin Punch Zone (Ø 6mm)
              </span>
            </div>

            {/* Official Header Banner */}
            <div className="bg-[#065f46] text-white text-center py-1.5 px-2 rounded-lg mt-1 shadow-xs">
              <div className="text-[9px] font-extrabold tracking-wider leading-tight uppercase">
                Animal Identification & Traceability System
              </div>
              <div className="text-[7.5px] font-semibold text-[#a7f3d0] tracking-wider leading-none mt-0.5 uppercase">
                Official Livestock Ear Identifier • A7
              </div>
            </div>

            {/* Prominent Animal Number */}
            <div className="text-center bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl py-1 px-2 my-1.5">
              <div className="text-[8px] font-bold text-[#059669] tracking-widest uppercase">
                Primary Ear Tag ID
              </div>
              <div className="text-2xl font-black tracking-tight text-[#0f172a] leading-none my-0.5">
                {data.animalNumber}
              </div>
              {data.name && data.name.trim() && (
                <div className="inline-block bg-[#10a37f] text-white text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wide">
                  ★ {data.name.trim()} ★
                </div>
              )}
            </div>

            {/* Central Scannable QR Code */}
            <div className="flex flex-col items-center bg-white border-2 border-gray-200 rounded-xl p-2 shadow-inner my-1">
              {data.qrImageUrl ? (
                <Image
                  src={data.qrImageUrl}
                  alt={`QR Tag for animal ${data.animalNumber}`}
                  width={144}
                  height={144}
                  className="w-36 h-36 object-contain rounded-sm"
                  unoptimized
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center bg-gray-50 text-gray-400 text-xs font-semibold">
                  <QrCode className="w-8 h-8 opacity-40 mb-1" />
                </div>
              )}
              <div className="text-[8px] font-bold text-gray-900 tracking-wider uppercase mt-1">
                Scan to Verify Profile & Pedigree
              </div>
            </div>

            {/* Information Grid (Without Image) */}
            <div className="grid grid-cols-2 gap-1.5 text-[9px] mt-1">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-1">
                <span className="text-gray-400 block text-[7px] font-bold uppercase">
                  Breed
                </span>
                <span className="font-bold text-gray-900 truncate block">
                  {data.breed || "Dairy Cattle"}
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-1">
                <span className="text-gray-400 block text-[7px] font-bold uppercase">
                  Sex / Gender
                </span>
                <span className="font-bold text-gray-900 truncate block">
                  {data.gender === "MALE" ? "Male (Bull)" : "Female (Cow)"}
                </span>
              </div>
            </div>

            {/* Farm Facility */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 mt-1 flex items-center justify-between text-[9px]">
              <div>
                <span className="text-gray-400 block text-[7px] font-bold uppercase">
                  Farm Facility
                </span>
                <span className="font-bold text-gray-900 truncate block max-w-42.5">
                  {data.farmName || "Registered Livestock Facility"}
                </span>
              </div>
              <span className="text-[8px] text-gray-500 font-medium truncate">
                {data.farmLocation || data.farmRegistrationNumber || "Central"}
              </span>
            </div>

            {/* Security Footer */}
            <div className="bg-[#0f172a] text-white text-center py-1 px-2 rounded-lg mt-1.5 text-[7px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-[#10a37f]" />
              <span>Official National Registry • Tamper-Evident Tag</span>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-[#f1f5f9] dark:border-[#2f2f2f] bg-white dark:bg-[#1e1e1e] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#10a37f] shrink-0" />
              <span>
                300 DPI high-contrast vector print ready for ear tag laminating
              </span>
            </div>
            {data.qrImageUrl && (
              <button
                type="button"
                onClick={handleDownloadRawQr}
                className="text-[11px] text-[#10a37f] hover:underline cursor-pointer sm:ml-2 font-semibold"
              >
                Download Raw QR
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || isGeneratingPdf || isGeneratingPng}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838] bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333333] text-xs font-bold text-[#0d0d0d] dark:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#10a37f]" />
              ) : (
                <Printer className="w-4 h-4 text-gray-500" />
              )}
              <span>Print (A7)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isGeneratingPng || isGeneratingPdf || isPrinting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#10a37f]/40 bg-white dark:bg-[#242424] hover:bg-[#10a37f]/10 text-xs font-bold text-[#10a37f] transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPng ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Save PNG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isGeneratingPng || isPrinting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF (A7)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
