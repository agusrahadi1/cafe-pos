'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import {
  Menu as MenuIcon,
  Store,
  Clock,
  Volume2,
  VolumeX,
  RotateCw,
  Maximize2,
  Minimize2,
  Bell,
  ShoppingBag,
  ChevronDown,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Sparkles,
  Printer,
  Download,
  Smartphone,
} from 'lucide-react';
import { User } from '@/types';
import StaffPwaController from '@/components/pwa/StaffPwaController';
import PosLiveClock from './PosLiveClock';

export interface PosHeaderProps {
  onOpenMobileSidebar: () => void;
  user: User | null;
  onLogout: () => void;
  currentShift: any;
  onOpenCloseShiftModal: () => void;
  onOpenNewShiftModal: () => void;
  audioMuted: boolean;
  onToggleMute: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  waiterCallsCount: number;
  onOpenWaiterCallsModal: () => void;
  onOpenPrinterSettings: () => void;
  rightDrawerOpen: boolean;
  onToggleRightDrawer: () => void;
}

function PosHeaderComponent({
  onOpenMobileSidebar,
  user,
  onLogout,
  currentShift,
  onOpenCloseShiftModal,
  onOpenNewShiftModal,
  audioMuted,
  onToggleMute,
  refreshing,
  onRefresh,
  isFullscreen,
  onToggleFullscreen,
  waiterCallsCount,
  onOpenWaiterCallsModal,
  onOpenPrinterSettings,
  rightDrawerOpen,
  onToggleRightDrawer,
}: PosHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  const outletName = user?.outlet?.name || user?.company?.name || 'Kasir POS';
  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  const handleLogoutClick = () => {
    setProfileOpen(false);
    if (window.confirm('Yakin ingin keluar dari sesi kasir POS?')) {
      onLogout();
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-2.5 sm:px-5 flex items-center justify-between gap-1.5 sm:gap-2.5 shrink-0 shadow-2xs z-30 select-none">
      {/* ========================================================================= */}
      {/* 1. SISI KIRI: Mobile Menu & Outlet Brand Capsule                          */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
        {/* Mobile Sidebar Hamburger Toggle (Always visible & tap-friendly on mobile) */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Buka Navigasi Samping"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 active:scale-90 transition-transform duration-100 ease-out lg:hidden cursor-pointer shrink-0"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Outlet & Live Status Brand Capsule */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-stone-50/90 border border-stone-200/80 shadow-2xs shrink-0 max-w-[140px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-none">
          <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Store className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-black text-stone-900 tracking-tight truncate max-w-[70px] xs:max-w-[105px] sm:max-w-[180px] md:max-w-[220px]">
              {outletName}
            </span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-stone-300" />
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black text-emerald-700 tracking-wider">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SISI KANAN: Shift, Utilitas Sistem, Notifikasi, Jam & Profil           */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* A. Shift Status Capsule */}
        {currentShift ? (
          <button
            type="button"
            onClick={onOpenCloseShiftModal}
            aria-label="Tutup Shift Kasir"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold active:scale-95 transition-all duration-100 ease-out cursor-pointer shadow-2xs group shrink-0"
            title="Shift kasir aktif. Klik untuk Rekap Kas & Tutup Shift"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline font-extrabold max-w-[110px] truncate text-xs">
              {currentShift.shiftName || 'Shift Aktif'}
            </span>
            <span className="sm:hidden text-[11px] font-extrabold">
              Shift
            </span>
            <span className="hidden md:inline-block px-1.5 py-0.5 bg-emerald-200/80 group-hover:bg-emerald-300 text-[9px] font-black text-emerald-950 rounded-full transition shrink-0 uppercase tracking-wider">
              Tutup
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenNewShiftModal}
            aria-label="Buka Shift Kasir"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black active:scale-95 transition-all duration-100 ease-out cursor-pointer shadow-xs animate-pulse shrink-0"
            title="Shift belum dibuka. Klik untuk Buka Shift dan isi Modal Awal Kasir"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline tracking-tight">Buka Shift</span>
            <span className="sm:hidden text-[11px] font-black">Buka</span>
          </button>
        )}

        {/* B. Segmented Quick Utility Pill (Sound, Refresh, PWA, Fullscreen) - Hidden on Mobile to prevent overcrowding */}
        <div className="hidden md:flex items-center bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 gap-0.5 shadow-2xs">
          {/* Audio Bell Mute Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={audioMuted ? 'Aktifkan Suara Bel Pesanan' : 'Matikan Suara Bel Pesanan'}
            className={`p-1.5 rounded-xl text-xs transition duration-100 active:scale-90 cursor-pointer ${
              audioMuted
                ? 'bg-red-500 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white'
            }`}
            title={audioMuted ? 'Suara Bel Mati (Klik untuk aktifkan)' : 'Suara Bel Aktif (Klik untuk mute)'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Sync / Refresh Data Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Segarkan Data Pesanan"
            className="p-1.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-white active:scale-90 transition duration-100 disabled:opacity-50 cursor-pointer"
            title="Perbarui Sinkronisasi Pesanan"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
          </button>

          {/* Standalone PWA Screen Wake Lock & Controls */}
          <StaffPwaController />

          {/* Fullscreen Kiosk Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Mode Layar Penuh (Kiosk POS)'}
            className="hidden sm:flex p-1.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-white active:scale-90 transition duration-100 cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Mode Layar Penuh (Kiosk)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-orange-600" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* C. Waiter Calls Notification Bell (Always visible if active calls exist, tucked on mobile when empty) */}
        <button
          type="button"
          onClick={onOpenWaiterCallsModal}
          aria-label={`Panggilan Pelayan (${waiterCallsCount} panggilan aktif)`}
          className={`relative p-2 rounded-2xl border border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700 active:scale-90 transition duration-100 shadow-2xs cursor-pointer shrink-0 ${
            waiterCallsCount > 0 ? 'flex' : 'hidden md:flex'
          }`}
          title="Pusat Panggilan Pelayan & Notifikasi Meja"
        >
          <Bell className={`w-4 h-4 ${waiterCallsCount > 0 ? 'text-red-600 animate-bounce' : ''}`} />
          {waiterCallsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-pulse shadow-xs">
              {waiterCallsCount}
            </span>
          )}
        </button>

        {/* D. Thermal Printer Settings Button (Compact on mobile) */}
        <button
          type="button"
          onClick={onOpenPrinterSettings}
          aria-label="Pengaturan Printer Bluetooth Thermal"
          className="p-2 rounded-2xl border border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700 active:scale-90 transition duration-100 shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
          title="Pengaturan Printer Bluetooth Thermal"
        >
          <Printer className="w-4 h-4 text-orange-600" />
          <span className="hidden xl:inline text-[11px] font-bold">Printer</span>
        </button>

        {/* E. High-Performance Isolated Live Clock */}
        <PosLiveClock />

        {/* F. Menu Populer Toggle Button (Desktop/Tablet topbar, accessible in menu on mobile) */}
        <button
          type="button"
          onClick={onToggleRightDrawer}
          aria-label="Buka Katalog Menu Populer"
          className={`hidden md:flex px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all duration-150 items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs shrink-0 ${
            rightDrawerOpen
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/80'
          }`}
          title="Katalog Cepat Menu Populer"
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline text-xs font-extrabold tracking-tight">Menu Populer</span>
        </button>

        {/* G. Interactive User Profile Popover */}
        <div className="relative pl-0.5 sm:pl-2 border-l border-stone-200/80 shrink-0" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-label="Menu Kasir & Profil"
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-2xl hover:bg-stone-100/80 active:scale-95 transition-all duration-100 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
              {userInitials}
            </div>
            <div className="hidden 2xl:block text-left">
              <p className="text-xs font-extrabold text-stone-900 leading-tight">
                {user?.fullName || 'Kasir'}
              </p>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                {user?.role?.toLowerCase() || 'kasir'}
              </p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 hidden sm:block ${
                profileOpen ? 'rotate-180 text-orange-600' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Popover */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl bg-white border border-stone-200/90 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Bio Header */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-stone-900 truncate">
                    {user?.fullName || 'Petugas Kasir'}
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate">{user?.email || 'kasir@cafe.local'}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 font-extrabold text-[9px] uppercase tracking-wider">
                    {user?.role || 'KASIR'}
                  </span>
                </div>
              </div>

              {/* Outlet Info Tile */}
              <div className="px-3 py-2 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2 text-stone-700 min-w-0">
                  <Store className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-bold truncate text-[11px]">{outletName}</span>
                </div>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[9px] rounded-full shrink-0">
                  Online
                </span>
              </div>

              {/* Mobile-Only Quick Utilities Section */}
              <div className="md:hidden py-1 mb-1 border-t border-b border-stone-100 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-2 pt-1">
                  Aksi & Utilitas POS
                </div>

                {/* Refresh Orders */}
                <button
                  type="button"
                  onClick={() => {
                    onRefresh();
                  }}
                  disabled={refreshing}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCw className={`w-4 h-4 text-orange-600 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Segarkan Data Pesanan</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-semibold">{refreshing ? 'Memuat...' : 'Sync'}</span>
                </button>

                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {audioMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                    <span>Suara Bel Notifikasi</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${audioMuted ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {audioMuted ? 'Mati' : 'Aktif'}
                  </span>
                </button>

                {/* Popular Menu Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onToggleRightDrawer();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Katalog Menu Populer</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-semibold">Buka</span>
                </button>
              </div>

              {/* Quick Actions List */}
              <div className="space-y-1 pt-1">
                {currentShift ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenCloseShiftModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] transition-transform text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Rekap & Tutup Shift</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-extrabold">Aktif</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenNewShiftModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50/80 hover:bg-amber-100 active:scale-[0.98] transition-transform text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Buka Shift Baru</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-extrabold">Perlu</span>
                  </button>
                )}

                {/* Printer Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenPrinterSettings();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] transition-transform text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-4 h-4 text-orange-600" />
                    <span>Pengaturan Printer Thermal</span>
                  </div>
                </button>

                {/* Download Android APK Link */}
                <a
                  href="/downloads/CafePOS.apk"
                  download="CafePOS.apk"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] transition-transform text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Unduh APK Android</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                </a>

                <div className="my-1.5 border-t border-stone-100" />

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 active:scale-[0.98] transition-transform text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Keluar dari Kasir (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export const PosHeader = memo(PosHeaderComponent);
export default PosHeader;
