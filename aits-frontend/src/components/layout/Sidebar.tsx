"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { SystemRole, FarmUserRole } from "@/types/auth";

import { NAVIGATION_CONFIG } from "@/config/navigation.config";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermissionOnFarm } = useAuthStore();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } =
    useSidebarStore();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Animals: true,
    Health: true,
    Breeding: true,
  });

  useEffect(() => {
    NAVIGATION_CONFIG.forEach((item) => {
      if (item.children) {
        const isChildActive =
          item.children.some((child) => pathname === child.href) ||
          (item.href !== "/dashboard" &&
            (pathname === item.href || pathname.startsWith(item.href + "/")));
        if (isChildActive) {
          setOpenSubmenus((prev) => {
            if (!prev[item.label]) {
              return { ...prev, [item.label]: true };
            }
            return prev;
          });
        }
      }
    });
  }, [pathname]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#f9f9f9] dark:bg-[#171717] text-[#0d0d0d] dark:text-[#ececec] border-r border-[#e5e5e5] dark:border-[#303030] select-none relative overflow-hidden transition-colors duration-150">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-15 px-3.5 border-b border-[#e5e5e5] dark:border-[#303030] relative z-10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 overflow-hidden group py-1"
          aria-label="AITS Dashboard"
        >
          {isCollapsed ? (
            <span className="font-black text-base tracking-tighter text-[#10a37f] px-1">
              AITS<span className="text-[#10a37f]">.</span>
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f] transition-colors">
                AITS<span className="text-[#10a37f]">.</span>
              </span>
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
                Livestock
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-[#737373] dark:text-[#b4b4b4] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] hover:text-[#0d0d0d] dark:hover:text-white transition-colors cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4.5 h-4.5" />
          ) : (
            <PanelLeftClose className="w-4.5 h-4.5" />
          )}
        </button>
        <button
          onClick={closeMobile}
          className="md:hidden p-1.5 rounded-lg text-[#737373] dark:text-[#b4b4b4] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] hover:text-[#0d0d0d] dark:hover:text-white cursor-pointer"
          aria-label="Close mobile menu"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2.5 py-3 space-y-1 relative z-10">
        {NAVIGATION_CONFIG.filter(item => {
          // Check system role and farm role
          const hasRole = Boolean(
            !item.roles ||
            (user && (
              item.roles.includes(user.role as SystemRole) ||
              (user.farmRole && item.roles.includes(user.farmRole as FarmUserRole))
            ))
          );
          if (!hasRole) return false;
          
          // Check granular permissions for non-admins and non-farmers
          // Admins and Farmers implicitly have all permissions within their scope
          if (user && user.role !== "FARMER" && item.requiredPermissions && item.requiredPermissions.length > 0) {
            const hasPermission = item.requiredPermissions.some(p => hasPermissionOnFarm(p));
            if (!hasPermission) return false;
          }
          
          return true;
        }).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (pathname === "/" && item.href === "/dashboard") ||
            Boolean(item.children?.some((c) => pathname === c.href)) ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const hasChildren = Boolean(
            item.children && item.children.length > 0,
          );
          const isSubOpen = Boolean(openSubmenus[item.label]);

          return (
            <div key={item.label} className={item.hasGapAfter ? "mb-3.5" : ""}>
              {item.sectionTitle && !isCollapsed && (
                <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3] dark:text-[#737373]">
                  {item.sectionTitle}
                </div>
              )}
              {hasChildren ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#e5e5e5]/80 dark:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white font-semibold shadow-2xs"
                        : "text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] hover:text-[#0d0d0d] dark:hover:text-[#ececec]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4.5 h-4.5 shrink-0 ${
                          isActive
                            ? "text-[#10a37f]"
                            : "text-[#737373] dark:text-[#8e8e8e]"
                        }`}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <span className="text-[#737373] dark:text-[#8e8e8e]">
                        {isSubOpen ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </button>
                  {hasChildren && isSubOpen && !isCollapsed && (
                    <div className="mt-1 ml-3.5 pl-3 border-l border-[#e5e5e5] dark:border-[#303030] space-y-0.5">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={closeMobile}
                            className={`block px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                              isChildActive
                                ? "bg-[#10a37f]/10 text-[#10a37f] font-semibold"
                                : "text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] hover:text-[#0d0d0d] dark:hover:text-white"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#e5e5e5]/80 dark:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white font-semibold shadow-2xs"
                      : "text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] hover:text-[#0d0d0d] dark:hover:text-[#ececec]"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      isActive
                        ? "text-[#10a37f]"
                        : "text-[#737373] dark:text-[#8e8e8e]"
                    }`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Live System Status Card Footer */}
      {!isCollapsed && (
        <div className="p-3 m-2.5 rounded-xl bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#303030] text-[12px] relative z-10 shadow-2xs shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10a37f] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10a37f]" />
              </span>
              <span className="text-[12px] font-medium text-[#0d0d0d] dark:text-[#ececec]">
                Telemetry Node
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#10a37f] bg-[#10a37f]/10 px-1.5 py-0.5 rounded border border-[#10a37f]/20">
              Active
            </span>
          </div>
          <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-1 truncate">
            LK-WEST-GRID-01
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 left-0 z-30 h-screen transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-150">
          <div
            className="fixed inset-0 w-screen h-screen min-h-screen bg-black/80 backdrop-blur-sm"
            onClick={closeMobile}
          />
          <div className="relative z-10 w-64 max-w-xs h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
