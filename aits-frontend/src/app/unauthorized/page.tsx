"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  
  const isMissingFarm = user && !user.primaryFarmId;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-xs">
          <ShieldAlert className="w-8 h-8 stroke-2" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isMissingFarm ? "No Farm Assigned" : "Access Restricted"}
          </h1>
          <p className="text-sm text-white/60">
            {isMissingFarm
              ? "You do not have an active farm assignment. Please contact your Farm Owner or Administrator to assign you to a farm."
              : "You do not have the required permissions or assigned roles to view any modules in this workspace. Please contact your Farm Owner or Administrator."}
          </p>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors border border-white/10"
          >
            Sign Out
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#10a37f] to-[#0e8c6d] hover:from-[#0e8c6d] hover:to-[#0c7a5f] text-white font-medium text-sm transition-all"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
