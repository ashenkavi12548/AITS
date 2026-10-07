import type { AnimalStatus } from '@/types/animals';

interface AnimalStatusBadgeProps {
  status: AnimalStatus;
}

const STATUS_CONFIG: Record<
  AnimalStatus,
  { label: string; dot: string; badge: string }
> = {
  ACTIVE: {
    label: 'Active',
    dot: 'bg-[#10a37f]',
    badge:
      'bg-[#f0fdf4] dark:bg-[#10a37f]/20 text-[#10a37f] border-[#10a37f]/30',
  },
  QUARANTINED: {
    label: 'Quarantined',
    dot: 'bg-rose-500 animate-pulse',
    badge:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  },
  TRANSFERRED: {
    label: 'Transferred',
    dot: 'bg-amber-500',
    badge:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  SOLD: {
    label: 'Sold',
    dot: 'bg-[#10a37f]',
    badge:
      'bg-[#10a37f]/5 dark:bg-[#10a37f]/30/40 text-[#10a37f] dark:text-[#12b88f] border-[#10a37f]/20 dark:border-[#10a37f]/60',
  },
  DECEASED: {
    label: 'Deceased',
    dot: 'bg-zinc-500',
    badge:
      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
  MISSING: {
    label: 'Missing',
    dot: 'bg-orange-500',
    badge:
      'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  },
};

export function AnimalStatusBadge({ status }: AnimalStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
