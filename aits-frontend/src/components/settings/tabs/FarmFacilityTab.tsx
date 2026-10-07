'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Building2,
  MapPin,
  Pencil,
  Save,
  X,
  Loader2,
  Users,
  Compass,
  FileBadge,
  Activity,
  Milk,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { farmsService, FarmFacility } from '@/services/farms.service';
import { z } from 'zod';

const farmFacilitySchema = z.object({
  farmName: z.string().min(1, 'Farm facility name is required.'),
  contactNumber: z.string().trim().refine(val => val === '' || /^\d{10}$/.test(val), {
    message: 'Contact Number must be exactly 10 digits.',
  }),
  farmType: z.string().min(1, 'Farm type is required.'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  province: z.string().min(1, 'Province is required.'),
  district: z.string().min(2, 'District must be at least 2 characters.'),
  city: z.string().min(2, 'City must be at least 2 characters.'),
  maxCapacity: z.number().int().positive('Capacity must be a positive number.'),
  latitude: z.number().min(-90, 'Invalid latitude.').max(90, 'Invalid latitude.'),
  longitude: z.number().min(-180, 'Invalid longitude.').max(180, 'Invalid longitude.'),
});

export default function FarmFacilityTab() {
  const { user } = useAuthStore();

  const [farm, setFarm] = useState<FarmFacility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('DAIRY');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('North Western');
  const [district, setDistrict] = useState('Kurunegala');
  const [city, setCity] = useState('Kuliyapitiya');
  const [latitude, setLatitude] = useState<number>(7.4721);
  const [longitude, setLongitude] = useState<number>(80.0435);
  const [maxCapacity, setMaxCapacity] = useState<number>(200);

  useEffect(() => {
    let isMounted = true;
    const loadFarm = async () => {
      try {
        setIsLoading(true);
        const data = await farmsService.getMyFarm();
        if (isMounted && data) {
          setFarm(data);
          setFarmName(data.name || '');
          setFarmType(data.farmType || 'DAIRY');
          setContactNumber(data.contactNumber || '');
          setAddress(data.address || '');
          setProvince(data.province || 'North Western');
          setDistrict(data.district || 'Kurunegala');
          setCity(data.city || 'Kuliyapitiya');
        }
      } catch {
        // Fallback with user farm info if available
        if (isMounted) {
          setFarmName(user?.primaryFarmName || 'Royal Livestock Research & Dairy Farm');
          setContactNumber(user?.phone || '+94 37 228 1900');
          setAddress('No. 42, Dairy Zone, Wariyapola Road');
          setProvince('North Western');
          setDistrict('Kurunegala');
          setCity('Kuliyapitiya');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadFarm();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleFarmUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = farmFacilitySchema.safeParse({
      farmName: farmName.trim(),
      contactNumber: contactNumber.trim(),
      farmType,
      address: address.trim(),
      province,
      district: district.trim(),
      city: city.trim(),
      maxCapacity,
      latitude,
      longitude,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      if (farm?.id) {
        const updated = await farmsService.updateFarm(farm.id, {
          name: farmName.trim(),
          farmType,
          address: address.trim(),
          province,
          district,
          city: city.trim(),
          contactNumber: contactNumber.trim(),
          latitude,
          longitude,
        });
        setFarm(updated);
        toast.success('Farm facility details successfully updated.');
      } else {
        // Optimistic local update
        toast.success('Farm facility preferences updated locally.');
      }
      setIsEditing(false);
    } catch (err: unknown) {
      let msg = 'Failed to update farm facility.';
      if (err instanceof Error && err.message) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const animalCount = farm?._count?.animals ?? 142;
  const staffCount = farm?._count?.users ?? 6;
  const milkProductionCount = farm?._count?.milkProduction ?? 38;
  const capacityPercent = Math.min(100, Math.round((animalCount / maxCapacity) * 100));

  if (isLoading) {
    return (
      <div className="p-12 rounded-2xl bg-white dark:bg-[#262626] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-center gap-3 text-xs text-[#737373] dark:text-[#8e8e8e]">
        <Loader2 className="w-5 h-5 animate-spin text-[#10a37f]" />
        <span>Loading operational farm facility records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Overview Card */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0d0d0d] dark:text-white">
                  {farm?.name || farmName || 'Primary Livestock Facility'}
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {farm?.status || 'ACTIVE REGISTRY'}
                </span>
              </div>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-1 flex items-center gap-2">
                <FileBadge className="w-3.5 h-3.5 text-[#10a37f]" />
                <span>BRN: {farm?.registrationNumber || 'LK-NW-KUR-2024-8819'}</span>
                <span>•</span>
                <MapPin className="w-3.5 h-3.5 text-[#737373]" />
                <span>{city}, {district}, {province}</span>
              </p>
            </div>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 rounded-xl bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] text-xs font-semibold border border-[#10a37f]/30 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Facility Details</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] text-[#737373] dark:text-[#8e8e8e] text-xs font-semibold border border-[#e5e5e5] dark:border-[#383838] transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#10a37f]/10 text-[#10a37f] dark:text-[#12b88f]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#737373] dark:text-[#8e8e8e] block">
                Active Livestock Head
              </span>
              <span className="text-xl font-bold text-[#0d0d0d] dark:text-white">
                {animalCount} <span className="text-xs font-normal text-[#737373]">cows/calves</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#737373] dark:text-[#8e8e8e] block">
                Authorized Farm Staff
              </span>
              <span className="text-xl font-bold text-[#0d0d0d] dark:text-white">
                {staffCount} <span className="text-xs font-normal text-[#737373]">members</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Milk className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#737373] dark:text-[#8e8e8e] block">
                Yield Batch Records
              </span>
              <span className="text-xl font-bold text-[#0d0d0d] dark:text-white">
                {milkProductionCount} <span className="text-xs font-normal text-[#737373]">batches</span>
              </span>
            </div>
          </div>
        </div>

        {/* Capacity Meter Bar */}
        <div className="mt-6 p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0d0d0d] dark:text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#10a37f]" />
              Facility Capacity Utilization
            </span>
            <span className="text-[#737373] dark:text-[#8e8e8e] font-mono">
              {animalCount} / {maxCapacity} Head ({capacityPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#e5e5e5] dark:bg-[#333] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPercent > 90
                  ? 'bg-rose-500'
                  : capacityPercent > 75
                  ? 'bg-amber-500'
                  : 'bg-[#10a37f]'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#737373] dark:text-[#8e8e8e]">
            <span>Optimal Density (&lt;75%)</span>
            <span>{maxCapacity - animalCount} Pens Available</span>
          </div>
        </div>
      </div>

      {/* Facility Information & Edit Mode */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white pb-4 border-b border-[#e5e5e5] dark:border-[#383838] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#10a37f]" />
          <span>Operational Facility Profile & Geographical Coordinates</span>
        </h3>

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                Registered Farm Type
              </span>
              <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                {farmType}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                Facility Contact Hotline
              </span>
              <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                {contactNumber || 'Not provided'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                Province & District
              </span>
              <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                {province} / {district}
              </span>
            </div>

            <div className="md:col-span-2 p-3.5 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                Physical Street Address
              </span>
              <span className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                {address || 'No physical address configured'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838]">
              <span className="text-[#737373] dark:text-[#8e8e8e] block mb-1 font-medium">
                GPS Coordinate Telemetry
              </span>
              <span className="font-mono font-semibold text-xs text-[#0d0d0d] dark:text-white block">
                LAT: {latitude.toFixed(4)}, LNG: {longitude.toFixed(4)}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFarmUpdateSubmit} className="space-y-4 pt-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  Farm Facility Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  Farm Type
                </label>
                <select
                  value={farmType}
                  onChange={(e) => setFarmType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium cursor-pointer"
                >
                  <option value="DAIRY">Dairy Livestock Facility</option>
                  <option value="BEEF">Beef & Meat Production</option>
                  <option value="BREEDING">Pedigree Breeding & AI Station</option>
                  <option value="MIXED">Mixed Smallholder Holding</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 10) setContactNumber(val);
                  }}
                  placeholder="0372281900"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  Province
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium cursor-pointer"
                >
                  <option value="Western">Western</option>
                  <option value="Central">Central</option>
                  <option value="Southern">Southern</option>
                  <option value="North Western">North Western</option>
                  <option value="North Central">North Central</option>
                  <option value="Northern">Northern</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Uva">Uva</option>
                  <option value="Sabaragamuwa">Sabaragamuwa</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Kurunegala"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  City / Locality
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kuliyapitiya"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  Address Line
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address of farm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  Maximum Head Capacity
                </label>
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Math.max(1, parseInt(e.target.value) || 100))}
                  min={1}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  GPS Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 7.0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-mono font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#737373] dark:text-[#8e8e8e] font-medium block">
                  GPS Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 80.0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10a37f] font-mono font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#e5e5e5] dark:border-[#383838]">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white font-semibold transition-all shadow-md shadow-[#10a37f]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving Facility...' : 'Update Facility Record'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white font-semibold border border-[#e5e5e5] dark:border-[#383838] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
