'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  Building2,
  PackageCheck,
  CreditCard,
  BarChart3,
  LogOut,
  ExternalLink,
  Clock,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  History,
} from 'lucide-react';

export default function SuperadminNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Live real-time clock
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Fullscreen toggle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const navLinks = [
    { href: '/superadmin', label: 'Analytics', fullLabel: 'Analytics & Server', icon: BarChart3 },
    { href: '/superadmin/tenants', label: 'Tenan', fullLabel: 'Kelola Tenan', icon: Building2 },
    { href: '/superadmin/plans', label: 'Paket', fullLabel: 'Paket & Kuota', icon: PackageCheck },
    { href: '/superadmin/subscriptions', label: 'Langganan', fullLabel: 'Langganan', icon: CreditCard },
    { href: '/superadmin/audit-logs', label: 'Audit Log', fullLabel: 'Log Aktivitas', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full overflow-visible" ref={profileRef}>
      {/* Top Ambient Pro Stripe */}
      <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xs" />

      {/* Main Header */}
      <div className="bg-[#090d16]/95 backdrop-blur-xl text-white border-b border-slate-800/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Brand Logo (Safe Responsive) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
              <Link href="/superadmin" className="flex items-center gap-2.5 sm:gap-3 group active:scale-95 transition-transform">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200 shrink-0">
                  <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-black tracking-tight text-white text-sm sm:text-base leading-tight">
                      CafePOS
                    </span>
                    <span className="hidden xs:inline-flex px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full items-center gap-1 shrink-0">
                      <Sparkles className="w-2.5 h-2.5" /> Superadmin
                    </span>
                  </div>
                  <p className="hidden sm:flex text-[10px] text-slate-400 mt-0.5 items-center gap-1.5 truncate">
                    <span>Multi-Tenant SaaS</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                    <span className="text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation (Adaptive Fluid Bar) */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 min-w-0 shrink">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-2.5 xl:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xl:inline">{link.fullLabel}</span>
                    <span className="xl:hidden">{link.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Tools & Profile (Safe Fit) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Live Clock (Only on Wide Screen) */}
              {mounted && (
                <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono shadow-inner">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold text-white">{currentTime}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 font-sans text-[11px]">{currentDate}</span>
                </div>
              )}

              {/* Demo Portal Link (Only on XL Screen) */}
              <Link
                href="/demo-cafe"
                target="_blank"
                rel="noreferrer"
                className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition active:scale-95"
                title="Kunjungi Portal Tenan Demo"
              >
                <span>Demo Kafe</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
                className="hidden md:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                    profileOpen
                      ? 'bg-slate-800 border-indigo-500/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    SA
                  </div>
                  <div className="hidden 2xl:flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight">
                      {user?.fullName || 'Superadmin'}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-medium">Root Access</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      profileOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-60 sm:w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-2">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {user?.fullName || 'Superadmin'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                        Superadmin System
                      </span>
                    </div>

                    <Link
                      href="/demo-cafe"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full xl:hidden flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-semibold mb-1"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        <span>Kunjungi Demo Kafe</span>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        <span>Keluar Sistem</span>
                      </div>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                        Logout
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95 shrink-0"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-full max-w-xs bg-slate-950 h-full shadow-2xl z-50 flex flex-col justify-between border-r border-slate-800 text-white animate-in slide-in-from-left duration-200">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">CafePOS</h4>
                    <p className="text-[10px] text-indigo-400">Superadmin Control</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{link.fullLabel}</span>
                      </div>
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-3">
              <Link
                href="/demo-cafe"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition"
              >
                <span>Lihat Demo Kafe</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold text-xs transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Superadmin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
