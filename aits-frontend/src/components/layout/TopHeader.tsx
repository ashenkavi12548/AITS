"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Bell,
  Menu,
  User,
  Shield,
  ChevronDown,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  Command,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useCurrentUser } from "@/hooks/use-dashboard";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import {
  getNotificationMeta,
  formatRelativeTime,
} from "@/lib/notification-utils";
import { AppNotification } from "@/types/notification";
import {
  dashboardService,
  SearchResultItem,
} from "@/services/dashboard.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { getRoleDisplayConfig } from "@/utils/role.utils";

const emptySubscribe = () => () => {};

export default function TopHeader() {
  const router = useRouter();
  const { toggleMobile } = useSidebarStore();
  const { user: authUser, logout } = useAuthStore();
  const { data: dashboardUser } = useCurrentUser();
  const activeUser = authUser || dashboardUser;

  // Initialize real-time notification stream via SSE
  useNotificationStream();

  const {
    data: notifsData,
    isLoading: isNotifLoading,
    isError: isNotifError,
    refetch: refetchNotifications,
  } = useNotifications({ limit: 10 });
  const { data: backendUnreadCount } = useUnreadCount();
  const { mutate: markOneRead } = useMarkNotificationRead();
  const { mutate: markAllReadMutate, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();
  const { setTheme, resolvedTheme } = useTheme();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  const activeRole = activeUser && "farmRole" in activeUser && activeUser.farmRole ? activeUser.farmRole : activeUser?.role;
  const activeRoleConfig = activeRole ? getRoleDisplayConfig(activeRole) : null;

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const notifications = notifsData?.items ?? [];
  const unreadCount = backendUnreadCount ?? notifsData?.unreadCount ?? 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const res = await dashboardService.searchRecords(searchQuery);
        if (isMounted) {
          setSearchResults(res || []);
        }
      } catch {
        if (isMounted) {
          setSearchResults([]);
        }
      }
    }, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const markAllRead = () => {
    markAllReadMutate();
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) {
      markOneRead(n.id);
    }
    setIsNotifOpen(false);
    if (n.actionUrl) {
      try {
        router.push(n.actionUrl);
      } catch {
        toast.error("Unable to navigate to source record.");
      }
    }
  };

  const isDark = resolvedTheme === "dark";

  const headerAvatarUrl =
    activeUser?.profileImageUrl ||
    (activeUser && "avatarUrl" in activeUser ? activeUser.avatarUrl : null);

  return (
    <header className="sticky top-0 z-20 h-14 bg-white/95 dark:bg-[#212121]/95 backdrop-blur-md border-b border-[#e5e5e5] dark:border-[#303030] px-4 md:px-6 flex items-center justify-between transition-colors duration-150">
      {/* Left: Mobile Toggle & ChatGPT-styled Prompt Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md" ref={searchRef}>
        <button
          onClick={toggleMobile}
          className="md:hidden p-1.5 text-[#5d5d5d] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] rounded-lg transition-colors cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="md:hidden flex items-center shrink-0">
          <Link href="/dashboard" className="flex items-center gap-1 group">
            <span className="font-extrabold text-xl tracking-tight text-[#0d0d0d] dark:text-white leading-none group-hover:text-emerald-600 transition-colors">
              AITS<span className="text-[#10a37f]">.</span>
            </span>
          </Link>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setIsSearchOpen(true);
              if (!val.trim()) {
                setSearchResults([]);
              }
            }}
            placeholder="Search animals, ear tags, farms..."
            className="w-full pl-9.5 pr-11 py-1.5 text-[13.5px] bg-[#f4f4f4] dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-full text-[#0d0d0d] dark:text-[#ececec] placeholder-[#737373] dark:placeholder-[#8e8e8e] focus:outline-hidden focus:ring-2 focus:ring-[#10a37f]/30 focus:border-[#10a37f] transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-[#737373] dark:text-[#8e8e8e] bg-white dark:bg-[#212121] rounded border border-[#e5e5e5] dark:border-[#424242] pointer-events-none">
            <Command className="w-2.5 h-2.5" /> K
          </div>

          {/* Search Results Popover */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl shadow-xl py-2 z-30 max-h-72 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1 text-[11px] font-bold text-[#737373] dark:text-[#8e8e8e] uppercase tracking-wider">
                Matching Records ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-5 text-center text-[13px] text-[#737373] dark:text-[#8e8e8e]">
                  No matching livestock or farm records found.
                </div>
              ) : (
                searchResults.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20">
                          {item.type}
                        </span>
                        <span className="text-[13px] font-medium text-[#0d0d0d] dark:text-[#ececec] group-hover:text-[#10a37f] transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#737373] dark:text-[#8e8e8e] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Theme Switcher, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Theme Switcher Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-1.5 rounded-lg text-[#5d5d5d] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] transition-all cursor-pointer"
            aria-label="Toggle Theme"
            title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          >
            {isDark ? (
              <Sun className="w-4.5 h-4.5 text-amber-400 rotate-0 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-[#5d5d5d] rotate-0 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>
        )}

        {/* Notifications Popover Trigger */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-1.5 rounded-lg text-[#5d5d5d] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] transition-all cursor-pointer"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            title={
              unreadCount > 0
                ? `Notifications (${unreadCount} unread)`
                : "Notifications"
            }
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-rose-500 rounded-full border border-white dark:border-[#212121] leading-none shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover Card */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl shadow-xl py-2 z-30 animate-in fade-in zoom-in-95 duration-100">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e5e5e5] dark:border-[#383838]">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-500/20">
                      {unreadCount > 9 ? "9+" : unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={isMarkingAll}
                    className="text-[12px] font-medium text-[#10a37f] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="divide-y divide-[#f0f0f0] dark:divide-[#383838] max-h-80 overflow-y-auto no-scrollbar">
                {isNotifLoading ? (
                  <div className="p-3 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 animate-pulse"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#383838] shrink-0" />
                        <div className="flex-1 space-y-1.5 py-0.5">
                          <div className="h-3.5 bg-slate-200 dark:bg-[#383838] rounded w-3/4" />
                          <div className="h-3 bg-slate-100 dark:bg-[#333] rounded w-5/6" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isNotifError ? (
                  <div className="p-6 text-center text-[13px]">
                    <p className="text-rose-500 dark:text-rose-400 font-medium">
                      Unable to load notifications.
                    </p>
                    <button
                      onClick={() => refetchNotifications()}
                      className="mt-2 text-[12px] font-semibold text-[#10a37f] hover:underline cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#212121] flex items-center justify-center text-slate-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-[13px] font-medium text-[#0d0d0d] dark:text-white mt-1">
                      No notifications
                    </p>
                    <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                      You&apos;re all caught up.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const meta = getNotificationMeta(
                      n.category,
                      n.type,
                      n.priority,
                    );
                    const Icon = meta.icon;
                    const isUnread = !n.isRead;
                    const timeAgo = n.time || formatRelativeTime(n.createdAt);

                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left p-3 flex items-start gap-3 hover:bg-[#f4f4f4] dark:hover:bg-[#383838]/60 transition-colors cursor-pointer ${
                          isUnread ? "bg-[#10a37f]/5 dark:bg-[#10a37f]/10" : ""
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 border ${meta.iconBgClass}`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 ${meta.iconColorClass}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-[13px] truncate ${
                                isUnread
                                  ? "font-semibold text-[#0d0d0d] dark:text-white"
                                  : "font-normal text-[#404040] dark:text-[#b4b4b4]"
                              }`}
                            >
                              {n.title}
                            </h4>
                            <span className="text-[11px] text-[#737373] dark:text-[#8e8e8e] shrink-0">
                              {timeAgo}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] mt-0.5 leading-snug line-clamp-2">
                            {n.message || n.desc}
                          </p>
                        </div>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] shrink-0 mt-2" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-[#e5e5e5] dark:border-[#383838] bg-[#f9f9f9] dark:bg-[#212121] text-center rounded-b-2xl">
                <Link
                  href="/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-[12px] font-semibold text-[#10a37f] hover:underline"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-[#e5e5e5] dark:border-[#303030]" />

        {/* User Profile Dropdown / Sign in button */}
        <div className="relative" ref={profileRef}>
          {activeUser ? (
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] transition-colors text-left group cursor-pointer"
            >
              <div className="relative">
                {headerAvatarUrl ? (
                  <Image
                    src={headerAvatarUrl}
                    alt="Avatar"
                    width={30}
                    height={30}
                    className="w-7.5 h-7.5 rounded-full object-cover border border-[#10a37f]/30"
                    unoptimized
                  />
                ) : (
                  <div className="w-7.5 h-7.5 rounded-full bg-[#10a37f] text-white flex items-center justify-center font-bold text-[12px] shadow-xs">
                    {activeUser.firstName
                      ? `${activeUser.firstName[0]}${activeUser.lastName?.[0] || ""}`
                      : "AU"}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#10a37f] border-2 border-white dark:border-[#212121] rounded-full" />
              </div>
              <div className="hidden sm:block text-[13px]">
                <p className="font-semibold text-[#0d0d0d] dark:text-white leading-tight">
                  {activeUser.firstName
                    ? `${activeUser.firstName} ${activeUser.lastName}`
                    : "Authorized User"}
                </p>
                <p className="text-[#737373] dark:text-[#8e8e8e] text-[11px] leading-tight mt-0.5">
                  {activeRoleConfig?.label ?? "Livestock Operator"}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#737373] dark:text-[#8e8e8e] group-hover:text-[#0d0d0d] dark:group-hover:text-white transition-colors" />
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-semibold shadow-xs"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </Link>
          )}

          {/* Profile Dropdown Card */}
          {isProfileOpen && activeUser && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] rounded-2xl shadow-xl py-2 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#383838]">
                <p className="text-[13px] font-semibold text-[#0d0d0d] dark:text-white">
                  {activeUser.firstName
                    ? `${activeUser.firstName} ${activeUser.lastName}`
                    : "Authorized User"}
                </p>
                <p className="text-[12px] text-[#737373] dark:text-[#8e8e8e] truncate">
                  {activeUser.email ?? "Active Session"}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-[#10a37f]/10 text-[#10a37f] rounded-full border border-[#10a37f]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]" />
                    {getRoleDisplayConfig(('farmRole' in activeUser && activeUser.farmRole) || activeUser.role)?.label || "Verified Operator"}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors"
                >
                  <User className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />{" "}
                  My Profile & Roles
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />{" "}
                  Security & Dual-JWT
                </Link>
              </div>

              <div className="pt-1 border-t border-[#e5e5e5] dark:border-[#383838]">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-rose-500 hover:bg-rose-500/10 transition-colors text-left font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
