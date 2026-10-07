import React, { useState, useEffect } from 'react';
import { X, FileCheck2, CheckCircle2, ShieldAlert, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { healthService } from '@/services/health.service';
import { farmsService } from '@/services/farms.service';
import { AnimalTagAutocomplete } from '@/components/common/AnimalTagAutocomplete';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import {
  CreateClearanceInput,
  HealthClearanceItem,
  AnimalCompositeHealthState,
} from '@/services/health.service';
import { FarmFacility } from '@/services/farms.service';

export function IssueClearanceModal({
  onClose,
  onSuccess,
  editItem,
}: {
  onClose: () => void;
  onSuccess: () => void;
  editItem?: HealthClearanceItem | null;
}) {
  const [formData, setFormData] = useState<CreateClearanceInput>(() => ({
    animalTag: editItem?.animalTag || "",
    purpose: editItem?.purpose || "Commercial Sale",
    destination: editItem?.destination || "",
    validUntil: editItem?.validUntil
      ? new Date(editItem.validUntil).toISOString().split("T")[0]
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
    conditions:
      editItem?.conditions ||
      "Certified clinically afebrile, negative for infectious signs, no active antimicrobial residue withdrawal, eligible for inter-district movement.",
    notes: editItem?.notes || "",
  }));
  const [eligibility, setEligibility] =
    useState<AnimalCompositeHealthState | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [farms, setFarms] = useState<FarmFacility[]>([]);
  const [myFarmId, setMyFarmId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      farmsService.searchAllFarms(),
      farmsService.getMyFarm().catch(() => null),
    ])
      .then(([allFarms, myFarm]) => {
        setFarms(allFarms || []);
        setMyFarmId(myFarm?.id || null);
      })
      .catch(console.error);
  }, []);

  const checkEligibility = async (tag: string) => {
    if (!tag.trim()) {
      setEligibility(null);
      return;
    }
    setChecking(true);
    try {
      const state = await healthService.getAnimalEligibility(tag.trim());
      setEligibility(state);
    } catch {
      setEligibility(null);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animalTag.trim()) {
      toast.error("Animal is required");
      return;
    }
    if (!formData.destination.trim()) {
      toast.error("Destination is required");
      return;
    }

    if (eligibility && !eligibility.eligibility.canIssueClearance) {
      toast.error("Animal is ineligible for health clearance certificate!");
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        await healthService.updateClearance(editItem.id, formData);
        toast.success("Clearance permit updated successfully");
      } else {
        await healthService.createClearance(formData);
        toast.success("Clearance permit issued and queued for official review");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        `Failed to ${editItem ? "update" : "issue"} clearance permit. Animal may be in quarantine or withdrawal.`,
      );
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
            <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0d0d0d] dark:text-white">
                {editItem
                  ? "Edit Health Clearance Permit"
                  : "Issue Health Clearance Permit"}
              </h2>
              <p className="text-[12px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                {editItem
                  ? "Update pending clearance permit details"
                  : "Authoritative eligibility check and transit permit generation"}
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
                onSelect={(tag) => {
                  setFormData({ ...formData, animalTag: tag });
                  checkEligibility(tag);
                }}
                disabled={!!editItem}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Purpose <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px]"
              >
                <option value="Commercial Sale">Commercial Sale</option>
                <option value="Inter-district Transfer">
                  Inter-district Transfer
                </option>
                <option value="Breeding Loan">Breeding Loan</option>
                <option value="Livestock Exhibition">
                  Livestock Exhibition
                </option>
                <option value="Veterinary Referral">Veterinary Referral</option>
              </select>
            </div>
          </div>

          {/* Real-time Eligibility Status Box */}
          {checking && (
            <p className="text-xs text-[#888]">
              Checking authoritative health & food safety eligibility...
            </p>
          )}
          {eligibility && (
            <div
              className={`p-3 rounded-xl border ${
                eligibility.eligibility.canIssueClearance
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                {eligibility.eligibility.canIssueClearance ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Animal is Verified Eligible for Clearance Permit
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Animal Ineligible: Contraindications Detected</span>
                  </>
                )}
              </div>
              {!eligibility.eligibility.canIssueClearance &&
                eligibility.eligibility.reasons.length > 0 && (
                  <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                    {eligibility.eligibility.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Destination <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                placeholder="Search destination farm..."
                value={formData.destination}
                onChange={(val) =>
                  setFormData({ ...formData, destination: val })
                }
                options={farms
                  .filter((f) => f.id !== myFarmId)
                  .map((f) => ({
                    value: f.name,
                    label: f.name,
                  }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
                Valid Until <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8e8e8e]" />
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                  className="chatgpt-input w-full pl-9 pr-3 py-2 rounded-lg text-[13px]"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
              Veterinary Conditions / Statement
            </label>
            <textarea
              rows={3}
              value={formData.conditions}
              onChange={(e) =>
                setFormData({ ...formData, conditions: e.target.value })
              }
              className="chatgpt-input w-full px-3 py-2 rounded-lg text-[13px] resize-none"
            />
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
              disabled={
                saving ||
                (eligibility !== null &&
                  !eligibility.eligibility.canIssueClearance)
              }
              className="px-4 py-2 text-[13px] font-semibold text-white bg-[#10a37f] hover:bg-[#0e8c6d] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : editItem
                  ? "Save Changes"
                  : "Issue Clearance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
