import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Users,
  HeartPulse,
  Milk,
  Dna,
  Route,
  Settings,
  LucideIcon,
  Wheat,
} from "lucide-react";
import { SystemRole, FarmUserRole, AuthUser } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: { label: string; href: string }[];
  hasGapAfter?: boolean;
  roles?: (SystemRole | FarmUserRole)[];
  requiredPermissions?: string[];
  sectionTitle?: string;
}

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    label: "Dashboard",
    sectionTitle: "OVERVIEW",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermissions: ["dashboard:view"],
  },
  { 
    label: "Animals", 
    href: "/animals", 
    icon: PawPrint, 
    hasGapAfter: true,
    requiredPermissions: ["animal:read"] 
  },
  { 
    label: "Production", 
    sectionTitle: "FARM OPERATIONS",
    href: "/production", 
    icon: Milk, 
    requiredPermissions: ["milk:read"] 
  },
  {
    label: "Feeding",
    href: "/feeding",
    icon: Wheat,
    requiredPermissions: ["feed:read"]
  },
  {
    label: "Health",
    href: "/health",
    icon: HeartPulse,
    requiredPermissions: ["health:read"],
  },
  {
    label: "Breeding",
    href: "/breeding",
    icon: Dna,
    hasGapAfter: true,
    requiredPermissions: ["breeding:read"],
  },
  { 
    label: "Movement", 
    sectionTitle: "MANAGEMENT",
    href: "/movement", 
    icon: Route, 
    requiredPermissions: ["traceability:read"]
  },
  { 
    label: "Staff", 
    href: "/staff", 
    icon: Users,
    requiredPermissions: ["farm_member:read"]
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    requiredPermissions: ["calendar:read"],
  },
  { 
    label: "Settings", 
    href: "/settings", 
    icon: Settings
  },
];

export function getFirstAccessibleRoute(user: AuthUser | null, hasPermissionOnFarm: (permission: string) => boolean): string {
  if (!user) return "/login";
  
  for (const item of NAVIGATION_CONFIG) {
    // Check role
    const hasRole = Boolean(
      !item.roles ||
      item.roles.includes(user.role as SystemRole) ||
      (user.farmRole && item.roles.includes(user.farmRole as FarmUserRole))
    );
    if (!hasRole) continue;
    
    // Check granular permissions for non-admins and non-farmers
    if (user.role !== "FARMER" && item.requiredPermissions && item.requiredPermissions.length > 0) {
      const hasPermission = item.requiredPermissions.some((p: string) => hasPermissionOnFarm(p));
      if (!hasPermission) continue;
    }
    
    return item.href;
  }
  
  return "/unauthorized";
}
