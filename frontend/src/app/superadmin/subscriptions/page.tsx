'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import SuperadminNavbar from '@/components/layout/SuperadminNavbar';
import { TenantSubscription, SubscriptionPlan, Tenant } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  CreditCard,
  RotateCw,
  Plus,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
  FileText,
  Printer,
  Search,
  Download,
  AlertTriangle,
} from 'lucide-react';

export default function SuperadminSubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Invoice Modal
  const [selectedInvoiceSub, setSelectedInvoiceSub] = useState<any | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Assign Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('pro');
  const [durationMonths, setDurationMonths] = useState(12);
  const [notes, setNotes] = useState('Perpanjangan langganan via Superadmin Console');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

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
      const [subsRes, tenantsRes, plansRes] = await Promise.all([
        api.get<any[]>('/superadmin/subscriptions'),
        api.get<Tenant[]>('/superadmin/tenants'),
        api.get<SubscriptionPlan[]>('/superadmin/plans'),
      ]);
      if (subsRes) setSubscriptions(subsRes);
      if (tenantsRes) setTenants(tenantsRes);
      if (plansRes) setPlans(plansRes);
      if (tenantsRes?.[0]) setSelectedTenantId(tenantsRes[0].id);
    } catch (e) {
      console.error('Error fetching subscriptions:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      fetchData();
    }
  }, [user]);

  const handleAssignSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.post<any>('/superadmin/subscriptions/assign', {
        tenantId: selectedTenantId,
        planSlug: selectedPlanSlug,
        durationMonths: Number(durationMonths),
        notes,
      });

      setToastMessage(res?.message || 'Langganan berhasil diperbarui!');
      setTimeout(() => setToastMessage(''), 4000);
      setIsAssignOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Gagal menetapkan langganan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <SuperadminNavbar />

      {/* Header Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-amber-400" />
              <span>Monitoring Langganan & Tagihan Tenan</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau masa aktif berlangganan kafe dan lakukan perpanjangan manual
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Perbarui</span>
            </button>

            <button
              onClick={() => {
                setError('');
                setIsAssignOpen(true);
              }}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Perpanjang / Terapkan Paket</span>
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-emerald-500 hover:text-emerald-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-4 flex-1">
        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {(
              [
                { id: 'ALL', label: 'Semua' },
                { id: 'ACTIVE', label: 'Aktif (>7 Hari)' },
                { id: 'EXPIRING_SOON', label: 'Jatuh Tempo (H-7)' },
                { id: 'EXPIRED', label: 'Kedaluwarsa' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kafe atau paket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase font-bold text-[10px] text-slate-400 tracking-wider">
                <tr>
                  <th className="p-4">Tenan Kafe</th>
                  <th className="p-4">Paket Langganan</th>
                  <th className="p-4">Status Masa Aktif</th>
                  <th className="p-4">Tanggal Mulai</th>
                  <th className="p-4">Berakhir Pada</th>
                  <th className="p-4">Catatan</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subscriptions
                  .filter((sub: any) => {
                    const now = new Date().getTime();
                    const end = new Date(sub.endDate).getTime();
                    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

                    let matchesStatus = true;
                    if (statusFilter === 'ACTIVE') {
                      matchesStatus = sub.status === 'ACTIVE' && daysLeft > 7;
                    } else if (statusFilter === 'EXPIRING_SOON') {
                      matchesStatus = sub.status === 'ACTIVE' && daysLeft >= 0 && daysLeft <= 7;
                    } else if (statusFilter === 'EXPIRED') {
                      matchesStatus = sub.status === 'EXPIRED' || daysLeft < 0;
                    }

                    const matchesSearch =
                      sub.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      sub.tenant?.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      sub.plan?.name?.toLowerCase().includes(searchQuery.toLowerCase());

                    return matchesStatus && matchesSearch;
                  })
                  .map((sub: any) => {
                    const now = new Date().getTime();
                    const end = new Date(sub.endDate).getTime();
                    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                    const isExpired = end < now;
                    const isExpiringSoon = !isExpired && daysLeft <= 7;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{sub.tenant?.name}</div>
                          <div className="text-[11px] text-indigo-400 font-mono">/{sub.tenant?.slug}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-slate-100">{sub.plan?.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {formatRupiah(sub.plan?.priceMonthly)}/bln
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isExpired
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : isExpiringSoon
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            ● {isExpired ? 'EXPIRED' : isExpiringSoon ? `H-${daysLeft} JATUH TEMPO` : 'AKTIF'}
                          </span>
                        </td>

                        <td className="p-4 text-slate-300">
                          {new Date(sub.startDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </td>

                        <td className="p-4">
                          <div
                            className={`font-semibold ${
                              isExpired ? 'text-rose-400' : isExpiringSoon ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {new Date(sub.endDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                          </div>
                        </td>

                        <td className="p-4 text-slate-400 text-[11px] max-w-xs truncate">
                          {sub.notes || '-'}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoiceSub(sub);
                              setIsInvoiceOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 rounded-xl transition text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Assign Subscription Modal */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Perpanjang / Terapkan Paket Langganan</span>
              </h3>
              <button
                onClick={() => setIsAssignOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAssignSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Pilih Tenan Kafe
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (/{t.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Pilih Paket Baru
                </label>
                <select
                  value={selectedPlanSlug}
                  onChange={(e) => setSelectedPlanSlug(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {plans.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} - {formatRupiah(p.priceMonthly)}/bln
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Durasi Perpanjangan (Bulan)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Catatan Transaksi / Penyesuaian
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Terapkan Paket</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {isInvoiceOpen && selectedInvoiceSub && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-base text-white">Invoice Langganan SaaS</h3>
              </div>
              <button
                onClick={() => setIsInvoiceOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Invoice Paper Area */}
            <div id="saas-invoice-printable" className="bg-white text-slate-900 p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5 print:p-0 print:border-none print:shadow-none">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-indigo-600 tracking-tight">CafePOS SaaS</h2>
                  <p className="text-[11px] text-stone-500 font-medium">PT ADNAN BERKAH SEJAHTERA</p>
                  <p className="text-[10px] text-stone-400">Platform Point of Sales & QR Table Ordering</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full uppercase tracking-wider">
                    {selectedInvoiceSub.status === 'ACTIVE' ? 'LUNAS / AKTIF' : 'EXPIRED'}
                  </span>
                  <p className="text-xs font-mono font-bold text-stone-700 mt-1">
                    INV-{new Date(selectedInvoiceSub.createdAt).getFullYear()}{(new Date(selectedInvoiceSub.createdAt).getMonth() + 1).toString().padStart(2, '0')}-{selectedInvoiceSub.id.slice(0, 6).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Ditagihkan Kepada:</span>
                  <h4 className="font-bold text-stone-900 text-sm mt-0.5">{selectedInvoiceSub.tenant?.name}</h4>
                  <p className="text-stone-600 text-[11px]">{selectedInvoiceSub.tenant?.email || '-'}</p>
                  <p className="text-stone-600 text-[11px]">{selectedInvoiceSub.tenant?.phone || '-'}</p>
                  <p className="text-stone-500 text-[10px] font-mono mt-0.5">Slug: /{selectedInvoiceSub.tenant?.slug}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Detail Periode:</span>
                  <p className="text-stone-700 mt-0.5">
                    <strong>Tgl Mulai:</strong> {new Date(selectedInvoiceSub.startDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </p>
                  <p className="text-stone-700">
                    <strong>Tgl Berakhir:</strong> {new Date(selectedInvoiceSub.endDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </p>
                  <p className="text-stone-500 text-[10px] mt-0.5">
                    Metode: Transfer Bank / Manual Admin
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 uppercase font-bold text-[10px] text-stone-600">
                    <tr>
                      <th className="p-2.5">Deskripsi Layanan</th>
                      <th className="p-2.5">Batas Kuota</th>
                      <th className="p-2.5 text-right">Tarif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    <tr>
                      <td className="p-2.5">
                        <div className="font-bold text-stone-900">Langganan Paket {selectedInvoiceSub.plan?.name}</div>
                        <div className="text-[10px] text-stone-500">{selectedInvoiceSub.plan?.description || 'Fitur POS Multi-Tenant Lengkap'}</div>
                      </td>
                      <td className="p-2.5 text-[11px]">
                        <div>{selectedInvoiceSub.plan?.maxProducts === -1 ? 'Unlimited Menu' : `Maks ${selectedInvoiceSub.plan?.maxProducts} Menu`}</div>
                        <div className="text-stone-500">{selectedInvoiceSub.plan?.maxStaffAccounts === -1 ? 'Unlimited Staf' : `Maks ${selectedInvoiceSub.plan?.maxStaffAccounts} Staf`}</div>
                      </td>
                      <td className="p-2.5 text-right font-bold text-stone-900">
                        {formatRupiah(selectedInvoiceSub.plan?.priceMonthly || 0)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-stone-50 font-bold border-t border-stone-200">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-stone-600 text-right uppercase text-[10px]">Total Dibayarkan:</td>
                      <td className="p-2.5 text-right text-indigo-700 text-sm font-black">
                        {formatRupiah(selectedInvoiceSub.plan?.priceMonthly || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[10px] text-stone-500 space-y-1">
                <p className="font-bold text-stone-700 uppercase">Catatan Transaksi:</p>
                <p>{selectedInvoiceSub.notes || 'Pembayaran langganan resmi layanan CafePOS Cloud System.'}</p>
                <p className="italic text-stone-400">Bukti tagihan ini sah dan dihasilkan secara otomatis oleh sistem pusat CafePOS.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

