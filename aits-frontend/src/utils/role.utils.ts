import {
  ShieldCheck,
  Shield,
  HeartPulse,
  UserCheck,
  Users,
  LucideIcon,
  
} from "lucide-react";

export interface RoleDisplayConfig {
  label: string;
  description: string;
  badgeClass: string;
  icon: LucideIcon;
}

export function getRoleDisplayConfig(role?: string | null): RoleDisplayConfig {
  const normalizedRole = role?.toUpperCase() || "";

  switch (normalizedRole) {
    case "OWNER":
    case "FARMER":
      return {
        label: "Farm Owner",
        description: "Full Farm Control & Administration",
        badgeClass:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
        icon: ShieldCheck,
      };
    case "MANAGER":
      return {
        label: "Farm Manager",
        description: "Workforce Supervision & Reports",
        badgeClass:
          "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
        icon: Shield,
      };
    case "VETERINARIAN":
    case "VETERINARIAN":
      return {
        label: "Resident Veterinarian",
        description: "Clinical & Health Records",
        badgeClass:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        icon: HeartPulse,
      };
    case "AUDITOR":
    case "GOVERNMENT_OFFICER":
      return {
        label: "Auditor / Compliance Inspector",
        description: "Traceability Review",
        badgeClass:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
        icon: UserCheck,
      };
    case "WORKER":
      return {
        label: "Farm Worker",
        description: "Milking, Feeding & Daily Barn Chores",
        badgeClass:
          "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
        icon: Users,
      };
    default:
      return {
        label: "Livestock Operator",
        description: "Standard Farm Operations",
        badgeClass:
          "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30",
        icon: Users,
      };
  }
}
