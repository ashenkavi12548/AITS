import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import ValueSection from '@/components/landing/ValueSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import IdentificationSection from '@/components/landing/IdentificationSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import QrSection from '@/components/landing/QrSection';
import FarmManagementSection from '@/components/landing/FarmManagementSection';
import TraceabilitySection from '@/components/landing/TraceabilitySection';
import ModulesSection from '@/components/landing/ModulesSection';
import TrustSection from '@/components/landing/TrustSection';
import MobileSection from '@/components/landing/MobileSection';
import CtaSection from '@/components/landing/CtaSection';
import LandingFooter from '@/components/landing/LandingFooter';
import HideLandingScrollbar from '@/components/landing/HideLandingScrollbar';
import {
  ScrollReveal,
  ScrollProgressBar,
  ScrollToTopButton,
} from '@/components/landing/ScrollAnimationProvider';

export const metadata: Metadata = {
  title: 'Animal Identification & Traceability System | Ceylon Nest',
  description:
    'Animal Identification & Traceability System for digital livestock identity, farm management, and traceability. Manage animal records, QR identification, and farm operations through AITS by Ceylon Nest.',
  keywords: [
    'animal identification',
    'livestock traceability',
    'farm management',
    'QR livestock',
    'cattle tracking',
    'AITS',
    'Ceylon Nest',
  ],
  openGraph: {
    title: 'Animal Identification & Traceability System | Ceylon Nest',
    description:
      'Manage animal identity, identification records, and traceability through one reliable digital platform.',
    type: 'website',
    siteName: 'AITS by Ceylon Nest',
  },
};

export default function LandingPage() {
  return (
    <div className="landing-page-root min-h-screen bg-white dark:bg-[#212121] text-[#0d0d0d] dark:text-[#ececec] no-scrollbar">
      <ScrollProgressBar />
      <HideLandingScrollbar />
      <LandingNav />
      <main>
        <HeroSection />

        <ScrollReveal direction="up" delay={50}>
          <ValueSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <FeaturesSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <IdentificationSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <HowItWorksSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <QrSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <FarmManagementSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <TraceabilitySection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <ModulesSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <TrustSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <MobileSection />
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <CtaSection />
        </ScrollReveal>
      </main>
      <LandingFooter />
      <ScrollToTopButton />
    </div>
  );
}
