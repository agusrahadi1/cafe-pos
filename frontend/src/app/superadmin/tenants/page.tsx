'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, getAuthToken, setAuthToken, setStoredUser } from '@/lib/api';
import SuperadminNavbar from '@/components/layout/SuperadminNavbar';
import { Tenant, SubscriptionPlan } from '@/types';
import {
  Building2,
  Plus,
  Search,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Edit2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coffee,
  DollarSign,
  Package,
  LogIn,
  ArrowUpRight,
} from 'lucide-react';

export default function SuperadminTenantsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal: Register Tenant
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regSlug, setRegSlug] = useState('');
  const [regTagline, setRegTagline] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regOwnerEmail, setRegOwnerEmail] = useState('');
  const [regOwnerPassword, setRegOwnerPassword] = useState('');
  const [regPlanSlug, setRegPlanSlug] = useState('starter');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState('');

  // Modal: Reset Password
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetTenant, setResetTenant] = useState<Tenant | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  // Modal: Edit Tenant
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editReceiptFooter, setEditReceiptFooter] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Impersonate state
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  // Notification
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
      const [tenantsRes, plansRes] = await Promise.all([
        api.get<Tenant[]>('/superadmin/tenants'),
        api.get<SubscriptionPlan[]>('/superadmin/plans'),
      ]);
      if (tenantsRes) setTenants(tenantsRes);
      if (plansRes) setPlans(plansRes);
    } catch (e) {
      console.error('Error fetching tenants list:', e);
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Helper auto-generate slug
  const handleNameChange = (name: string) => {
    setRegName(name);
    const slugified = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setRegSlug(slugified);
  };

  // Submit New Tenant
  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegSubmitting(true);
    setRegError('');

    try {
      await api.post('/superadmin/tenants', {
        name: regName,
        slug: regSlug,
        tagline: regTagline || undefined,
        address: regAddress || undefined,
        phone: regPhone || undefined,
        ownerFullName: regOwnerName,
        ownerEmail: regOwnerEmail,
        ownerPassword: regOwnerPassword,
        planSlug: regPlanSlug,
      });

      showToast(`Tenan "${regName}" berhasil didaftarkan!`);
      setIsRegisterOpen(false);
      // Reset form
      setRegName('');
      setRegSlug('');
      setRegTagline('');
      setRegAddress('');
      setRegPhone('');
      setRegOwnerName('');
      setRegOwnerEmail('');
      setRegOwnerPassword('');
      await fetchData();
    } catch (err: any) {
      setRegError(err?.message || 'Gagal mendaftarkan tenan');
    } finally {
      setRegSubmitting(false);
    }
  };

  // Toggle Suspend / Active
  const handleToggleStatus = async (tenant: Tenant) => {
    const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg =
      nextStatus === 'SUSPENDED'
        ? `Tangguhkan tenan "${tenant.name}"? Semua staf & kasir tenan ini akan langsung diblokir dari akses sistem.`
        : `Aktifkan kembali akses untuk tenan "${tenant.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.put(`/superadmin/tenants/${tenant.id}/status`, { status: nextStatus });
      showToast(`Status "${tenant.name}" berhasil diubah menjadi ${nextStatus}`);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah status tenan');
    }
  };

  // Reset Owner Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTenant) return;
    setResetSubmitting(true);
    setResetError('');

    try {
      await api.post(`/superadmin/tenants/${resetTenant.id}/reset-password`, {
        password: newPassword,
      });
      showToast(`Password owner untuk "${resetTenant.name}" berhasil diubah.`);
      setIsResetOpen(false);
      setNewPassword('');
    } catch (err: any) {
      setResetError(err?.message || 'Gagal mereset password');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditName(tenant.name || '');
    setEditTagline(tenant.tagline || '');
    setEditAddress(tenant.address || '');
    setEditPhone(tenant.phone || '');
    setEditEmail(tenant.email || tenant.owner?.email || '');
    setEditReceiptFooter(tenant.receiptFooter || '');
    setEditError('');
    setIsEditOpen(true);
  };

  // Submit Edit Tenant
  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setEditSubmitting(true);
    setEditError('');

    try {
      await api.put(`/superadmin/tenants/${editingTenant.id}`, {
        name: editName,
        tagline: editTagline || undefined,
        address: editAddress || undefined,
        phone: editPhone || undefined,
        email: editEmail || undefined,
        receiptFooter: editReceiptFooter || undefined,
      });

      showToast(`Data profil tenan "${editName}" berhasil diperbarui!`);
      setIsEditOpen(false);
      await fetchData();
    } catch (err: any) {
      setEditError(err?.message || 'Gagal memperbarui profil tenan');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Impersonate Tenant
  const handleImpersonate = async (tenant: Tenant) => {
    const confirmMsg = `Masuk ke akun kafe "${tenant.name}" sebagai Administrator/Owner?\n\nAnda akan otomatis diarahkan ke portal tenan dan dapat kembali ke Superadmin kapan saja lewat tombol di bagian atas layar.`;
    if (!confirm(confirmMsg)) return;

    setImpersonatingId(tenant.id);
    try {
      const res = await api.post<any>(`/superadmin/tenants/${tenant.id}/impersonate`, {});
      if (res && res.accessToken) {
        // Backup current superadmin session
        const currentToken = getAuthToken();
        if (currentToken) {
          localStorage.setItem('superadmin_impersonate_backup', currentToken);
          localStorage.setItem('superadmin_impersonate_user', JSON.stringify(user));
          localStorage.setItem('superadmin_impersonate_data', JSON.stringify({
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
          }));
        }

        setAuthToken(res.accessToken);
        if (res.user) {
          setStoredUser(res.user);
        }

        showToast(`Memulai sesi impersonasi untuk ${tenant.name}...`);
        setTimeout(() => {
          window.location.href = res.redirectUrl || `/${tenant.slug}/admin/menu`;
        }, 300);
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal masuk sebagai tenan');
      setImpersonatingId(null);
    }
  };

  // Filtered tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.owner?.email && t.owner.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

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
              <Building2 className="w-6 h-6 text-indigo-400" />
              <span>Manajemen Tenan Kafe</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola entitas kafe, akun pemilik, status akses isolasi, dan kuota paket
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
              onClick={() => setIsRegisterOpen(true)}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Daftarkan Tenan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
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

      {/* Filter & Search Bar */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-4 flex-1">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
          {/* Status Tabs */}
          <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {st === 'ALL'
                  ? `Semua (${tenants.length})`
                  : st === 'ACTIVE'
                  ? `Aktif (${tenants.filter((t) => t.status === 'ACTIVE').length})`
                  : st === 'SUSPENDED'
                  ? `Ditangguhkan (${tenants.filter((t) => t.status === 'SUSPENDED').length})`
                  : `Kedaluwarsa (${tenants.filter((t) => t.status === 'EXPIRED').length})`}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama kafe, slug, atau email owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/70 text-white pl-10 pr-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase font-bold text-[10px] text-slate-400 tracking-wider">
                <tr>
                  <th className="p-4">Identitas Kafe</th>
                  <th className="p-4">Status & Slug</th>
                  <th className="p-4">Paket Langganan</th>
                  <th className="p-4">Pemilik (Owner)</th>
                  <th className="p-4">Volume Data</th>
                  <th className="p-4 text-right">Aksi Superadmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Tidak ada tenan yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{t.name}</div>
                        {t.tagline && <div className="text-[11px] text-slate-400 italic">{t.tagline}</div>}
                        {t.phone && <div className="text-[10px] text-slate-500 mt-0.5">{t.phone}</div>}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : t.status === 'SUSPENDED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            ● {t.status}
                          </span>
                          <div>
                            <a
                              href={`/${t.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-indigo-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>/{t.slug}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white text-xs">
                          {t.activeSubscription?.plan?.name || 'Starter'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sampai:{' '}
                          {t.activeSubscription?.endDate
                            ? new Date(t.activeSubscription.endDate).toLocaleDateString('id-ID')
                            : '-'}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{t.owner?.fullName || '-'}</div>
                        <div className="text-[11px] text-indigo-400">{t.owner?.email || t.email}</div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5 text-[11px]">
                          <span className="block font-medium text-slate-300">
                            {t.counts?.products || 0} Menu • {t.counts?.staff || 0} Staf
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {t.counts?.orders || 0} Transaksi Pesanan
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Impersonate Button */}
                          <button
                            onClick={() => handleImpersonate(t)}
                            disabled={impersonatingId === t.id}
                            title="Masuk ke Akun Kafe Ini (Ghost Mode)"
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl transition text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {impersonatingId === t.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <LogIn className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden xl:inline">Masuk</span>
                          </button>

                          {/* Edit Tenant Profile Button */}
                          <button
                            onClick={() => openEditModal(t)}
                            title="Edit Profil & Identitas Tenan"
                            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 rounded-xl transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Status Button */}
                          <button
                            onClick={() => handleToggleStatus(t)}
                            title={t.status === 'ACTIVE' ? 'Tangguhkan Tenan (Suspend)' : 'Aktifkan Tenan'}
                            className={`p-2 rounded-xl transition text-xs font-semibold cursor-pointer ${
                              t.status === 'ACTIVE'
                                ? 'bg-slate-800 hover:bg-rose-950/50 text-rose-400 border border-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {t.status === 'ACTIVE' ? (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setResetTenant(t);
                              setNewPassword('');
                              setResetError('');
                              setIsResetOpen(true);
                            }}
                            title="Reset Password Owner"
                            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-xl transition cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Open POS */}
                          <a
                            href={`/${t.slug}/pos`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <span>POS</span>
                            <ExternalLink className="w-3 h-3" />
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
      </div>

      {/* Modal: Register New Tenant */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Daftarkan Tenan Kafe Baru</h3>
                  <p className="text-[11px] text-slate-400">Penyediaan ruang isolasi data dan akun pemilik</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterTenant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nama Kafe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Senja"
                    value={regName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Slug URL Path <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="kopi-senja"
                    value={regSlug}
                    onChange={(e) => setRegSlug(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-indigo-300 font-mono px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Akses: cafepos.com/{regSlug || 'slug'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Tagline Kafe (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Coffee, Eatery & Workspace"
                  value={regTagline}
                  onChange={(e) => setRegTagline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+62812345678"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Pilihan Paket Langganan
                  </label>
                  <select
                    value={regPlanSlug}
                    onChange={(e) => setRegPlanSlug(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {plans.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} ({p.maxProducts === -1 ? 'Unlimited' : `${p.maxProducts} Menu`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-indigo-400 block mb-2">
                  Akun Pemilik Tenan (Owner Administrator)
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Nama Lengkap Owner <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Budi Santoso"
                      value={regOwnerName}
                      onChange={(e) => setRegOwnerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Email Owner <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="owner@kopisenja.com"
                        value={regOwnerEmail}
                        onChange={(e) => setRegOwnerEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Password Awal <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Minimal 6 karakter"
                        value={regOwnerPassword}
                        onChange={(e) => setRegOwnerPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {regSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <span>Daftarkan Tenan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password Owner */}
      {isResetOpen && resetTenant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Reset Password Owner</span>
              </h3>
              <button
                onClick={() => setIsResetOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Atur ulang kata sandi login untuk pemilik kafe <strong>{resetTenant.name}</strong> (
              <span className="text-indigo-400">{resetTenant.owner?.email || resetTenant.email}</span>).
            </p>

            {resetError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {resetSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Simpan Password</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Tenant Profile */}
      {isEditOpen && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-sky-400" />
                <h3 className="font-black text-base text-white">Edit Profil Tenan</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Perbarui identitas kafe, informasi kontak, dan catatan struk kasir untuk <strong>{editingTenant.name}</strong>.
            </p>

            {editError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateTenant} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Kafe / Usaha *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Slogan / Tagline
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Coffee & Eatery Space"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    placeholder="kontak@kafe.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat kafe atau cabang utama"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Catatan Kaki Struk (Receipt Footer)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Terima kasih atas kunjungan Anda! Follow IG: @kafekita"
                  value={editReceiptFooter}
                  onChange={(e) => setEditReceiptFooter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-sky-600/20"
                >
                  {editSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Simpan Perubahan</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

