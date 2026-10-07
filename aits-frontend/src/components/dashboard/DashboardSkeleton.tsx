'use client';

import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Header Skeleton */}
      <div className="h-24 bg-[#f0f0f0] dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl" />

      {/* KPI Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-[#f0f0f0] dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl" />
        ))}
      </div>

      {/* Charts Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-95 bg-[#f0f0f0] dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl" />
        <div className="lg:col-span-5 h-95 bg-[#f0f0f0] dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl" />
      </div>

      {/* Bottom Events & Attention Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-85 bg-[#f0f0f0] dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl" />
        <div className="lg:col-span-5 h-85 bg-[#f0f0f0] dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl" />
      </div>
    </div>
  );
}
