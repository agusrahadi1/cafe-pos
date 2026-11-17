'use client';

import { useEffect } from 'react';

/**
 * CustomerPwaBlocker
 * 
 * Specifically suppresses native browser PWA install prompts (beforeinstallprompt)
 * and related installation UI on customer-facing routes (QR Table Ordering, Menus).
 * This ensures customers scanning QR codes at cafe tables never experience
 * app install banners, infobars, or popups.
 */
export default function CustomerPwaBlocker() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar or install banner from appearing on customer screens
      e.preventDefault();
      // Optionally stop event propagation so no other listeners can trigger it
      e.stopPropagation();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}

