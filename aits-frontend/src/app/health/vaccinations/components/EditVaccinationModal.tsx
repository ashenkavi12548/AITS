import React, { useState } from 'react';
import { Syringe, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { healthService, VaccinationRecordItem, CreateVaccinationInput } from '@/services/health.service';

export function EditVaccinationModal({
  record,
  onClose,
  onSuccess,
}: {
  record: VaccinationRecordItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<{
    nextDueDate: string;
    noNextDose: boolean;
    notes: string;
  }>(() => ({
    nextDueDate: record.nextDue || '',
    noNextDose: !record.nextDue,
    notes: record.notes || '',
  }));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<CreateVaccinationInput> = {
        notes: formData.notes,
      };

      if (formData.noNextDose) {
        payload.noNextDose = true;
      } else {
        payload.noNextDose = false;
        payload.nextDueDate = formData.nextDueDate;
      }

      await healthService.updateVaccination(record.id, payload);
      toast.success('Vaccination record updated successfully');
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
            'This update caused a conflict.'
        );
      } else {
        toast.error('Failed to update vaccination.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                Edit Vaccination Record
              </h2>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                Update next booster due date or clinical notes
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
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Animal Tag
                </label>
                <input
                  type="text"
                  value={record.animalTag}
                  disabled
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] opacity-70 bg-[#f4f4f4] dark:bg-[#383838] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                  Vaccination Date (Immutable)
                </label>
                <input
                  type="text"
                  value={record.date}
                  disabled
                  className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] opacity-70 bg-[#f4f4f4] dark:bg-[#383838] cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Vaccine Name
              </label>
              <input
                type="text"
                value={record.vaccine}
                disabled
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] opacity-70 bg-[#f4f4f4] dark:bg-[#383838] cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
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
                          nextDueDate: checked ? '' : formData.nextDueDate,
                        });
                      }}
                      className="rounded border-[#e5e5e5] dark:border-[#383838] text-[#10a37f] focus:ring-[#10a37f]"
                    />
                    No Next Dose
                  </label>
                </div>
                <input
                  type="date"
                  value={formData.nextDueDate || ''}
                  disabled={formData.noNextDose}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  className={`chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] ${formData.noNextDose ? 'opacity-50 cursor-not-allowed bg-[#f4f4f4] dark:bg-[#383838]' : ''}`}
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
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
