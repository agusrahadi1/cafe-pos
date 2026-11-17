'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/lib/utils';
import {
  LayoutDashboard,
  LayoutGrid,
  UtensilsCrossed,
  Receipt,
  Table as TableIcon,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Coffee,
  X,
  User as UserIcon,
  Tag,
  Boxes,
  Users,
  Utensils,
  ConciergeBell,
  Percent,
} from 'lucide-react';

interface ModernStaffSidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export default function ModernStaffSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: ModernStaffSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const params = useParams();

  // Multi-tenant slug support
  const tenantSlug = (params?.tenant as string) || '';
  const basePath = tenantSlug ? `/${tenantSlug}` : '';

  const role = user?.role || 'CASHIER';

  const navItems = [
    {
      label: 'Order Board',
      href: `${basePath}/pos`,
      icon: LayoutGrid,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER', 'CASHIER'],
    },
    {
      label: 'Dapur (KDS)',
      href: `${basePath}/kitchen`,
      icon: Utensils,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER', 'KITCHEN', 'CASHIER'],
    },
    {
      label: 'Pelayan (Waiter)',
      href: `${basePath}/waiter`,
      icon: ConciergeBell,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER', 'WAITER', 'CASHIER'],
    },
    {
      label: 'Menu & Harga',
      href: `${basePath}/admin/menu`,
      icon: UtensilsCrossed,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER'],
    },
    {
      label: 'Meja & QR Meja',
      href: `${basePath}/admin/tables`,
      icon: TableIcon,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER'],
    },
    {
      label: 'Bahan Baku (Stok)',
      href: `${basePath}/admin/inventory`,
      icon: Boxes,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER'],
    },
    {
      label: 'Diskon & Promo',
      href: `${basePath}/admin/discounts`,
      icon: Percent,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER'],
    },
    {
      label: 'Shift Kasir',
      href: `${basePath}/admin/shifts`,
      icon: Clock,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER', 'CASHIER'],
    },
    {
      label: 'Laporan Penjualan',
      href: `${basePath}/admin/reports`,
      icon: BarChart3,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER', 'CASHIER'],
    },
    {
      label: 'Kelola Karyawan',
      href: `${basePath}/admin/users`,
      icon: Users,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER'],
    },
    {
      label: 'Pengaturan Kafe',
      href: `${basePath}/admin/settings`,
      icon: Settings,
      roles: ['SUPERADMIN', 'ADMIN', 'OWNER'],
    },
  ].filter((item) => item.roles.includes(role));

  const logoSrc = user?.company?.logoUrl || user?.company?.logo;

  return (
    <>
      {/* Mobile / Small Tablet Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-white border-r border-stone-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-xs ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-60 xl:w-64'}`}
      >
        {/* 1. Header & Brand Logo */}
        <div className="flex flex-col min-h-0 flex-1">
          <div
            className={`h-16 flex items-center border-b border-stone-100 shrink-0 relative transition-all ${
              collapsed ? 'justify-center px-2' : 'justify-between px-4'
            }`}
          >
            <Link
              href={`${basePath}/pos`}
              className={`flex items-center gap-3 min-w-0 group ${
                collapsed ? 'justify-center' : 'overflow-hidden'
              }`}
              title={user?.company?.name || 'Café POS'}
            >
              {logoSrc ? (
                <img
                  src={getImageUrl(logoSrc)}
                  alt="Logo"
                  className="w-10 h-10 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
              )}

              {!collapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-base text-stone-900 tracking-tight truncate">
                      {user?.company?.name || 'Mokka POS'}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-stone-400 truncate">
                    Point of Sale System
                  </p>
                </div>
              )}
            </Link>

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Collapse / Expand Toggle Button on Desktop & Tablet */}
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className={`hidden lg:flex text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer ${
                collapsed
                  ? 'absolute -right-3 top-5 w-6 h-6 rounded-full bg-white border border-stone-200 shadow-md items-center justify-center z-20'
                  : 'p-1.5 rounded-xl'
              }`}
              title={collapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-stone-600 hover:text-orange-600" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 2. Navigation List */}
          <nav
            className={`p-3 space-y-1.5 overflow-y-auto flex-1 scrollbar-thin ${
              collapsed ? 'flex flex-col items-center' : ''
            }`}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              // Check active status: exact match or subpath match
              const isActive =
                pathname === item.href ||
                (item.href !== `${basePath}/pos` && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-2xl text-xs font-bold transition-all group ${
                    collapsed
                      ? 'w-11 h-11 justify-center'
                      : 'gap-3.5 px-3.5 py-2.5 w-full'
                  } ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 shadow-2xs font-extrabold ring-1 ring-orange-200/80'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-orange-600' : 'text-stone-400 group-hover:text-stone-600'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 tracking-tight">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 3. Bottom Profile & Logout */}
        <div className="p-2.5 sm:p-3 border-t border-stone-100 bg-stone-50/50 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm shadow-2xs cursor-pointer"
                title={`${user?.fullName || 'Staf'} (${user?.role || 'Kasir'})`}
              >
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-8 h-8 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs shrink-0">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>

                <div className="truncate">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {user?.fullName || 'Staf Kasir'}
                  </p>
                  <p className="text-[10px] text-stone-400 font-semibold truncate capitalize">
                    {user?.role?.toLowerCase() || 'kasir'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
