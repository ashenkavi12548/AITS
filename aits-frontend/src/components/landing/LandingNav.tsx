"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import ThemeToggle from "@/components/common/ThemeToggle";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Traceability", href: "#traceability" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 dark:bg-[#212121]/95 backdrop-blur-md border-b border-[#e5e5e5] dark:border-[#303030] shadow-xs"
            : "bg-linear-to-b from-black/60 via-black/25 to-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            {/* Brand Wordmark Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group cursor-pointer"
              aria-label="AITS Home"
            >
              <div className="flex flex-col">
                <span
                  className={`font-black text-2xl tracking-tight leading-none transition-colors ${
                    !isScrolled
                      ? "text-white group-hover:text-emerald-300"
                      : "text-[#0d0d0d] dark:text-white group-hover:text-[#10a37f]"
                  }`}
                >
                  AITS<span className="text-[#10a37f]">.</span>
                </span>
                <span
                  className={`text-[9px] font-semibold tracking-widest uppercase mt-0.5 ${
                    !isScrolled
                      ? "text-white/70"
                      : "text-[#737373] dark:text-[#8e8e8e]"
                  }`}
                >
                  Livestock Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className={`px-3.5 py-2 text-[13.5px] font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
                    !isScrolled
                      ? "text-white/85 hover:text-white hover:bg-white/10"
                      : "text-[#5d5d5d] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f]"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTAs & Theme Toggle */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <ThemeToggle
                className={`transition-colors duration-150 ${
                  !isScrolled
                    ? "text-white/85 hover:text-white hover:bg-white/10"
                    : "text-[#5d5d5d] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#ececec] dark:hover:bg-[#2f2f2f]"
                }`}
              />

              {isInitialized && isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4.5 py-2 rounded-xl text-[13.5px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`px-4 py-2 rounded-xl text-[13.5px] font-medium transition-colors duration-150 cursor-pointer ${
                      !isScrolled
                        ? "text-white/90 hover:text-white hover:bg-white/10"
                        : "text-[#5d5d5d] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f]"
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-[13.5px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Actions: Theme Toggle & Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle
                className={`transition-colors duration-150 ${
                  !isScrolled
                    ? "text-white/85 hover:text-white hover:bg-white/10"
                    : "text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f]"
                }`}
              />
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  !isScrolled
                    ? "text-white hover:bg-white/10"
                    : "text-[#5d5d5d] dark:text-[#b4b4b4] hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f] hover:text-[#0d0d0d] dark:hover:text-white"
                }`}
                aria-label={isMobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileOpen}
              >
                {isMobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed top-16 sm:top-18 left-0 right-0 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#303030] shadow-lg px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="block px-3.5 py-2.5 text-[14px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] rounded-xl transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-[#e5e5e5] dark:border-[#303030] flex flex-col gap-2">
              <div className="flex items-center justify-between px-3.5 py-1 text-[13px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                <span className="font-medium">Toggle Theme</span>
                <ThemeToggle />
              </div>
              {isInitialized && isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-center text-[#5d5d5d] dark:text-[#b4b4b4] border border-[#e5e5e5] dark:border-[#303030] hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] transition-colors cursor-pointer"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-colors cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
