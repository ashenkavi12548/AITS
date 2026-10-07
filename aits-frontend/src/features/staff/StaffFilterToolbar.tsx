import React from "react";
import { Search, LayoutGrid, List } from "lucide-react";

interface StaffFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  viewMode: "cards" | "table";
  onViewModeChange: (mode: "cards" | "table") => void;
  totalEmployees: number;
}

export function StaffFilterToolbar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  totalEmployees,
}: StaffFilterToolbarProps) {
  return (
    <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-4 shadow-xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
          <input
            type="text"
            aria-label="Search staff by name, email, or telephone number"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search staff by name, email, or telephone number..."
            className="w-full pl-10 pr-4 py-2 bg-[#f6f6f6] dark:bg-[#1b1b1b] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white placeholder-[#888]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#888] hover:text-[#0d0d0d] dark:hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Filter by staff role"
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="px-3 py-2 bg-[#f6f6f6] dark:bg-[#1b1b1b] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white cursor-pointer"
            >
              <option value="ALL">All Roles ({totalEmployees})</option>
              <option value="WORKER">Farm Workers</option>
              <option value="MANAGER">Farm Managers</option>
              <option value="VETERINARIAN">Resident Vets</option>
              <option value="AUDITOR">Auditors</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Filter by account status"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-2 bg-[#f6f6f6] dark:bg-[#1b1b1b] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs font-medium focus:outline-none focus:border-[#10a37f] text-[#0d0d0d] dark:text-white cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* View Toggle (Grid vs Table) */}
          <div className="flex items-center bg-[#f0f0f0] dark:bg-[#191919] p-0.5 rounded-xl border border-[#e5e5e5] dark:border-[#383838]">
            <button
              type="button"
              onClick={() => onViewModeChange("cards")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white dark:bg-[#282828] text-[#10a37f] shadow-xs"
                  : "text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-[#282828] text-[#10a37f] shadow-xs"
                  : "text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
