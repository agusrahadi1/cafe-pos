'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import SuperadminNavbar from '@/components/layout/SuperadminNavbar';
import { formatRupiah } from '@/lib/utils';
import { Tenant } from '@/types';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Plus,
  ArrowUpRight,
  Loader2,
  ExternalLink,
  Database,
  Server,
  Cpu,
  HardDrive,
  MessageSquare,
  Download,
  CheckCircle2,
  BellRing,
  Search,
  Activity,
  Sparkles,
  Clock,
  ArrowRight,
  Wallet,
  Check,
  Layers,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

export default function SuperadminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<any>(null);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [backupToast, setBackupToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Quick filter tenan
  const [tenantSearch, setTenantSearch] = useState('');

  // Payout Fee & Platform Withdrawals
  const [payoutFee, setPayoutFee] = useState<number>(4500);
  const [inputPayoutFee, setInputPayoutFee] = useState<string>('4.500');
  const [savingPayoutFee, setSavingPayoutFee] = useState<boolean>(false);
  const [payoutFeeToast, setPayoutFeeToast] = useState<string>('');
  const [platformWithdrawals, setPlatformWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/superadmin/login');
      } else if (user.role !== 'SUPERADMIN') {
        router.push('/login');
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [analyticsRes, tenantsRes, healthRes, payoutRes, withdrawalsRes] = await Promise.all([
        api.get<any>('/superadmin/analytics'),
        api.get<Tenant[]>('/superadmin/tenants'),
        api.get<any>('/superadmin/server-health').catch(() => null),
        api.get<any>('/superadmin/payout-settings').catch(() => null),
        api.get<any>('/superadmin/withdrawals?limit=10').catch(() => null),
      ]);
      if (analyticsRes) setAnalytics(analyticsRes);
      if (tenantsRes) setRecentTenants(tenantsRes.slice(0, 8));
      if (healthRes) setServerHealth(healthRes);
      if (payoutRes?.payoutFee !== undefined) {
        setPayoutFee(payoutRes.payoutFee);
        setInputPayoutFee(new Intl.NumberFormat('id-ID').format(payoutRes.payoutFee));
      }
      if (withdrawalsRes?.items) {
        setPlatformWithdrawals(withdrawalsRes.items);
      }
      setLastSyncTime(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (e) {
      console.error('Error fetching superadmin data:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const handleSavePayoutFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = parseFloat(inputPayoutFee.replace(/\D/g, ''));
    if (isNaN(clean) || clean < 0) {
      alert('Masukkan nominal biaya admin yang valid');
      return;
    }

    setSavingPayoutFee(true);
    try {
      const res = await api.put<any>('/superadmin/payout-settings', { payoutFee: clean });
      setPayoutFee(clean);
      setPayoutFeeToast(res?.message || 'Biaya admin penarikan berhasil diperbarui');
      setTimeout(() => setPayoutFeeToast(''), 4000);
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan biaya admin penarikan');
    } finally {
      setSavingPayoutFee(false);
    }
  };

  const handleTriggerBackup = async () => {
    if (!confirm('Lakukan snapshot backup database PostgreSQL sekarang?')) return;
    setBackingUp(true);
    try {
      const res = await api.post<any>('/superadmin/database/backup', {});
      setBackupToast(res?.message || 'Snapshot database berhasil dibuat dan diarsipkan!');
      setTimeout(() => setBackupToast(''), 4000);
      const healthRes = await api.get<any>('/superadmin/server-health').catch(() => null);
      if (healthRes) setServerHealth(healthRes);
    } catch (err: any) {
      alert(err?.message || 'Gagal membuat backup');
    } finally {
      setBackingUp(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      fetchData();
    }
  }, [user]);

  // Filtered recent tenants
  const filteredTenants = useMemo(() => {
    if (!tenantSearch.trim()) return recentTenants;
    const q = tenantSearch.toLowerCase();
    return recentTenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.owner?.email?.toLowerCase().includes(q) ||
        t.owner?.fullName?.toLowerCase().includes(q)
    );
  }, [recentTenants, tenantSearch]);

  // Greeting time
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 11) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  // Skeleton loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
        <SuperadminNavbar />
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
          {/* Skeleton Header */}
          <div className="h-20 bg-slate-900/60 border border-slate-800/60 rounded-2xl animate-pulse flex items-center justify-between px-6" />

          {/* Skeleton KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 bg-slate-900/50 border border-slate-800/60 rounded-2xl animate-pulse p-5 space-y-3"
              >
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-8 bg-slate-800 rounded w-2/3" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>

          {/* Skeleton Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
            <div className="h-72 bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const activeTenantsCount = analytics?.tenants?.active || 0;
  const totalTenantsCount = analytics?.tenants?.total || 1;
  const tenantActivePercentage = Math.round((activeTenantsCount / Math.max(totalTenantsCount, 1)) * 100);

  // RAM Calculation
  const usedRamMb = serverHealth?.system?.usedMemoryBytes
    ? Math.round(serverHealth.system.usedMemoryBytes / (1024 * 1024))
    : 0;
  const totalRamMb = serverHealth?.system?.totalMemoryBytes
    ? Math.round(serverHealth.system.totalMemoryBytes / (1024 * 1024))
    : 1;
  const ramPercent = totalRamMb > 0 ? Math.min(100, Math.round((usedRamMb / totalRamMb) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.12),transparent)] pointer-events-none -z-10" />

      <SuperadminNavbar />

      {/* Executive Command Header Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-4 sm:px-6 py-5 relative z-10 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
                Root Control Center
              </span>
              <span className="text-slate-600 hidden xs:inline">•</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Core Engine Online
              </span>
              {serverHealth?.database?.latencyMs !== undefined && (
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  Latency: <span className="text-emerald-400 font-bold">{serverHealth.database.latencyMs}ms</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2 truncate">
              <span>{greeting}, {user?.fullName?.split(' ')[0] || 'Superadmin'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoring ekosistem SaaS CafePOS, kesehatan database multi-tenant, dan arus kas langganan.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
            {lastSyncTime && (
              <span className="text-[11px] text-slate-400 hidden xl:flex items-center gap-1.5 mr-1 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                Sync: {lastSyncTime} WIB
              </span>
            )}

            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-xl transition flex items-center gap-1.5 sm:gap-2 text-xs font-bold shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
              <span>{refreshing ? 'Sinkronisasi...' : 'Sinkronkan'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerBackup}
              disabled={backingUp}
              className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-xl transition flex items-center gap-1.5 sm:gap-2 text-xs font-bold shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Buat snapshot cadangan database saat ini"
            >
              {backingUp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>Snapshot DB</span>
            </button>

            <a
              href="/superadmin/tenants"
              className="py-2 sm:py-2.5 px-3.5 sm:px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl transition flex items-center gap-1.5 sm:gap-2 text-xs font-bold shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Daftarkan Tenan</span>
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Global Toast Alerts */}
        {backupToast && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{backupToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setBackupToast('')}
              className="text-emerald-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Expiring Soon Alert Section (Retention Hub) */}
        {analytics?.subscriptions?.expiringSoonCount > 0 ? (
          <div className="bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-orange-950/60 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-inner">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Peringatan Retensi: {analytics.subscriptions.expiringSoonCount} Tenan Mendekati Jatuh Tempo (H-7)</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Perlu Tindakan
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    Hubungi pemilik kafe via WhatsApp untuk memastikan perpanjangan layanan dan mencegah churn.
                  </p>
                </div>
              </div>
              <a
                href="/superadmin/subscriptions"
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
              >
                <span>Kelola Semua Langganan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {analytics.subscriptions.expiringSoonList?.map((sub: any) => {
                const daysLeft = Math.ceil(
                  (new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const phone = sub.tenant?.phone?.replace(/^0/, '62').replace(/[^0-9]/g, '');
                const waLink = phone
                  ? `https://wa.me/${phone}?text=${encodeURIComponent(
                      `Halo ${sub.tenant?.name}, langganan CafePOS Anda paket ${sub.plan?.name} akan berakhir dalam ${daysLeft <= 0 ? 'hari ini' : `${daysLeft} hari`} (${new Date(
                        sub.endDate
                      ).toLocaleDateString('id-ID')}). Silakan konfirmasi perpanjangan layanan agar operasional kasir tetap berjalan lancar. Terima kasih!`
                    )}`
                  : null;

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 bg-slate-950/80 rounded-xl border border-amber-500/20 flex items-center justify-between gap-3 text-xs shadow-inner hover:border-amber-500/40 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-xs truncate">{sub.tenant?.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">/{sub.tenant?.slug}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Paket: <span className="text-amber-300 font-semibold">{sub.plan?.name}</span> • Sisa:{' '}
                        <strong className={`font-black ${daysLeft <= 2 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                          {daysLeft <= 0 ? 'Hari ini' : `${daysLeft} hari lagi`}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Kirim pesan WhatsApp otomatis ke Owner"
                          className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="text-[10px]">WA</span>
                        </a>
                      )}
                      <a
                        href="/superadmin/subscriptions"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition active:scale-95"
                      >
                        Perpanjang
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-200">Kesehatan Langganan Aman</span>
                <p className="text-[11px] text-slate-400">
                  Tidak ada tenan yang mendekati masa kedaluwarsa dalam 7 hari ke depan. Semua langganan aktif lancar.
                </p>
              </div>
            </div>
            <a
              href="/superadmin/subscriptions"
              className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center gap-1"
            >
              <span>Audit Langganan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Hero KPI Bento Grid (4 Executive Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Tenants */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg space-y-3.5 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Total Tenan Kafe
                </span>
                <p className="text-[11px] text-slate-500">Gerai terdaftar di platform</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums font-mono">
              {analytics?.tenants?.total || 0}
            </div>

            {/* Visual ratio bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${tenantActivePercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  ● {analytics?.tenants?.active || 0} Aktif ({tenantActivePercentage}%)
                </span>
                <span className="text-rose-400 font-bold">
                  {analytics?.tenants?.suspended || 0} Ditangguhkan
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Platform MRR */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-3.5 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Monthly Recurring (MRR)
                </span>
                <p className="text-[11px] text-slate-500">Pendapatan langganan bulanan</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight tabular-nums font-mono">
              {formatRupiah(analytics?.subscriptions?.mrr || 0)}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="text-[11px]">Proyeksi ARR:</span>
              <strong className="text-slate-200 font-mono font-bold text-xs">
                {formatRupiah(analytics?.subscriptions?.arr || 0)}
              </strong>
            </div>
          </div>

          {/* Card 3: Ecosystem Orders */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/90 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-3.5 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Total Pesanan Kafe
                </span>
                <p className="text-[11px] text-slate-500">Volume pesanan kasir & QR</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums font-mono">
              {analytics?.ecosystem?.totalOrders?.toLocaleString('id-ID') || 0}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="text-[11px]">Cakupan:</span>
              <span className="text-amber-400 font-bold text-[11px]">Seluruh Tenan Terdaftar</span>
            </div>
          </div>

          {/* Card 4: Ecosystem GMV */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/90 hover:border-violet-500/40 rounded-2xl p-5 shadow-lg space-y-3.5 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Akumulasi GMV Ekosistem
                </span>
                <p className="text-[11px] text-slate-500">Total omset penjualan tenan</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-violet-400 tracking-tight tabular-nums font-mono">
              {formatRupiah(analytics?.ecosystem?.totalGmv || 0)}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="text-[11px]">Status:</span>
              <span className="text-emerald-400 font-bold text-[11px]">Gross Sales Processed</span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Action Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/superadmin/tenants"
            className="group bg-slate-900/70 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/40 p-5 rounded-2xl transition-all flex items-center justify-between shadow-md"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Building2 className="w-4 h-4" />
                <span>Kelola & Pendaftaran Tenan</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pencarian instan, status aktif, penangguhan (suspend), dan reset kredensial owner.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition shrink-0 ml-3">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </a>

          <a
            href="/superadmin/plans"
            className="group bg-slate-900/70 hover:bg-slate-850 border border-slate-800/80 hover:border-emerald-500/40 p-5 rounded-2xl transition-all flex items-center justify-between shadow-md"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Paket Langganan & Kuota</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Konfigurasi harga Starter, Pro, Enterprise, limit menu, kuota staf, dan addon fitur.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition shrink-0 ml-3">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </a>

          <a
            href="/superadmin/subscriptions"
            className="group bg-slate-900/70 hover:bg-slate-850 border border-slate-800/80 hover:border-amber-500/40 p-5 rounded-2xl transition-all flex items-center justify-between shadow-md"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Masa Aktif & Perpanjangan</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Audit billing invoice, perpanjang masa aktif manual, dan ganti paket langganan tenan.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition shrink-0 ml-3">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </a>
        </div>

        {/* Server & Infrastructure Health Overview */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Infrastruktur & Kesehatan Server</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-400">
                  Node.js Runtime, status cluster PostgreSQL, konsumsi RAM, dan integritas snapshot backup
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerBackup}
                disabled={backingUp}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                {backingUp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Cadangkan Database Sekarang</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Metric 1: Database Status */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold">PostgreSQL Engine</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-base font-black text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  ONLINE
                </span>
                {serverHealth?.database?.latencyMs !== undefined && (
                  <span className="text-xs text-slate-400 font-mono">
                    ({serverHealth.database.latencyMs}ms)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Koneksi Prisma Client Pool optimal</p>
            </div>

            {/* Metric 2: RAM Usage */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold">Memory RAM Server</span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-black text-white font-mono">
                {usedRamMb} MB{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {totalRamMb} MB ({ramPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ramPercent > 80 ? 'bg-rose-500' : ramPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${ramPercent}%` }}
                />
              </div>
            </div>

            {/* Metric 3: System Uptime */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold">Process Uptime</span>
                <Server className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-black text-white font-mono">
                {serverHealth?.uptimeSeconds
                  ? `${Math.floor(serverHealth.uptimeSeconds / 3600)}j ${Math.floor((serverHealth.uptimeSeconds % 3600) / 60)}m`
                  : 'Aktif'}
              </div>
              <p className="text-[10px] text-slate-400">NestJS Core Daemon Berjalan Normal</p>
            </div>

            {/* Metric 4: Backup Status */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold">Database Backups</span>
                <HardDrive className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-base font-black text-white font-mono">
                {serverHealth?.backups?.totalBackups ?? 0} Snapshot Tersedia
              </div>
              <p className="text-[10px] text-slate-400 truncate" title={serverHealth?.backups?.lastBackup?.filename}>
                {serverHealth?.backups?.lastBackup?.filename
                  ? `Terakhir: ${serverHealth.backups.lastBackup.filename.slice(0, 18)}...`
                  : 'Tersimpan di disk server'}
              </p>
            </div>
          </div>
        </div>

        {/* Payout & Disbursement Configuration Section */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Kontrol Finansial & Fee Penarikan BorderPay</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                    Platform Revenue Stream
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Potongan biaya admin yang otomatis dipotong saat pemilik kafe menarik saldo QRIS mereka ke rekening bank
                </p>
              </div>
            </div>
          </div>

          {payoutFeeToast && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{payoutFeeToast}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Setting Form */}
            <form
              onSubmit={handleSavePayoutFee}
              className="bg-slate-950/70 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Biaya Admin per Penarikan (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-500">Rp</span>
                  <input
                    type="text"
                    value={inputPayoutFee}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setInputPayoutFee(clean ? new Intl.NumberFormat('id-ID').format(parseInt(clean, 10)) : '');
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="4.500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>Biaya aktif saat ini:</span>
                  <strong className="text-emerald-400 font-mono font-bold">{formatRupiah(payoutFee)}</strong>
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Preset Cepat
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[2500, 4500, 5000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setInputPayoutFee(new Intl.NumberFormat('id-ID').format(fee))}
                      className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold transition active:scale-95 cursor-pointer text-center"
                    >
                      Rp {new Intl.NumberFormat('id-ID').format(fee)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPayoutFee}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
              >
                {savingPayoutFee ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Terapkan Biaya Admin</span>
                  </>
                )}
              </button>
            </form>

            {/* Withdrawals Overview Table */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300 font-bold px-1">
                <span>Pengajuan Penarikan Saldo Terkini ({platformWithdrawals.length})</span>
                <span className="text-[11px] text-slate-400 font-normal">Sinkronisasi otomatis dengan BorderPay</span>
              </div>
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 uppercase font-black text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Kafe</th>
                      <th className="p-3">Rekening Bank</th>
                      <th className="p-3 text-right">Nominal</th>
                      <th className="p-3 text-right">Admin Fee</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {platformWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          <p className="text-sm font-semibold">Belum ada pengajuan penarikan dana.</p>
                          <p className="text-xs text-slate-600 mt-1">
                            Setiap penarikan dana oleh tenan akan tercatat otomatis di tabel ini.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      platformWithdrawals.map((w: any) => (
                        <tr key={w.id} className="hover:bg-slate-850/50 transition">
                          <td className="p-3">
                            <div className="font-bold text-white text-xs">{w.company?.name || 'Kafe'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(w.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-slate-200 text-xs font-bold">{w.bankName}</span>
                            <div className="text-[10px] text-slate-400 font-mono">{w.accountNumber}</div>
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-400 font-mono text-xs">
                            {formatRupiah(w.amount)}
                          </td>
                          <td className="p-3 text-right text-slate-400 font-mono text-xs">
                            {formatRupiah(w.fee)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                w.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : w.status === 'PROCESSING'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {w.status === 'COMPLETED' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tenants Directory */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Direktori Tenan Terdaftar</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
                    {recentTenants.length} Tenan
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ringkasan gerai kafe terdaftar beserta status operasional dan paket aktif
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama kafe, slug, owner..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <a
                href="/superadmin/tenants"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Semua Tenan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 uppercase font-black text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Nama Kafe & Slug URL</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Paket Aktif</th>
                  <th className="p-3.5">Akun Owner</th>
                  <th className="p-3.5">Kapasitas</th>
                  <th className="p-3.5 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Tidak ada tenan yang cocok dengan kata kunci &quot;{tenantSearch}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm leading-tight">{t.name}</div>
                            <a
                              href={`/${t.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 mt-0.5"
                            >
                              <span>/{t.slug}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : t.status === 'SUSPENDED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-400'
                                : t.status === 'SUSPENDED'
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
                          {t.activeSubscription?.plan?.name || 'Starter'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-200 font-medium text-xs">{t.owner?.email || t.email || '-'}</div>
                        <div className="text-[10px] text-slate-400">{t.owner?.fullName || '-'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-300 font-mono text-xs">
                          <strong className="text-white">{t.counts?.products || 0}</strong> Menu •{' '}
                          <strong className="text-white">{t.counts?.staff || 0}</strong> Staf
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/${t.slug}/pos`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition text-xs font-semibold inline-flex items-center gap-1 active:scale-95"
                          >
                            <span>POS</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>

                          <a
                            href={`/superadmin/tenants?search=${encodeURIComponent(t.name)}`}
                            className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition text-xs font-semibold inline-flex items-center gap-1 active:scale-95"
                          >
                            <span>Kelola</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
