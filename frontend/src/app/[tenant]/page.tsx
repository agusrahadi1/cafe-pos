'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Coffee,
  LayoutDashboard,
  UtensilsCrossed,
  ConciergeBell,
  ArrowRight,
  MapPin,
  Phone,
  Store,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  QrCode,
  LogIn,
} from 'lucide-react';
import Footer from '@/components/layout/Footer';
import CustomerPwaBlocker from '@/components/pwa/CustomerPwaBlocker';

export default function TenantPortalPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params?.tenant as string;

  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tenantSlug) return;
    const fetchTenant = async () => {
      try {
        const res = await api.get<any>(`/tenants/resolve/${tenantSlug}`);
        if (res) {
          setTenant(res);
        }
      } catch (err: any) {
        setError(err?.message || 'Kafe tidak ditemukan atau akses ditangguhkan.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-gray-100 space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Akses Kafe Tidak Tersedia</h2>
          <p className="text-xs text-gray-500">{error || 'Alamat URL kafe tidak valid.'}</p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-block py-2.5 px-5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition"
            >
              Kembali ke Beranda Platform
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-orange-50/40 text-gray-800 flex flex-col justify-between">
      <CustomerPwaBlocker />
      {/* Dynamic Tenant Navigation Header */}
      <header className="border-b border-amber-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-10 h-10 object-contain rounded-xl bg-white p-1 border border-amber-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
                <Coffee className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">{tenant.name}</h1>
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  {tenant.plan?.name || 'Pro'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{tenant.tagline || 'Cafe POS & Ordering Platform'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`/${tenantSlug}/login`}
              className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Staf</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/80 text-amber-900 rounded-full text-xs font-semibold">
            <Store className="w-3.5 h-3.5 text-amber-700" />
            <span>Gerai Resmi {tenant.name}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Portal Operasional & Pelayanan
          </h2>

          <p className="text-sm text-gray-600">
            {tenant.tagline || 'Sistem kasir cepat, pesanan meja QR otomatis, dan operasional dapur terpadu.'}
          </p>

          {(tenant.address || tenant.phone) && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 pt-1">
              {tenant.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  {tenant.address}
                </span>
              )}
              {tenant.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  {tenant.phone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Operational Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: POS Kasir */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">POS Kasir & Meja</h3>
              <p className="text-xs text-gray-500">
                Input pesanan langsung, cetak struk thermal, dan proses pembayaran kasir.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50">
              <a
                href={`/${tenantSlug}/pos`}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>Buka POS Kasir</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Dapur */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-700 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Display Dapur (KDS)</h3>
              <p className="text-xs text-gray-500">
                Layar antrean tiket pesanan dapur realtime untuk koki dan barista.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50">
              <a
                href={`/${tenantSlug}/kitchen`}
                className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <span>Display Dapur</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 3: Pelayan */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <ConciergeBell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Pelayan / Waiter</h3>
              <p className="text-xs text-gray-500">
                Panggilan meja pelanggan dan status siap antar pesanan makanan.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50">
              <a
                href={`/${tenantSlug}/waiter`}
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <span>Layar Pelayan</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 4: Admin Kafe */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Admin & Menu Kafe</h3>
              <p className="text-xs text-gray-500">
                Kelola daftar menu, meja & QR, laporan penjualan, dan profil kafe.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50">
              <a
                href={`/${tenantSlug}/admin/menu`}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <span>Kelola Kafe</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer tenantName={tenant?.name} isCompact={true} />
    </div>
  );
}

