'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/lib/utils';
import {
  Coffee,
  LayoutDashboard,
  UtensilsCrossed,
  ConciergeBell,
  QrCode,
  BarChart3,
  LogOut,
  User as UserIcon,
  Store,
  ShieldAlert,
  Boxes,
  Clock,
  Users,
  ChevronDown,
  Menu,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Laptop,
  Percent,
} from 'lucide-react';

interface NavItem {
  label: string;
  sublabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  highlight?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export default function StaffNavbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const params = useParams();

  // Multi-tenant slug support
  const tenantSlug = (params?.tenant as string) || '';
  const basePath = tenantSlug ? `/${tenantSlug}` : '';

  // States
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown and mobile menu when navigating
  useEffect(() => {
    setActiveDropdown(null);
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

  if (!user) return null;

  const role = user.role;

  // Role Badge Styling
  const roleBadgeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    OWNER: { label: 'Owner', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    ADMIN: { label: 'Admin', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    CASHIER: { label: 'Kasir', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    KITCHEN: { label: 'Dapur / Bar', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    WAITER: { label: 'Pelayan', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    SUPERADMIN: { label: 'Superadmin', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  };

  const currentRoleBadge = roleBadgeConfig[role] || {
    label: role,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };

  // Helper to check if a path is active
  const isPathActive = (href: string) => {
    const target = `${basePath}${href}`;
    return pathname === target;
  };

  // 1. Core Quick-Launch Operational Tabs (Left side)
  const coreLaunchers: NavItem[] = [
    {
      label: 'POS Kasir',
      sublabel: 'Transaksi & Meja',
      href: '/pos',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OWNER', 'CASHIER'],
      highlight: true,
    },
    {
      label: 'Dapur / KDS',
      sublabel: 'Antrean Tiket Pesanan',
      href: '/kitchen',
      icon: UtensilsCrossed,
      roles: ['ADMIN', 'OWNER', 'KITCHEN', 'CASHIER'],
    },
    {
      label: 'Pelayan',
      sublabel: 'Panggilan & Antar Meja',
      href: '/waiter',
      icon: ConciergeBell,
      roles: ['ADMIN', 'OWNER', 'WAITER', 'CASHIER'],
    },
  ].filter((item) => item.roles.includes(role));

  // 2. Structured Dropdown Groups (Middle)
  const navGroups: NavGroup[] = [
    {
      id: 'catalog',
      label: 'Katalog & Meja',
      icon: Coffee,
      items: [
        {
          label: 'Menu & Harga',
          sublabel: 'Kelola makanan, minuman & varian',
          href: '/admin/menu',
          icon: Coffee,
          roles: ['ADMIN', 'OWNER'],
        },
        {
          label: 'Diskon & Promosi',
          sublabel: 'Atur diskon menu & promo launching',
          href: '/admin/discounts',
          icon: Percent,
          roles: ['ADMIN', 'OWNER'],
        },
        {
          label: 'Meja & QR Code',
          sublabel: 'Atur nomor meja & barcode order',
          href: '/admin/tables',
          icon: QrCode,
          roles: ['ADMIN', 'OWNER'],
        },
        {
          label: 'Inventori & Resep',
          sublabel: 'Stok bahan baku & perhitungan HPP',
          href: '/admin/inventory',
          icon: Boxes,
          roles: ['ADMIN', 'OWNER'],
        },
      ].filter((item) => item.roles.includes(role)),
    },
    {
      id: 'analytics',
      label: 'Laporan & Kas',
      icon: BarChart3,
      items: [
        {
          label: 'Laporan Keuangan',
          sublabel: 'Ringkasan omzet, kas & rincian transaksi',
          href: '/admin/reports',
          icon: BarChart3,
          roles: ['ADMIN', 'OWNER', 'SUPERADMIN', 'CASHIER'],
        },
        {
          label: 'Shift Kasir',
          sublabel: 'Buka/tutup kasir & rekap uang tunai',
          href: '/admin/shifts',
          icon: Clock,
          roles: ['ADMIN', 'OWNER', 'CASHIER'],
        },
      ].filter((item) => item.roles.includes(role)),
    },
    {
      id: 'system',
      label: 'Konfigurasi',
      icon: Store,
      items: [
        {
          label: 'Kelola Karyawan',
          sublabel: 'Akun staf kasir, koki & pelayan',
          href: '/admin/users',
          icon: Users,
          roles: ['ADMIN', 'OWNER'],
        },
        {
          label: 'Pengaturan Kafe',
          sublabel: 'Profil toko, struk & printer',
          href: '/admin/settings',
          icon: Store,
          roles: ['ADMIN', 'OWNER'],
        },
        {
          label: 'Superadmin Console',
          sublabel: 'Pusat kendali multi-tenant SaaS',
          href: '/superadmin',
          icon: ShieldAlert,
          roles: ['SUPERADMIN'],
        },
      ].filter((item) => item.roles.includes(role)),
    },
  ].filter((group) => group.items.length > 0);

  const toggleDropdown = (id: string) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  const getCompanyLogo = () => {
    return user?.company?.logoUrl || user?.company?.logo;
  };

  const logoSrc = getCompanyLogo();

  return (
    <header className="sticky top-0 z-40 w-full" ref={navRef}>
      {/* Top Ambient Pro Glow Accent Line */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-xs" />

      {/* Main Glassmorphic Header */}
      <div className="backdrop-blur-xl bg-white/92 border-b border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* LEFT: Brand Identity & Outlet Status */}
            <div className="flex items-center gap-4 lg:gap-6 shrink-0">
              <Link
                href={`${basePath}/pos`}
                className="group flex items-center gap-2.5 transition-transform duration-150 active:scale-95"
              >
                {logoSrc ? (
                  <img
                    src={getImageUrl(logoSrc)}
                    alt={user?.company?.name || 'Cafe Logo'}
                    className="w-10 h-10 object-contain rounded-2xl bg-amber-50/80 p-1 border border-amber-200/70 shadow-xs group-hover:border-amber-400 transition"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/30 transition">
                    <Coffee className="w-5 h-5 drop-shadow" />
                  </div>
                )}

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-stone-900 text-base tracking-tight leading-tight group-hover:text-amber-700 transition">
                      {user?.company?.name || 'Cafe POS'}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" /> PRO
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1 font-medium truncate max-w-[120px] text-stone-600">
                      <Store className="w-3 h-3 text-amber-600 shrink-0" />
                      {user?.outlet?.name || 'Outlet Utama'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-stone-300 hidden sm:inline" />
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* CENTER: Desktop Pro Navigation */}
            <nav className="hidden lg:flex items-center space-x-1.5 xl:space-x-2">
              {/* 1. Core Fast-Action Operational Launchers */}
              {coreLaunchers.map((item) => {
                const Icon = item.icon;
                const active = isPathActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={`${basePath}${item.href}`}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                      active
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 scale-[1.02]'
                        : item.highlight
                        ? 'bg-amber-50/80 text-amber-900 hover:bg-amber-100 hover:text-amber-950 border border-amber-200/60'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-amber-600'}`} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                    )}
                  </Link>
                );
              })}

              {/* Subtle Vertical Divider */}
              {coreLaunchers.length > 0 && navGroups.length > 0 && (
                <div className="h-5 w-px bg-stone-200 mx-1" />
              )}

              {/* 2. Pro Dropdown Groups */}
              {navGroups.map((group) => {
                const isGroupActive = group.items.some((it) => isPathActive(it.href));
                const isOpen = activeDropdown === group.id;
                const GroupIcon = group.icon;

                return (
                  <div key={group.id} className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown(group.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isGroupActive
                          ? 'bg-amber-50 text-amber-900 border border-amber-200/80 font-bold shadow-2xs'
                          : isOpen
                          ? 'bg-stone-100 text-stone-900'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                      }`}
                    >
                      <GroupIcon className={`w-4 h-4 ${isGroupActive ? 'text-amber-600' : 'text-stone-500'}`} />
                      <span>{group.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 text-stone-400 ${
                          isOpen ? 'rotate-180 text-amber-600' : ''
                        }`}
                      />
                    </button>

                    {/* Floating Dropdown Card */}
                    {isOpen && (
                      <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white/95 backdrop-blur-2xl border border-stone-200/90 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3 py-2 border-b border-stone-100 mb-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            {group.label}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            const active = isPathActive(item.href);

                            return (
                              <Link
                                key={item.href}
                                href={`${basePath}${item.href}`}
                                onClick={() => setActiveDropdown(null)}
                                className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                                  active
                                    ? 'bg-amber-50/90 border border-amber-200/70 text-amber-900'
                                    : 'hover:bg-stone-50 text-stone-700 hover:text-stone-950'
                                }`}
                              >
                                <div
                                  className={`p-2 rounded-xl transition-colors shrink-0 ${
                                    active
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-stone-100 text-stone-600 group-hover:bg-amber-100 group-hover:text-amber-800'
                                  }`}
                                >
                                  <ItemIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold leading-none">
                                      {item.label}
                                    </span>
                                    {active ? (
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-transform" />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-400 mt-1 line-clamp-1 leading-tight">
                                    {item.sublabel}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* RIGHT: Tools, Live Clock, Fullscreen & Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Live Digital Clock & Date */}
              {mounted && (
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/70 text-stone-700 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="font-bold text-stone-800">{currentTime}</span>
                    <span className="text-[10px] text-stone-400">|</span>
                    <span className="text-[11px] text-stone-500 font-sans">{currentDate}</span>
                  </div>
                </div>
              )}

              {/* Fullscreen Mode Toggle Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Kiosk)'}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-stone-200/80 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition shadow-2xs cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* User Profile Dropdown Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('profile')}
                  className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl border transition-all duration-150 ${
                    activeDropdown === 'profile'
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
                      : 'border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/80'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase">
                    {user.fullName ? user.fullName.slice(0, 2) : <UserIcon className="w-4 h-4" />}
                  </div>

                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[110px]">
                      {user.fullName}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md border w-fit ${currentRoleBadge.bg} ${currentRoleBadge.text} ${currentRoleBadge.border}`}
                    >
                      {currentRoleBadge.label}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform hidden sm:block ${
                      activeDropdown === 'profile' ? 'rotate-180 text-amber-600' : ''
                    }`}
                  />
                </button>

                {/* Profile Floating Menu Card */}
                {activeDropdown === 'profile' && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl border border-stone-200/90 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-3 p-2 bg-stone-50/80 rounded-xl border border-stone-100 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
                        {user.fullName ? user.fullName.slice(0, 2) : <UserIcon className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate leading-tight">
                          {user.fullName}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">{user.email}</p>
                        <div className="mt-1">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${currentRoleBadge.bg} ${currentRoleBadge.text} ${currentRoleBadge.border}`}
                          >
                            {currentRoleBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {user.outlet && (
                        <div className="flex items-center gap-2 px-2.5 py-2 text-stone-600 text-[11px] border-b border-stone-100">
                          <Store className="w-3.5 h-3.5 text-stone-400" />
                          <span className="truncate">Gerai: {user.outlet.name}</span>
                        </div>
                      )}

                      {role !== 'CASHIER' && role !== 'WAITER' && role !== 'KITCHEN' && (
                        <Link
                          href={`${basePath}/admin/settings`}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition font-medium"
                        >
                          <Store className="w-3.5 h-3.5 text-stone-500" />
                          <span>Pengaturan Toko</span>
                        </Link>
                      )}

                      {(role === 'ADMIN' || role === 'OWNER' || role === 'CASHIER') && (
                        <Link
                          href={`${basePath}/admin/shifts`}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition font-medium"
                        >
                          <Clock className="w-3.5 h-3.5 text-stone-500" />
                          <span>Shift Kasir Saya</span>
                        </Link>
                      )}

                      <div className="pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={logout}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            <span>Keluar Sistem</span>
                          </div>
                          <span className="text-[10px] bg-red-100/60 text-red-700 px-1.5 py-0.5 rounded">
                            Logout
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu Navigasi"
                className="lg:hidden p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE SLIDE-OVER DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Drawer Content */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl z-50 flex flex-col justify-between overflow-y-auto border-r border-stone-200">
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm leading-tight">
                      {user?.company?.name || 'Cafe POS'}
                    </h3>
                    <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {user?.outlet?.name || 'Outlet Utama'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Menu Sections */}
              <div className="p-4 space-y-5">
                {/* 1. Core Fast Action */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 px-1">
                    Operasional Utama
                  </p>
                  <div className="space-y-1">
                    {coreLaunchers.map((item) => {
                      const Icon = item.icon;
                      const active = isPathActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={`${basePath}${item.href}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition ${
                            active
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-stone-700 hover:bg-amber-50 hover:text-amber-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-amber-600'}`} />
                            <span>{item.label}</span>
                          </div>
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Grouped Items */}
                {navGroups.map((group) => (
                  <div key={group.id}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 px-1">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = isPathActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={`${basePath}${item.href}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition ${
                              active
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <ItemIcon className={`w-4 h-4 ${active ? 'text-amber-600' : 'text-stone-500'}`} />
                              <span>{item.label}</span>
                            </div>
                            {active ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Footer: User & Logout */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/50 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user.fullName ? user.fullName.slice(0, 2) : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-900 truncate">{user.fullName}</p>
                  <p className="text-[10px] text-stone-500 truncate">{user.email}</p>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${currentRoleBadge.bg} ${currentRoleBadge.text} ${currentRoleBadge.border}`}
                >
                  {currentRoleBadge.label}
                </span>
              </div>

              {/* Real-time Clock in Mobile */}
              {mounted && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-stone-200/80 text-[11px] font-mono text-stone-600">
                  <span className="font-semibold">{currentDate}</span>
                  <span className="font-bold text-amber-700">{currentTime}</span>
                </div>
              )}

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
