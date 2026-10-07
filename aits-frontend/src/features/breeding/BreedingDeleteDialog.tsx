'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { BreedingRecord } from '@/types/breeding';

interface BreedingDeleteDialogProps {
  isOpen: boolean;
  record: BreedingRecord | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const BreedingDeleteDialog: React.FC<BreedingDeleteDialogProps> = ({
  isOpen,
  record,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2f2f2f] w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xl overflow-hidden p-6 space-y-4 text-center transition-colors duration-150">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">Delete Breeding Service Log</h3>
          <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1.5 leading-relaxed">
            Are you sure you want to delete the breeding service log for{' '}
            <strong className="text-[#0d0d0d] dark:text-white font-mono">{record.femaleAnimalTag}</strong> ({record.femaleAnimalName}) on{' '}
            <strong className="text-[#0d0d0d] dark:text-white">{record.serviceDate}</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#383838] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
