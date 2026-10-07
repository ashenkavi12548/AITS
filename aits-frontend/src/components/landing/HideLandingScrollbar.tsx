'use client';

import { useEffect } from 'react';

/**
 * Utility component that hides the main browser scrollbar while on the landing page
 * and automatically restores it when navigating to any other route.
 */
export default function HideLandingScrollbar() {
  useEffect(() => {
    document.documentElement.classList.add('landing-hide-scrollbar');
    document.body.classList.add('landing-hide-scrollbar');

    return () => {
      document.documentElement.classList.remove('landing-hide-scrollbar');
      document.body.classList.remove('landing-hide-scrollbar');
    };
  }, []);

  return null;
}
