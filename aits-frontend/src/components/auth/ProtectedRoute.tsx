"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Radio } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  NAVIGATION_CONFIG,
  getFirstAccessibleRoute,
} from "@/config/navigation.config";
import { SystemRole, FarmUserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, isLoading, user, hasPermissionOnFarm } = useAuthStore();

  useEffect(() => {
    // Only redirect if initialization has definitely completed and user is not authenticated
    if (isInitialized && !isLoading) {
      if (!isAuthenticated) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check if user has access to current path
      const currentNav = NAVIGATION_CONFIG.find(
        (item) =>
          pathname === item.href || pathname.startsWith(item.href + "/"),
      );

      if (currentNav) {
        const hasRole = Boolean(
          !currentNav.roles ||
            (user &&
              (currentNav.roles.includes(user.role as SystemRole) ||
                (user.farmRole &&
                  currentNav.roles.includes(user.farmRole as FarmUserRole))))
        );
        let hasPermission = true;

        if (
          user &&
                    user.role !== "FARMER" &&
          currentNav.requiredPermissions &&
          currentNav.requiredPermissions.length > 0
        ) {
          hasPermission = currentNav.requiredPermissions.some((p) =>
            hasPermissionOnFarm(p),
          );
        }

        if (!hasRole || !hasPermission) {
          const firstAccessible = getFirstAccessibleRoute(user, hasPermissionOnFarm);
          router.replace(firstAccessible);
        }
      }
    }
  }, [isInitialized, isLoading, isAuthenticated, router, pathname, user, hasPermissionOnFarm]);

  if (!isInitialized || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center border border-[#10a37f]/20 shadow-xs animate-pulse">
            <Radio className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#5d5d5d] dark:text-[#b4b4b4]">
            <Loader2 className="w-4 h-4 animate-spin text-[#10a37f]" />
            <span>Verifying workspace session...</span>
          </div>
        </div>
      </div>
    );
  }

  let isAuthorized = true;
  if (isInitialized && !isLoading && isAuthenticated && user) {
    const currentNav = NAVIGATION_CONFIG.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
    );
    if (currentNav) {
      const hasRole = Boolean(
        !currentNav.roles ||
        currentNav.roles.includes(user.role as SystemRole) ||
        (user.farmRole && currentNav.roles.includes(user.farmRole as FarmUserRole))
      );
      let hasPermission = true;
      if (
                user.role !== "FARMER" &&
        currentNav.requiredPermissions &&
        currentNav.requiredPermissions.length > 0
      ) {
        hasPermission = currentNav.requiredPermissions.some((p) =>
          hasPermissionOnFarm(p),
        );
      }
      isAuthorized = hasRole && hasPermission;
    }
  }

  if (!isAuthorized) {
    return null; // Prevent briefly flashing unauthorized content while redirecting
  }

  return <>{children}</>;
}
