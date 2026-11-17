'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, WifiOff, Wifi, Sun, X, Check, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function StaffPwaController() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showOnlineRestored, setShowOnlineRestored] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);

  useEffect(() => {
    // 1. Detect if already running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);

      // Detect iOS device (iPhone/iPad)
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);

      // 2. Capture install prompt on staff screens
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      // App installed listener
      const handleAppInstalled = () => {
        setIsStandalone(true);
        setDeferredPrompt(null);
      };
      window.addEventListener('appinstalled', handleAppInstalled);

      // 3. Online/Offline status listeners
      const handleOnline = () => {
        setIsOnline(true);
        setShowOfflineToast(false);
        setShowOnlineRestored(true);
        setTimeout(() => setShowOnlineRestored(false), 4000);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setShowOfflineToast(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Initialize online status
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // 4. Request Screen Wake Lock (Keeps cashier tablet screen on during shift)
  const toggleWakeLock = async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      alert('Browser perangkat Anda tidak mendukung fitur Layar Kiosk Otomatis (Screen Wake Lock).');
      return;
    }

    if (wakeLockActive && wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
        setWakeLockActive(false);
      } catch (e) {
        console.error('Error releasing wake lock:', e);
      }
    } else {
      try {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        sentinel.addEventListener('release', () => {
          setWakeLockActive(false);
          setWakeLockSentinel(null);
        });
        setWakeLockSentinel(sentinel);
        setWakeLockActive(true);
      } catch (err: any) {
        console.warn('Wake Lock error:', err);
      }
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      alert(
        'Untuk memasang aplikasi di browser ini, buka menu browser (tanda titik tiga atau tanda panah) lalu pilih "Pasang Aplikasi" / "Instal Cafe POS".'
      );
    }
  };

  return (
    <>
      {/* Network Status Floating Banner */}
      {showOfflineToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4 duration-200">
          <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
          <span>Koneksi Internet Terputus. Memeriksa jaringan WiFi kafe...</span>
        </div>
      )}

      {showOnlineRestored && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4 duration-200">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Koneksi Internet Kembali Terhubung! Sistem Online.</span>
        </div>
      )}

      {/* Staff Action Controls (Install POS & Screen Wake Lock) */}
      <div className="flex items-center gap-1.5">
        {/* Screen Wake Lock Button */}
        <button
          type="button"
          onClick={toggleWakeLock}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            wakeLockActive
              ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
              : 'border-stone-200 hover:bg-stone-50 text-stone-600'
          }`}
          title={
            wakeLockActive
              ? 'Layar Kiosk Aktif (Layar tablet tidak akan mati/sleep)'
              : 'Aktifkan Layar Kiosk (Cegah layar tablet mati saat shift)'
          }
        >
          <Sun className={`w-4 h-4 ${wakeLockActive ? 'text-amber-600 fill-amber-500' : ''}`} />
        </button>

        {/* Install POS App Button (Only appears if not already installed as standalone PWA) */}
        {!isStandalone && (deferredPrompt || isIos) && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer animate-pulse"
            title="Pasang Aplikasi Kasir Cafe POS di Desktop / Tablet (Tanpa URL bar)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pasang POS</span>
          </button>
        )}

        {/* Standalone Active Badge */}
        {isStandalone && (
          <div
            className="hidden xl:flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-bold"
            title="Aplikasi berjalan dalam mode PWA Kiosk Standalone"
          >
            <Smartphone className="w-3 h-3 text-emerald-600" />
            <span>App Kiosk</span>
          </div>
        )}
      </div>

      {/* iOS Safari Installation Instruction Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/icon-192x192.png"
                  alt="Cafe POS Icon"
                  className="w-9 h-9 rounded-xl shadow-sm object-cover"
                />
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm leading-tight">Pasang di iPad / iPhone</h4>
                  <p className="text-[10px] text-stone-400 font-medium">Aplikasi POS Kasir Standalone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-3">
              <p>Untuk menjalankan Cafe POS seperti aplikasi iPad/iPhone tanpa bilah browser:</p>
              <div className="space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    Tekan tombol <strong className="text-stone-900">Share</strong> (<Share2 className="w-3.5 h-3.5 inline text-blue-600" /> kotak dengan panah atas) di browser Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    Gulir ke bawah dan pilih <strong className="text-stone-900">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-stone-700" /> Tambah ke Layar Utama).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    Tekan <strong className="text-orange-600 font-extrabold">Add (Tambah)</strong> di pojok kanan atas.
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

