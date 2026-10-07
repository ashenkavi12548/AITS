"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * ScrollReveal: Animates elements into view as the user scrolls down the page (lazy scroll reveal)
 */
export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 700,
  className = "",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getTransform = () => {
    if (isVisible) return "none";
    switch (direction) {
      case "up":
        return "translateY(28px)";
      case "down":
        return "translateY(-28px)";
      case "left":
        return "translateX(-28px)";
      case "right":
        return "translateX(28px)";
      case "scale":
        return "scale(0.96)";
      case "fade":
        return "none";
      default:
        return "translateY(28px)";
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Reading progress bar fixed at the top of the viewport
 */
export function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-60 pointer-events-none bg-linear-to-r from-[#10a37f] via-[#0ea5e9] to-[#10a37f] origin-left transition-transform duration-75 ease-out"
      style={{
        transform: `scaleX(${scrollProgress / 100})`,
      }}
    />
  );
}

/**
 * Floating button to smoothly glide back to the top of the page
 */
export function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 450);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl bg-white/90 dark:bg-[#212121]/90 text-[#0d0d0d] dark:text-white border border-[#e5e5e5] dark:border-[#303030] shadow-lg hover:shadow-xl hover:border-[#10a37f] hover:text-[#10a37f] transition-all duration-200 cursor-pointer backdrop-blur-md group animate-in fade-in zoom-in-75"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}
