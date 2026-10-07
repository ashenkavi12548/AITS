import {
  Syringe,
  HeartPulse,
  Milk,
  Dna,
  Truck,
  Shield,
  PawPrint,
  Bell,
  LucideIcon,
} from 'lucide-react';
import { NotificationPriority } from '@/types/notification';

export interface NotificationMeta {
  icon: LucideIcon;
  badgeLabel: string;
  iconBgClass: string;
  iconColorClass: string;
  priorityClass: string;
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFullDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getNotificationMeta(
  category?: string,
  type?: string,
  priority?: NotificationPriority,
): NotificationMeta {
  const cat = (category || type || 'SYSTEM').toUpperCase();

  let icon: LucideIcon = Bell;
  let badgeLabel = 'System';
  let iconBgClass = 'bg-slate-100 dark:bg-[#2a2a2a] border-slate-200 dark:border-[#383838]';
  let iconColorClass = 'text-slate-600 dark:text-slate-300';

  switch (cat) {
    case 'VACCINATION':
    case 'VACCINATION_DUE':
      icon = Syringe;
      badgeLabel = 'Vaccination';
      iconBgClass = 'bg-purple-500/10 border-purple-500/20';
      iconColorClass = 'text-purple-600 dark:text-purple-400';
      break;

    case 'HEALTH':
    case 'HEALTH_ALERT':
    case 'TREATMENT_DUE':
    case 'QUARANTINE_ALERT':
      icon = HeartPulse;
      badgeLabel = 'Health';
      iconBgClass = 'bg-rose-500/10 border-rose-500/20';
      iconColorClass = 'text-rose-600 dark:text-rose-400';
      break;

    case 'PRODUCTION':
    case 'PRODUCTION_ALERT':
    case 'PRODUCTION_DROP':
      icon = Milk;
      badgeLabel = 'Production';
      iconBgClass = 'bg-[#10a37f]/10 border-[#10a37f]/20';
      iconColorClass = 'text-[#10a37f] dark:text-[#12b88f]';
      break;

    case 'BREEDING':
    case 'BREEDING_REMINDER':
    case 'CALVING_REMINDER':
      icon = Dna;
      badgeLabel = 'Breeding';
      iconBgClass = 'bg-pink-500/10 border-pink-500/20';
      iconColorClass = 'text-pink-600 dark:text-pink-400';
      break;

    case 'MOVEMENT':
    case 'MOVEMENT_ARRIVED':
    case 'MOVEMENT_IN_TRANSIT':
    case 'TRACEABILITY':
      icon = Truck;
      badgeLabel = 'Movement';
      iconBgClass = 'bg-amber-500/10 border-amber-500/20';
      iconColorClass = 'text-amber-600 dark:text-amber-400';
      break;

    case 'ACCOUNT':
      icon = Shield;
      badgeLabel = 'Account';
      iconBgClass = 'bg-[#10a37f]/10 border-[#10a37f]/20';
      iconColorClass = 'text-[#10a37f] dark:text-[#12b88f]';
      break;

    case 'ANIMAL':
    case 'ANIMAL_REGISTERED':
      icon = PawPrint;
      badgeLabel = 'Registry';
      iconBgClass = 'bg-[#10a37f]/10 border-[#10a37f]/20';
      iconColorClass = 'text-[#10a37f]';
      break;

    default:
      icon = Bell;
      badgeLabel = 'Notice';
      iconBgClass = 'bg-slate-100 dark:bg-[#2a2a2a] border-slate-200 dark:border-[#383838]';
      iconColorClass = 'text-slate-600 dark:text-slate-300';
      break;
  }

  let priorityClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  if (priority === 'CRITICAL') {
    priorityClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold';
  } else if (priority === 'HIGH') {
    priorityClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold';
  } else if (priority === 'NORMAL') {
    priorityClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }

  return {
    icon,
    badgeLabel,
    iconBgClass,
    iconColorClass,
    priorityClass,
  };
}
