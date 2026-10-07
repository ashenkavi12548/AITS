import { ActivityType, MovementReason, MovementStatus, ActivitySession } from '@/types/traceability.types';

export const ACTIVITY_TYPE_LABELS: Partial<Record<ActivityType, string>> = {
  WEIGHT_CHECK: 'Weight Check',
  HEALTH_CHECK: 'Field Health Check',
  GENERAL_OBSERVATION: 'General Observation',
};


export const ACTIVITY_SESSION_LABELS: Record<ActivitySession, string> = {
  MORNING: 'Morning',
  EVENING: 'Evening',
  AFTERNOON: 'Afternoon',
  NIGHT: 'Night',
};

export const MOVEMENT_STATUS_LABELS: Record<MovementStatus, { label: string; bg: string; text: string }> = {
  SCHEDULED: { label: 'Scheduled', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
  IN_TRANSIT: { label: 'In Transit', bg: 'bg-[#10a37f]/10 border-[#10a37f]/20', text: 'text-[#0e8c6d] dark:text-[#12b88f]' },
  ARRIVED: { label: 'Arrived', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-700 dark:text-purple-400' },
  COMPLETED: { label: 'Completed', bg: 'bg-[#10a37f]/10 border-[#10a37f]/20', text: 'text-[#10a37f] dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-700 dark:text-rose-400' },
};

export const MOVEMENT_REASON_LABELS: Record<MovementReason, string> = {
  PERMANENT_TRANSFER: 'Permanent Farm Transfer',
  TEMPORARY_TRANSFER: 'Temporary Farm Transfer',
  VETERINARY_VISIT: 'Veterinary Visit',
  BREEDING_PURPOSE: 'Breeding Purpose',
  GRAZING: 'Grazing / Pasture',
  SALE_OR_MARKET: 'Sale or Market',
  RETURN_TO_ORIGINAL_FARM: 'Return to Original Farm',
  OTHER: 'Other Reason',
};

export const FEED_UNIT_OPTIONS = ['kg', 'lbs', 'bales', 'buckets', 'litres'];
export const MILKING_METHOD_OPTIONS = ['Machine Parlour', 'Hand Milking', 'Automated Robotic'];
export const FEEDING_METHOD_OPTIONS = ['TMR Mixer', 'Pasture Grazing', 'Manual Trough Feed', 'Bucket Feed'];
