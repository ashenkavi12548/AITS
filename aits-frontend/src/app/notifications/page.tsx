"use client";

import React, { useState, useEffect, useCallback, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Check,
  ExternalLink,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import {
  getNotificationMeta,
  formatRelativeTime,
  formatFullDateTime,
} from "@/lib/notification-utils";
import { AppNotification, NotificationPriority } from "@/types/notification";

const TABS: Array<{ id: string; label: string; countKey?: string }> = [
  { id: "ALL", label: "All" },
  { id: "UNREAD", label: "Unread" },
  { id: "HEALTH", label: "Health" },
  { id: "VACCINATION", label: "Vaccination" },
  { id: "PRODUCTION", label: "Production" },
  { id: "BREEDING", label: "Breeding" },
  { id: "TRACEABILITY", label: "Traceability" },
  { id: "SYSTEM", label: "System" },
];

export default function NotificationsModal() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  const isUnreadOnly = selectedTab === "UNREAD";
  const categoryFilter =
    selectedTab !== "ALL" && selectedTab !== "UNREAD" ? selectedTab : undefined;
  const priorityFilter =
    selectedPriority !== "ALL"
      ? (selectedPriority as NotificationPriority)
      : undefined;

  const {
    data: notifsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useNotifications({
    page,
    limit,
    category: categoryFilter,
    unreadOnly: isUnreadOnly ? true : undefined,
    priority: priorityFilter,
  });

  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutate: markOneRead, isPending: isMarkingOne } =
    useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const handleDismiss = useCallback(() => {
    // Try to go back. In a robust app, if history is empty, you might push to /dashboard.
    // For now, back() is standard.
    router.back();
  }, [router]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDismiss]);

  // Lock body scroll when modal is mounted
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  let notifications = notifsData?.items ?? [];
  const totalPages = notifsData?.totalPages ?? 1;
  const total = notifsData?.total ?? 0;

  // Local search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    notifications = notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.message && n.message.toLowerCase().includes(q)) ||
        (n.desc && n.desc.toLowerCase().includes(q)),
    );
  }

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    setPage(1);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPriority(e.target.value);
    setPage(1);
  };

  const handleNavigate = (n: AppNotification) => {
    if (!n.isRead) {
      markOneRead(n.id);
    }
    if (n.actionUrl) {
      try {
        router.push(n.actionUrl);
      } catch {
        toast.error("Source record link could not be opened.");
      }
    } else {
      toast.error("No source record link associated with this notification.");
    }
  };

  const handleMarkRead = (e: React.MouseEvent, n: AppNotification) => {
    e.stopPropagation();
    markOneRead(n.id, {
      onSuccess: () => {
        toast.success("Notification marked as read");
      },
      onError: () => {
        toast.error("Failed to mark notification as read");
      },
    });
  };

  const handleMarkAllRead = () => {
    markAllRead(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read");
      },
      onError: () => {
        toast.error("Failed to mark all as read");
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
      onMouseDown={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 fade-in-0 slide-in-from-bottom-4">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#303030] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative p-2.5 rounded-xl bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10a37f] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10a37f]"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0d0d0d] dark:text-white tracking-tight">
                  Notifications & Alerts
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10a37f] text-white shadow-sm">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                Real-time livestock alerts and farm operational logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#383838] hover:bg-slate-100 dark:hover:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin text-[#10a37f]" : ""}`}
              />
            </button>

            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || isMarkingAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#242424] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-slate-200 dark:hover:bg-[#2c2c2c] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4 text-[#10a37f]" />
              <span className="hidden sm:inline">Mark all as read</span>
            </button>

            <div className="w-px h-6 bg-[#e5e5e5] dark:bg-[#383838] mx-1"></div>

            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl text-[#737373] hover:text-[#0d0d0d] dark:text-[#8e8e8e] dark:hover:text-white hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/20 border border-transparent transition-all cursor-pointer"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Filters & Search */}
        <div className="px-6 py-3 border-b border-[#e5e5e5] dark:border-[#303030] bg-slate-50/50 dark:bg-[#212121]/50 shrink-0 space-y-3">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {TABS.map((tab) => {
              const isActive = selectedTab === tab.id;
              const isUnreadTab = tab.id === "UNREAD";

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? "bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] border-transparent shadow-sm"
                      : "bg-white dark:bg-[#252525] border-[#e5e5e5] dark:border-[#383838] text-[#5d5d5d] dark:text-[#a0a0a0] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2f2f2f]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {isUnreadTab && unreadCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        isActive
                          ? "bg-white/20 dark:bg-black/20 text-white dark:text-black"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts..."
                className="block w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#242424] border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-[#0d0d0d] dark:text-white placeholder:text-[#a0a0a0] focus:outline-none focus:ring-2 focus:ring-[#10a37f]/50 transition-all shadow-sm"
              />
            </div>
            {/* Priority */}
            <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-[#242424] border border-[#e5e5e5] dark:border-[#383838] rounded-xl px-3 py-1.5 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-[#737373] dark:text-[#8e8e8e]" />
              <select
                value={selectedPriority}
                onChange={handlePriorityChange}
                className="text-xs bg-transparent text-[#0d0d0d] dark:text-white focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#303030] flex items-start gap-4 animate-pulse shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#303030] shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 dark:bg-[#303030] rounded w-1/4" />
                      <div className="h-3 bg-slate-200 dark:bg-[#303030] rounded w-16" />
                    </div>
                    <div className="h-3.5 bg-slate-100 dark:bg-[#282828] rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-center space-y-3 my-8">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                Unable to load notifications.
              </p>
              <p className="text-xs text-rose-500/80">
                A network error occurred while fetching your alerts.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-50 dark:bg-[#212121] border border-dashed border-[#e5e5e5] dark:border-[#383838] text-center space-y-4 my-8">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#2a2a2a] shadow-sm border border-slate-100 dark:border-[#303030] flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                <Bell className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0d0d0d] dark:text-white">
                  {isUnreadOnly
                    ? "You're all caught up!"
                    : searchQuery
                      ? "No matches found"
                      : "No notifications"}
                </h3>
                <p className="text-sm text-[#737373] dark:text-[#8e8e8e] max-w-sm mx-auto mt-1">
                  {isUnreadOnly
                    ? "Zero unread alerts require your attention right now."
                    : searchQuery
                      ? "Try adjusting your search terms or clearing the filters."
                      : "There are no notifications in this category."}
                </p>
              </div>
              {(selectedTab !== "ALL" ||
                searchQuery ||
                selectedPriority !== "ALL") && (
                <button
                  onClick={() => {
                    handleTabChange("ALL");
                    setSearchQuery("");
                    setSelectedPriority("ALL");
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#2c2c2c] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white hover:bg-slate-50 dark:hover:bg-[#383838] transition-colors shadow-sm cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            notifications.map((n) => {
              const meta = getNotificationMeta(n.category, n.type, n.priority);
              const Icon = meta.icon;
              const isUnread = !n.isRead;
              const relativeTime = n.time || formatRelativeTime(n.createdAt);
              const fullTime = formatFullDateTime(n.createdAt);

              return (
                <div
                  key={n.id}
                  onClick={() => handleNavigate(n)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                    isUnread
                      ? "bg-[#10a37f]/5 dark:bg-[#10a37f]/10 border-[#10a37f]/30 hover:border-[#10a37f]/50 hover:shadow-md hover:-translate-y-0.5"
                      : "bg-white dark:bg-[#212121] border-[#e5e5e5] dark:border-[#303030] hover:border-slate-300 dark:hover:border-[#404040] hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div
                      className={`p-3 rounded-2xl border shrink-0 ${meta.iconBgClass} shadow-sm`}
                    >
                      <Icon className={`w-5 h-5 ${meta.iconColorClass}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${meta.iconBgClass} ${meta.iconColorClass} uppercase`}
                          >
                            {meta.badgeLabel}
                          </span>

                          {/* Priority badge if HIGH or CRITICAL */}
                          {(n.priority === "HIGH" ||
                            n.priority === "CRITICAL") && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-extrabold tracking-wide border ${meta.priorityClass}`}
                            >
                              {n.priority}
                            </span>
                          )}

                          {isUnread && (
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#10a37f] ml-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]" />
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Timestamps */}
                        <span
                          className="text-xs font-medium text-[#737373] dark:text-[#8e8e8e] shrink-0 bg-slate-50 dark:bg-[#2a2a2a] px-2 py-0.5 rounded-lg border border-slate-100 dark:border-[#383838]"
                          title={fullTime}
                        >
                          {relativeTime}
                        </span>
                      </div>

                      <h3
                        className={`text-sm mt-2 leading-tight ${
                          isUnread
                            ? "font-bold text-[#0d0d0d] dark:text-white"
                            : "font-semibold text-[#2f2f2f] dark:text-[#e0e0e0]"
                        }`}
                      >
                        {n.title}
                      </h3>

                      <p className="text-[13px] text-[#5d5d5d] dark:text-[#a0a0a0] mt-1.5 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                        {n.message || n.desc}
                      </p>

                      {/* Actions Row */}
                      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-100 dark:border-[#2d2d2d]/50">
                        {n.actionUrl ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10a37f] group-hover:underline">
                            <span>View details</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-[#8e8e8e] dark:text-[#6e6e6e] italic">
                            System Advisory
                          </span>
                        )}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkRead(e, n)}
                            disabled={isMarkingOne}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#737373] dark:text-[#a0a0a0] bg-slate-50 dark:bg-[#2a2a2a] border border-slate-200 dark:border-[#383838] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-white dark:hover:bg-[#383838] hover:border-slate-300 transition-all shadow-sm cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-[#10a37f]" />
                            <span>Acknowledge</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer (Pagination) */}
        <div className="px-6 py-4 border-t border-[#e5e5e5] dark:border-[#303030] bg-slate-50/50 dark:bg-[#212121]/50 shrink-0 flex items-center justify-between">
          <div className="text-xs font-medium text-[#737373] dark:text-[#8e8e8e]">
            {total > 0 ? (
              <span>
                Showing{" "}
                <strong className="text-[#0d0d0d] dark:text-white">
                  {(page - 1) * limit + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-[#0d0d0d] dark:text-white">
                  {Math.min(page * limit, total)}
                </strong>{" "}
                of{" "}
                <strong className="text-[#0d0d0d] dark:text-white">
                  {total}
                </strong>{" "}
                alerts
              </span>
            ) : (
              <span>0 alerts</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#2a2a2a] border border-[#e5e5e5] dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#303030] text-[#5d5d5d] dark:text-[#b4b4b4] transition-all disabled:opacity-40 shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <div className="px-2 text-xs font-bold text-[#0d0d0d] dark:text-white">
              {page}{" "}
              <span className="text-[#737373] dark:text-[#666] font-medium mx-1">
                /
              </span>{" "}
              {totalPages}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#2a2a2a] border border-[#e5e5e5] dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#303030] text-[#5d5d5d] dark:text-[#b4b4b4] transition-all disabled:opacity-40 shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
