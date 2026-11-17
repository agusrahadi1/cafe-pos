'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import SuperadminNavbar from '@/components/layout/SuperadminNavbar';
import { SubscriptionPlan } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  PackageCheck,
  Plus,
  RotateCw,
  CheckCircle2,
  Edit2,
  X,
  Loader2,
  AlertCircle,
  Users,
  Utensils,
  DollarSign,
  Layers,
} from 'lucide-react';

export default function SuperadminPlansPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Plan Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceMonthly, setFormPriceMonthly] = useState<number>(0);
  const [formPriceYearly, setFormPriceYearly] = useState<number>(0);
  const [formMaxProducts, setFormMaxProducts] = useState<number>(50);
  const [formMaxStaff, setFormMaxStaff] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Create Plan Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPriceMonthly, setCreatePriceMonthly] = useState<number>(0);
  const [createPriceYearly, setCreatePriceYearly] = useState<number>(0);
  const [createMaxProducts, setCreateMaxProducts] = useState<number>(50);
  const [createMaxStaff, setCreateMaxStaff] = useState<number>(5);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

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

  const fetchPlans = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get<SubscriptionPlan[]>('/superadmin/plans');
      if (res) setPlans(res);
    } catch (e) {
      console.error('Error fetching plans:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      fetchPlans();
    }
  }, [user]);

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormDescription(plan.description || '');
    setFormPriceMonthly(Number(plan.priceMonthly));
    setFormPriceYearly(Number(plan.priceYearly));
    setFormMaxProducts(plan.maxProducts);
    setFormMaxStaff(plan.maxStaffAccounts);
    setError('');
    setIsEditOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSubmitting(true);
    setError('');

    try {
      await api.put(`/superadmin/plans/${editingPlan.id}`, {
        name: formName,
        description: formDescription || undefined,
        priceMonthly: Number(formPriceMonthly),
        priceYearly: Number(formPriceYearly),
        maxProducts: Number(formMaxProducts),
        maxStaffAccounts: Number(formMaxStaff),
      });

      setToastMessage(`Paket "${formName}" berhasil diperbarui!`);
      setTimeout(() => setToastMessage(''), 4000);
      setIsEditOpen(false);
      await fetchPlans();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan perubahan paket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNameChange = (name: string) => {
    setCreateName(name);
    setCreateSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
    );
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');

    try {
      await api.post('/superadmin/plans', {
        name: createName,
        slug: createSlug,
        description: createDescription || undefined,
        priceMonthly: Number(createPriceMonthly),
        priceYearly: Number(createPriceYearly),
        maxProducts: Number(createMaxProducts),
        maxStaffAccounts: Number(createMaxStaff),
      });

      setToastMessage(`Paket "${createName}" berhasil dibuat!`);
      setTimeout(() => setToastMessage(''), 4000);
      setIsCreateOpen(false);
      setCreateName('');
      setCreateSlug('');
      setCreateDescription('');
      setCreatePriceMonthly(0);
      setCreatePriceYearly(0);
      setCreateMaxProducts(50);
      setCreateMaxStaff(5);
      await fetchPlans();
    } catch (err: any) {
      setCreateError(err?.message || 'Gagal membuat paket baru');
    } finally {
      setCreateSubmitting(false);
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
              <PackageCheck className="w-6 h-6 text-emerald-400" />
              <span>Paket Langganan & Kuota Fitur</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola batas kuota menu, batas akun staf, dan struktur harga bulanan/tahunan SaaS
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => fetchPlans(true)}
              disabled={refreshing}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Perbarui</span>
            </button>

            <button
              onClick={() => {
                setCreateError('');
                setIsCreateOpen(true);
              }}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Paket Baru</span>
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

      {/* Plans Grid */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isEnterprise = p.slug === 'enterprise';
            const isPro = p.slug === 'pro';

            return (
              <div
                key={p.id}
                className={`bg-slate-900 rounded-3xl p-6 border flex flex-col justify-between transition shadow-md relative overflow-hidden ${
                  isEnterprise
                    ? 'border-indigo-500/50 shadow-indigo-500/10'
                    : isPro
                    ? 'border-emerald-500/40'
                    : 'border-slate-800'
                }`}
              >
                {isEnterprise && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                    Populer / Unggulan
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-2xl font-black text-white">
                      {formatRupiah(p.priceMonthly)}
                      <span className="text-xs font-normal text-slate-400"> / bulan</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatRupiah(p.priceYearly)} / tahun (Hemat ~17%)
                    </div>
                  </div>

                  {/* Quota Highlights */}
                  <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-800 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-indigo-400" /> Batas Menu Produk:
                      </span>
                      <strong className="text-white">
                        {p.maxProducts === -1 ? 'Tanpa Batas (Unlimited)' : `${p.maxProducts} Menu`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" /> Batas Akun Staf/Kasir:
                      </span>
                      <strong className="text-white">
                        {p.maxStaffAccounts === -1 ? 'Tanpa Batas (Unlimited)' : `${p.maxStaffAccounts} Akun`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700/60">
                      <span className="text-slate-400">Tenan Aktif Memakai:</span>
                      <span className="text-indigo-300 font-bold">{p.activeSubscribers || 0} Kafe</span>
                    </div>
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-2 text-xs text-slate-300 pt-1">
                    {(p.features as string[] || []).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => openEditModal(p)}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Kuota & Harga</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Edit Plan Modal */}
      {isEditOpen && editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span>Ubah Paket Langganan: {editingPlan.name}</span>
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
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

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Paket
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Harga Bulanan (IDR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPriceMonthly}
                    onChange={(e) => setFormPriceMonthly(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Harga Tahunan (IDR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPriceYearly}
                    onChange={(e) => setFormPriceYearly(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Max Menu Produk
                  </label>
                  <input
                    type="number"
                    required
                    value={formMaxProducts}
                    onChange={(e) => setFormMaxProducts(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Isi -1 untuk Unlimited</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Max Akun Staf
                  </label>
                  <input
                    type="number"
                    required
                    value={formMaxStaff}
                    onChange={(e) => setFormMaxStaff(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Isi -1 untuk Unlimited</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Simpan Paket</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base text-white">Buat Paket Langganan Baru</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Tambahkan paket tingkatan SaaS baru dengan batasan kuota menu, staf, dan skema harga.
            </p>

            {createError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nama Paket *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Premium"
                    value={createName}
                    onChange={(e) => handleCreateNameChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Slug Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="premium"
                    value={createSlug}
                    onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-mono px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Harga Bulanan (Rp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={createPriceMonthly}
                    onChange={(e) => setCreatePriceMonthly(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Harga Tahunan (Rp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={createPriceYearly}
                    onChange={(e) => setCreatePriceYearly(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Batas Menu *
                  </label>
                  <input
                    type="number"
                    required
                    value={createMaxProducts}
                    onChange={(e) => setCreateMaxProducts(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Isi -1 untuk Unlimited</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Batas Akun Staf *
                  </label>
                  <input
                    type="number"
                    required
                    value={createMaxStaff}
                    onChange={(e) => setCreateMaxStaff(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Isi -1 untuk Unlimited</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Deskripsi Paket
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan target pengguna atau benefit paket"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {createSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Simpan Paket Baru</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

