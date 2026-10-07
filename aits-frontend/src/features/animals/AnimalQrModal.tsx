'use client';

import Image from 'next/image';
import { Download, X } from 'lucide-react';
import type { AnimalItem } from '@/types/animals';

interface AnimalQrModalProps {
  animal: AnimalItem;
  onClose: () => void;
}

export function AnimalQrModal({ animal, onClose }: AnimalQrModalProps) {
  const qrUrl = animal.activeQr?.qrImageUrl;

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${animal.animalNumber}-AITS-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`QR Code for animal ${animal.animalNumber}`}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e2e8f0] dark:border-[#333333] shadow-2xl w-full max-w-xs p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm text-[#0f172a] dark:text-white">
              {animal.animalNumber}
            </p>
            <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
              {animal.breed} · {animal.gender === 'FEMALE' ? 'Female' : 'Male'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR code modal"
            className="p-1.5 rounded-lg text-[#64748b] hover:bg-gray-100 dark:hover:bg-[#333]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Image */}
        <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200">
          {qrUrl ? (
            <Image
              src={qrUrl}
              alt={`QR code for animal ${animal.animalNumber}`}
              width={180}
              height={180}
              className="w-44 h-44"
              unoptimized
            />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-lg">
              No QR available
            </div>
          )}
        </div>

        {/* QR Value */}
        {animal.activeQr?.qrValue && (
          <p className="text-[10px] text-center font-mono text-[#64748b] break-all">
            {animal.activeQr.qrValue}
          </p>
        )}

        {/* Actions */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!qrUrl}
          aria-label={`Download QR code for ${animal.animalNumber}`}
          className="w-full py-2.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          Download QR PNG
        </button>
      </div>
    </div>
  );
}
