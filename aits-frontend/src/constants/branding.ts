/**
 * AITS System Branding & Logo Constants
 * 
 * Clean Architecture Single Source of Truth for system logos, assets, and branding names.
 */

export const BRAND_ASSETS = {
  /**
   * Primary Circular Emblem Logo (Image 1):
   * Features Green Cow silhouette, embedded QR code, agricultural farm scene, and sun emblem.
   * Best used in: Navigation bar header, collapsed sidebar, mobile view, badges, compact cards, popovers.
   */
  LOGO_ICON: '/images/branding/aits-logo-icon.png',

  /**
   * Full Horizontal Combination Logo (Image 2):
   * Features Circular Emblem + vertical separator bar + official AITS typography & tagline.
   * Best used in: Login page, Register page, Expanded Sidebar header, PDF/Report headers, Verification pages.
   */
  LOGO_FULL: '/images/branding/aits-logo-full.png',

  /**
   * System Favicon SVG
   */
  FAVICON: '/favicon.svg',
} as const;

export const BRAND_INFO = {
  NAME: 'Animal Identification & Traceability System',
  SHORT_NAME: 'AITS',
  TAGLINE: 'National-Scale Livestock Registry & Offline-First Traceability Platform',
  VERSION: 'v2.0',
  ORGANIZATION: 'Ministry of Agriculture & Livestock Development',
} as const;
