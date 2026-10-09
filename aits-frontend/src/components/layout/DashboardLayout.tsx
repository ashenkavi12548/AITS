"use client";

import React from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useSidebarStore } from "@/store/useSidebarStore";



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebarStore();


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-150">
        <Sidebar />
        <div
          className={`flex flex-col transition-all duration-200 min-h-screen ${
            isCollapsed ? "md:ml-16" : "md:ml-64"
          }`}
        >
          <TopHeader />

          <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>


      </div>
    </ProtectedRoute>
  );
}
