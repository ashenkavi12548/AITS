import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Tag,
  QrCode,
  Database,
  Route,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#f9f9f9] dark:bg-[#171717]">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-cattle-farm.jpg"
          alt="Modern livestock farm with dairy cattle grazing on a green pasture"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Gradient overlay — left side dark for text readability, right side shows image */}
        <div className="absolute inset-0 bg-linear-to-r from-[#0d0d0d]/88 via-[#0d0d0d]/60 to-[#0d0d0d]/10" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0d0d0d]/40 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-32 w-full">
        <div className="max-w-2xl">
          {/* Tag line badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10a37f]/20 border border-[#10a37f]/35 text-[#10a37f] text-[12.5px] font-semibold tracking-wide uppercase mb-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10a37f] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10a37f]" />
            </span>
            Ceylon Nest · AITS Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
            Digital Livestock{" "}
            <span className="text-[#10a37f]">Identification</span> &amp;
            Traceability
          </h1>

          {/* Subheading */}
          <p className="text-[17px] text-white/75 leading-relaxed mb-10 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-800">
            Manage animal identity, identification records, and traceability
            through one reliable digital platform designed for modern
            agricultural operations.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-5 duration-900">
            <Link
              href="/register"
              id="hero-get-started"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-all duration-200 shadow-lg shadow-[#10a37f]/25 hover:shadow-[#10a37f]/35 hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link
              href="/login"
              id="hero-explore"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-medium text-white border border-white/25 hover:bg-white/10 hover:border-white/40 transition-all duration-200 backdrop-blur-sm cursor-pointer"
            >
              Sign In to Platform
            </Link>
          </div>

          {/* Identity flow pills */}
          <div className="mt-12 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {[
              { icon: Tag, label: "Ear Tag" },
              { icon: QrCode, label: "QR Code" },
              { icon: Database, label: "Digital Record" },
              { icon: Route, label: "Traceability" },
            ].map(({ icon: Icon, label }, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-[12.5px] font-medium backdrop-blur-sm">
                  <Icon className="w-3.5 h-3.5 text-[#10a37f]" />
                  {label}
                </div>
                {i < 3 && (
                  <span className="text-white/35 text-[11px] font-bold">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#value"
        aria-label="Scroll to content"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors"
      >
        <span className="text-[11px] font-medium tracking-widest uppercase">
          Explore
        </span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </a>
    </section>
  );
}
