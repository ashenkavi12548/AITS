import React from "react";
import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";

export default function CtaSection() {
  return (
    <section
      id="contact"
      className="py-20 md:py-28 bg-[#0d0d0d] dark:bg-[#0d0d0d] relative overflow-hidden"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#10a37f]/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#0ea5e9]/8 blur-3xl" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#0d0d0d]/50" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10a37f] shadow-2xl shadow-[#10a37f]/30 mb-8">
          <Radio className="w-8 h-8 text-white stroke-[2.2]" />
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
          Bring your livestock records into{" "}
          <span className="text-[#10a37f]">one connected system.</span>
        </h2>

        {/* Supporting text */}
        <p className="text-[17px] text-white/65 leading-relaxed mb-10 max-w-xl mx-auto">
          Start managing animal identity, farm information, and traceability
          records through AITS — the digital livestock identification and
          management platform by Ceylon Nest.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            id="cta-get-started"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold bg-[#10a37f] text-white hover:bg-[#0e8c6d] transition-all duration-200 shadow-lg shadow-[#10a37f]/25 hover:shadow-[#10a37f]/35 hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <Link
            href="/login"
            id="cta-sign-in"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-medium text-white border border-white/20 hover:bg-white/8 hover:border-white/35 transition-all duration-200"
          >
            Sign In
          </Link>
        </div>

        {/* Company tag */}
        <p className="text-white/35 text-[12px] mt-10 font-medium">
          Animal Identification &amp; Traceability System · Ceylon Nest
        </p>
      </div>
    </section>
  );
}
