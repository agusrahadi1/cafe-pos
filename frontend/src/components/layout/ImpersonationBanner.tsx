'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken, setStoredUser } from '@/lib/api';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export default function ImpersonationBanner() {
  const router = useRouter();
  const [impersonating, setImpersonating] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [reverting, setReverting] = useState(false);

  useEffect(() => {
    const checkImpersonation = () => {
      if (typeof window !== 'undefined') {
        const backupToken = localStorage.getItem('superadmin_impersonate_backup');
        const dataStr = localStorage.getItem('superadmin_impersonate_data');
        if (backupToken && dataStr) {
          try {
            const data = JSON.parse(dataStr);
            setTenantName(data?.tenantName || 'Tenan');
            setImpersonating(true);
            return;
          } catch (e) {}
        }
      }
      setImpersonating(false);
    };

    checkImpersonation();
    // Re-check periodically or on storage event
    window.addEventListener('storage', checkImpersonation);
    return () => window.removeEventListener('storage', checkImpersonation);
  }, []);

  const handleReturnToSuperadmin = () => {
    setReverting(true);
    try {
      const backupToken = localStorage.getItem('superadmin_impersonate_backup');
      const backupUserStr = localStorage.getItem('superadmin_impersonate_user');

      if (backupToken && backupUserStr) {
        setAuthToken(backupToken);
        const backupUser = JSON.parse(backupUserStr);
        setStoredUser(backupUser);
      }

      localStorage.removeItem('superadmin_impersonate_backup');
      localStorage.removeItem('superadmin_impersonate_user');
      localStorage.removeItem('superadmin_impersonate_data');

      // Hard redirect to superadmin to clear cached memory state cleanly
      window.location.href = '/superadmin/tenants';
    } catch (e) {
      console.error('Failed to revert impersonation', e);
      window.location.href = '/superadmin/login';
    }
  };

  if (!impersonating) return null;

  return (
    <aside aria-label="Status Impersonasi Superadmin" className="sticky top-0 z-[9999] w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-lg border-b border-amber-400/40 px-3 py-2 animate-in slide-in-from-top-2 duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wider text-[11px] bg-black/20 px-1.5 py-0.5 rounded mr-1.5">
              Superadmin Ghost Mode
            </span>
            <span>
              Anda sedang masuk ke portal tenan <strong>{tenantName}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReturnToSuperadmin}
          disabled={reverting}
          className="bg-slate-950 hover:bg-black text-amber-300 hover:text-white px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer border border-amber-400/30"
        >
          {reverting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Memulihkan Sesi...</span>
            </>
          ) : (
            <>
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Superadmin Console</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
