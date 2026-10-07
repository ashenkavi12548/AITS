import {
  PawPrint,
  Milk,
  HeartPulse,
  Wheat,
  Dna,
  LayoutDashboard,
  Settings,
  LucideIcon,
} from "lucide-react";

export interface PermissionOption {
  id: string;
  label: string;
  shortLabel: string;
  desc: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  permissions: PermissionOption[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "group-animals",
    name: "Animal Profiles & Registration",
    icon: PawPrint,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    permissions: [
      {
        id: "animal:read",
        label: "View Animals",
        shortLabel: "View",
        desc: "View animal profiles and lists",
      },
      {
        id: "animal:create",
        label: "Register Animals",
        shortLabel: "Create",
        desc: "Register new animals",
      },
      {
        id: "animal:update",
        label: "Update Profiles",
        shortLabel: "Edit",
        desc: "Edit animal details and tags",
      },
      {
        id: "animal:delete",
        label: "Delete Profiles",
        shortLabel: "Delete",
        desc: "Remove animal records",
      },
      {
        id: "animal:export",
        label: "Export Animals",
        shortLabel: "Export",
        desc: "Export animal inventory to CSV",
      },
    ],
  },
  {
    id: "group-milk",
    name: "Milk Production Yield",
    icon: Milk,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    permissions: [
      {
        id: "milk:read",
        label: "View Yields",
        shortLabel: "View",
        desc: "View milk production records",
      },
      {
        id: "milk:create",
        label: "Log Yields",
        shortLabel: "Log",
        desc: "Record daily milking sessions",
      },
      {
        id: "milk:update",
        label: "Update Yields",
        shortLabel: "Edit",
        desc: "Edit or void milking records",
      },
      {
        id: "milk:delete",
        label: "Delete Yields",
        shortLabel: "Delete",
        desc: "Delete milking records",
      },
      {
        id: "milk:delete-permanent",
        label: "Permanently Delete Production Reports",
        shortLabel: "Hard Delete",
        desc: "Permanently delete production records",
      },
    ],
  },
  {
    id: "group-health",
    name: "Health & Treatments",
    icon: HeartPulse,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    permissions: [
      {
        id: "health:read",
        label: "View Records",
        shortLabel: "View",
        desc: "View health and clinical records",
      },
      {
        id: "health:record",
        label: "Manage Health",
        shortLabel: "Manage",
        desc: "Document diagnoses and treatments",
      },
    ],
  },
  {
    id: "group-feeding",
    name: "Feed & Rations",
    icon: Wheat,
    color: "text-[#10a37f] bg-[#10a37f]/10 border-[#10a37f]/20",
    permissions: [
      {
        id: "feeding:read",
        label: "View Rations",
        shortLabel: "View",
        desc: "View feed formulations",
      },
      {
        id: "feeding:record",
        label: "Log Rations",
        shortLabel: "Log",
        desc: "Log daily concentrate and forage",
      },
    ],
  },
  {
    id: "group-breeding",
    name: "Breeding & AI",
    icon: Dna,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    permissions: [
      {
        id: "breeding:read",
        label: "View Logs",
        shortLabel: "View",
        desc: "View breeding and AI logs",
      },
      {
        id: "breeding:create",
        label: "Record Events",
        shortLabel: "Create",
        desc: "Record heats and AI sessions",
      },
      {
        id: "breeding:update",
        label: "Update Events",
        shortLabel: "Edit",
        desc: "Update pregnancy checks",
      },
      {
        id: "breeding:delete",
        label: "Delete Events",
        shortLabel: "Delete",
        desc: "Delete breeding records",
      },
    ],
  },
  {
    id: "group-sys",
    name: "System & Dashboards",
    icon: LayoutDashboard,
    color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    permissions: [
      {
        id: "dashboard:view",
        label: "View Dashboard",
        shortLabel: "Dashboard",
        desc: "Access the main overview dashboard",
      },
      {
        id: "reports:read",
        label: "View Reports",
        shortLabel: "Reports",
        desc: "Access analytical reports",
      },
      {
        id: "traceability:read",
        label: "View Traceability",
        shortLabel: "Traceability",
        desc: "Access animal lifetime trace",
      },
      {
        id: "calendar:read",
        label: "View Calendar",
        shortLabel: "Calendar",
        desc: "Access the farm calendar",
      },
      {
        id: "notification:read",
        label: "View Notifications",
        shortLabel: "Notifications",
        desc: "Access system notifications",
      },
    ],
  },
  {
    id: "group-admin",
    name: "Administration",
    icon: Settings,
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    permissions: [
      {
        id: "farm_member:read",
        label: "View Staff",
        shortLabel: "View Staff",
        desc: "View farm staff members",
      },
      {
        id: "farm_member:manage",
        label: "Manage Staff",
        shortLabel: "Manage Staff",
        desc: "Add, update, or remove staff members",
      },
    ],
  },
];

export const ROLE_PRESET_PERMISSIONS: Record<string, string[]> = {
  WORKER: [
    "dashboard:view",
    "animal:read",
    "animal:create",
    "animal:update",
    "milk:read",
    "milk:create",
    "feeding:read",
    "feeding:record",
    "health:read",
    "breeding:read",
    "calendar:read",
    "notification:read",
  ],
  VETERINARIAN: [
    "dashboard:view",
    "animal:read",
    "health:read",
    "health:record",
    "breeding:read",
    "breeding:create",
    "breeding:update",
    "calendar:read",
    "notification:read",
  ],
  MANAGER: [
    "dashboard:view",
    "animal:read",
    "animal:create",
    "animal:update",
    "animal:delete",
    "animal:export",
    "milk:read",
    "milk:create",
    "milk:update",
    "milk:delete",
    "milk:delete-permanent",
    "health:read",
    "health:record",
    "feeding:read",
    "feeding:record",
    "breeding:read",
    "breeding:create",
    "breeding:update",
    "breeding:delete",
    "reports:read",
    "traceability:read",
    "calendar:read",
    "notification:read",
    "farm_member:read",
    "farm_member:manage",
  ],
  AUDITOR: [
    "dashboard:view",
    "animal:read",
    "milk:read",
    "health:read",
    "feeding:read",
    "breeding:read",
    "reports:read",
    "traceability:read",
    "farm_member:read",
  ],
};

export function generateSecurePassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "#@!%*=";
  let pass = "";
  for (let i = 0; i < 6; i++) {
    pass += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
  return pass;
}
