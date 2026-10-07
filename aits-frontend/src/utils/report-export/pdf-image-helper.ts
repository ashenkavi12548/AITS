import { BRAND_ASSETS } from '@/constants/branding';

interface LoadedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

const logoCache: Record<string, LoadedImageInfo | null> = {};

/**
 * Loads an image from an absolute or relative URL and converts it to a Data URL (base64 PNG),
 * calculating aspect ratio and caching the result.
 * Safe against load errors (returns null instead of throwing).
 */
export async function loadBase64Image(src: string): Promise<LoadedImageInfo | null> {
  if (logoCache[src] !== undefined) {
    return logoCache[src];
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      logoCache[src] = null;
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          logoCache[src] = null;
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const width = canvas.width;
        const height = canvas.height;
        const aspectRatio = height > 0 ? width / height : 1;

        const info: LoadedImageInfo = { dataUrl, width, height, aspectRatio };
        logoCache[src] = info;
        resolve(info);
      } catch (err) {
        console.warn('Failed to convert image to Data URL for PDF:', err);
        logoCache[src] = null;
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn(`Failed to load image asset from ${src} for PDF generation.`);
      logoCache[src] = null;
      resolve(null);
    };

    img.src = src;
  });
}

/**
 * Loads the official AITS Full Logo asset for PDF reports.
 */
export async function getOfficialAitsLogo(): Promise<LoadedImageInfo | null> {
  // First try full horizontal logo
  const fullLogo = await loadBase64Image(BRAND_ASSETS.LOGO_FULL);
  if (fullLogo) return fullLogo;

  // Fallback to circular icon emblem if full logo fails
  return await loadBase64Image(BRAND_ASSETS.LOGO_ICON);
}
