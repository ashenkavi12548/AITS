'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BRAND_ASSETS, BRAND_INFO } from '@/constants/branding';

export type LogoVariant = 'icon' | 'full' | 'auto';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AitsLogoProps {
  /**
   * Logo Variant:
   * - 'icon': Image 1 (Circular Cow Emblem logo). Used in compact places like header, navigation, collapsed sidebar, badges.
   * - 'full': Image 2 (Full Horizontal Logo with AITS typography). Used in Login, Register, Expanded Sidebar header, Reports.
   * - 'auto': Renders 'full' when showText is true, or 'icon' when showText is false.
   */
  variant?: LogoVariant;
  size?: LogoSize;
  showText?: boolean;
  subtitle?: string;
  badge?: string;
  href?: string;
  className?: string;
  priority?: boolean;
  lightText?: boolean;
}

const iconSizeMap: Record<LogoSize, { container: string; imgSize: number; title: string; sub: string; badge: string }> = {
  xs: {
    container: 'w-6 h-6',
    imgSize: 24,
    title: 'text-xs',
    sub: 'text-[9px]',
    badge: 'text-[9px] px-1 py-0.2',
  },
  sm: {
    container: 'w-8 h-8',
    imgSize: 32,
    title: 'text-sm',
    sub: 'text-[10.5px]',
    badge: 'text-[10px] px-1.5 py-0.5',
  },
  md: {
    container: 'w-10 h-10',
    imgSize: 40,
    title: 'text-base',
    sub: 'text-xs',
    badge: 'text-[11px] px-2 py-0.5',
  },
  lg: {
    container: 'w-12 h-12',
    imgSize: 48,
    title: 'text-lg',
    sub: 'text-xs',
    badge: 'text-xs px-2.5 py-0.5',
  },
  xl: {
    container: 'w-16 h-16',
    imgSize: 64,
    title: 'text-2xl',
    sub: 'text-sm',
    badge: 'text-xs px-3 py-1',
  },
  '2xl': {
    container: 'w-24 h-24',
    imgSize: 96,
    title: 'text-3xl',
    sub: 'text-base',
    badge: 'text-sm px-3.5 py-1',
  },
};

const LOGO_FULL_ASPECT_RATIO = 1330 / 1182;

const fullSizeMap: Record<LogoSize, { heightClass: string; heightPx: number; widthPx: number }> = {
  xs: { heightClass: 'h-7', heightPx: 28, widthPx: Math.round(28 * LOGO_FULL_ASPECT_RATIO) },
  sm: { heightClass: 'h-9', heightPx: 36, widthPx: Math.round(36 * LOGO_FULL_ASPECT_RATIO) },
  md: { heightClass: 'h-11', heightPx: 44, widthPx: Math.round(44 * LOGO_FULL_ASPECT_RATIO) },
  lg: { heightClass: 'h-14', heightPx: 56, widthPx: Math.round(56 * LOGO_FULL_ASPECT_RATIO) },
  xl: { heightClass: 'h-20', heightPx: 80, widthPx: Math.round(80 * LOGO_FULL_ASPECT_RATIO) },
  '2xl': { heightClass: 'h-28', heightPx: 112, widthPx: Math.round(112 * LOGO_FULL_ASPECT_RATIO) },
};

/**
 * Universal AITS System Brand Logo Component
 * Clean Architecture Component supporting both Image 1 (Circular Icon) and Image 2 (Full Horizontal Logo)
 */
export default function AitsLogo({
  variant = 'auto',
  size = 'sm',
  showText = false,
  subtitle,
  badge,
  href,
  className = '',
  priority = false,
  lightText = false,
}: AitsLogoProps) {
  // Determine effective variant: if showText is explicitly accompanied by subtitle/badge, use icon with text
  const effectiveVariant: 'icon' | 'full' =
    variant === 'auto' ? (showText && !subtitle && !badge ? 'full' : 'icon') : variant;

  // Render Full Horizontal Logo (Image 2)
  if (effectiveVariant === 'full') {
    const sizeConfig = fullSizeMap[size];
    const fullLogoElement = (
      <div className={`inline-flex items-center group select-none ${className}`}>
        <div className={`relative ${sizeConfig.heightClass} w-auto flex items-center shrink-0`}>
          <Image
            src={BRAND_ASSETS.LOGO_FULL}
            alt={BRAND_INFO.NAME}
            width={sizeConfig.widthPx}
            height={sizeConfig.heightPx}
            className={`${sizeConfig.heightClass} w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] drop-shadow-sm`}
            priority={priority}
          />
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-flex items-center cursor-pointer">
          {fullLogoElement}
        </Link>
      );
    }
    return fullLogoElement;
  }

  // Render Circular Emblem Icon (Image 1)
  const iconConfig = iconSizeMap[size];
  const iconElement = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Image 1: Circular Emblem */}
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden transition-all duration-200 group-hover:scale-105 group-hover:drop-shadow-md ${iconConfig.container}`}
      >
        <Image
          src={BRAND_ASSETS.LOGO_ICON}
          alt={BRAND_INFO.SHORT_NAME}
          width={iconConfig.imgSize}
          height={iconConfig.imgSize}
          className="w-full h-full object-cover rounded-full"
          priority={priority}
        />
      </div>

      {/* Optional Typography alongside Icon */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-bold tracking-tight transition-colors duration-300 ${
                lightText
                  ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]'
                  : 'text-[#0d0d0d] dark:text-white'
              } ${iconConfig.title}`}
            >
              {BRAND_INFO.SHORT_NAME}
            </span>
            {badge && (
              <span
                className={`font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
                  lightText
                    ? 'bg-[#10a37f]/30 text-[#34d399] border border-[#10a37f]/50 shadow-[0_0_12px_rgba(16,163,127,0.35)]'
                    : 'bg-[#10a37f]/15 text-[#10a37f] dark:text-[#10a37f] border border-[#10a37f]/30'
                } ${iconConfig.badge}`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span
              className={`font-medium truncate mt-0.5 transition-colors duration-300 ${
                lightText
                  ? 'text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]'
                  : 'text-[#737373] dark:text-[#8e8e8e]'
              } ${iconConfig.sub}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center cursor-pointer">
        {iconElement}
      </Link>
    );
  }

  return iconElement;
}
