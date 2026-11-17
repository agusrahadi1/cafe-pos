'use client';

import React, { useState, useEffect } from 'react';
import ModernStaffSidebar from './ModernStaffSidebar';
import StaffPwaController from '@/components/pwa/StaffPwaController';
import { useAuth } from '@/context/AuthContext';
import {
  Menu as MenuIcon,
  Calendar,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Store,
} from 'lucide-react';

interface ModernStaffLayoutProps {
  children: React.ReactNode;
}

export default function ModernStaffLayout({ children }: ModernStaffLayoutProps) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-collapse sidebar on tablet screens (< 1280px)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setSidebarCollapsed(true);
    }
  }, []);

  // Fullscreen listener
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

  // Live real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 flex overflow-hidden">
      {/* 1. Modern Responsive Staff Sidebar */}
      <ModernStaffSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar matching POS */}
        <header className="h-16 bg-white border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-2xs z-20">
          {/* Left: Mobile Drawer Trigger & Workspace Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 lg:hidden cursor-pointer"
              title="Buka Menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-stone-900 tracking-tight leading-none">
                  {user?.company?.name || 'Mokka Café'}
                </p>
                <p className="text-[10px] font-semibold text-stone-400 leading-tight mt-0.5">
                  {user?.outlet?.name || 'Outlet Utama'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: PWA & Screen Controls, Fullscreen, Live Clock, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install & Kiosk Wake Lock */}
            <StaffPwaController />

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition cursor-pointer"
              title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Mode Layar Penuh (Kiosk)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-orange-600" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Live Real-time Clock */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-semibold">{currentTimeStr || 'Memuat...'}</span>
            </div>

            {/* User Capsule */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                {user?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-extrabold text-stone-900 leading-tight">
                  {user?.fullName || 'Staf Kasir'}
                </p>
                <p className="text-[10px] text-stone-400 font-semibold capitalize">
                  {user?.role?.toLowerCase() || 'staf'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Page Content Area */}
        <div className="flex-1 overflow-y-auto bg-stone-50/60">
          {children}
        </div>
      </div>
    </div>
  );
}

