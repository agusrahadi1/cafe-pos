'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import { Discount, DiscountType, DiscountScope, Product } from '@/types';
import { formatRupiah, formatCurrencyInput, parseCurrencyInput, terbilangRupiah } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Percent,
  Plus,
  Search,
  Tag,
  Store,
  Coffee,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Info,
  Check,
  Filter,
} from 'lucide-react';

export default function AdminDiscountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<DiscountType>('PERCENTAGE');
  const [formValue, setFormValue] = useState<number | string>(20);
  const [formScope, setFormScope] = useState<DiscountScope>('ALL_ITEMS');
  const [formMinOrder, setFormMinOrder] = useState<number | string>('');
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | string>('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle Loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Protect Route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const discQuery = user?.outletId ? `?outletId=${user.outletId}` : '';
      const prodQuery = user?.outletId ? `&outletId=${user.outletId}` : '';
      const [discountsRes, productsRes] = await Promise.all([
        api.get<Discount[]>(`/discounts${discQuery}`),
        api.get<Product[]>(`/products?includeInactive=true${prodQuery}`),
      ]);
      setDiscounts(discountsRes || []);
      setProducts(productsRes || []);
    } catch (err: any) {
      console.error('Error fetching discounts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingDiscount(null);
    setFormName('');
    setFormDescription('');
    setFormCode('');
    setFormType('PERCENTAGE');
    setFormValue(20);
    setFormScope('ALL_ITEMS');
    setFormMinOrder('');
    setFormMaxDiscount('');
    setFormStartDate('');
    setFormEndDate('');
    setFormIsActive(true);
    setSelectedProductIds([]);
    setProductSearchQuery('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setFormName(d.name);
    setFormDescription(d.description || '');
    setFormCode(d.code || '');
    setFormType(d.type);
    setFormValue(d.type === 'FIXED_AMOUNT' ? formatCurrencyInput(d.value) : Number(d.value));
    setFormScope(d.scope);
    setFormMinOrder(d.minOrderAmount && Number(d.minOrderAmount) > 0 ? formatCurrencyInput(d.minOrderAmount) : '');
    setFormMaxDiscount(d.maxDiscount && Number(d.maxDiscount) > 0 ? formatCurrencyInput(d.maxDiscount) : '');
    setFormStartDate(d.startDate ? d.startDate.slice(0, 10) : '');
    setFormEndDate(d.endDate ? d.endDate.slice(0, 10) : '');
    setFormIsActive(d.isActive);
    setSelectedProductIds(d.products?.map((p) => p.productId) || []);
    setProductSearchQuery('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Quick Adjustments for Decimal / Currency Inputs
  const adjustMinOrder = (delta: number) => {
    const current = parseCurrencyInput(formMinOrder);
    const nextVal = Math.max(0, current + delta);
    setFormMinOrder(nextVal > 0 ? formatCurrencyInput(nextVal) : '');
  };

  const adjustMaxDiscount = (delta: number) => {
    const current = parseCurrencyInput(formMaxDiscount);
    const nextVal = Math.max(0, current + delta);
    setFormMaxDiscount(nextVal > 0 ? formatCurrencyInput(nextVal) : '');
  };

  const adjustFixedValue = (delta: number) => {
    const current = parseCurrencyInput(formValue);
    const nextVal = Math.max(0, current + delta);
    setFormValue(nextVal > 0 ? formatCurrencyInput(nextVal) : '');
  };

  const numericMinOrder = parseCurrencyInput(formMinOrder);
  const numericMaxDiscount = parseCurrencyInput(formMaxDiscount);
  const numericFixedValue = formType === 'FIXED_AMOUNT' ? parseCurrencyInput(formValue) : 0;

  // Submit Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama diskon / promo harus diisi.');
      return;
    }

    const numValue = formType === 'FIXED_AMOUNT' ? parseCurrencyInput(formValue) : Number(formValue);
    if (isNaN(numValue) || numValue <= 0) {
      setFormError('Nilai diskon harus berupa angka lebih dari 0.');
      return;
    }

    if (formType === 'PERCENTAGE' && numValue > 100) {
      setFormError('Diskon persentase tidak boleh lebih dari 100%.');
      return;
    }

    if (formScope === 'SPECIFIC_PRODUCTS' && selectedProductIds.length === 0) {
      setFormError('Pilih minimal 1 menu jika memilih cakupan Menu Tertentu.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const parsedMinOrder = parseCurrencyInput(formMinOrder);
    const parsedMaxDiscount = formType === 'PERCENTAGE' && formMaxDiscount ? parseCurrencyInput(formMaxDiscount) : undefined;

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      code: formCode.trim() || undefined,
      type: formType,
      value: numValue,
      scope: formScope,
      minOrderAmount: parsedMinOrder > 0 ? parsedMinOrder : 0,
      maxDiscount: parsedMaxDiscount && parsedMaxDiscount > 0 ? parsedMaxDiscount : undefined,
      startDate: formStartDate ? new Date(formStartDate).toISOString() : undefined,
      endDate: formEndDate ? new Date(formEndDate + 'T23:59:59.999Z').toISOString() : undefined,
      isActive: formIsActive,
      productIds: formScope === 'SPECIFIC_PRODUCTS' ? selectedProductIds : undefined,
    };

    try {
      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, payload);
      } else {
        await api.post('/discounts', payload);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan diskon. Periksa kembali isian Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleStatus = async (discount: Discount) => {
    setTogglingId(discount.id);
    try {
      await api.patch(`/discounts/${discount.id}/toggle`, {});
      setDiscounts((prev) =>
        prev.map((item) =>
          item.id === discount.id ? { ...item, isActive: !item.isActive } : item
        )
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status diskon');
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Discount
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/discounts/${deleteTarget.id}`);
      setDiscounts((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus diskon');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Discounts List
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterStatus === 'ACTIVE') return d.isActive;
      if (filterStatus === 'INACTIVE') return !d.isActive;
      return true;
    });
  }, [discounts, searchQuery, filterStatus]);

  // Filtered Products inside Modal
  const modalFilteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products;
    const q = productSearchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category?.name && p.category.name.toLowerCase().includes(q))
    );
  }, [products, productSearchQuery]);

  // Statistics
  const activeCount = discounts.filter((d) => d.isActive).length;
  const allMenuCount = discounts.filter((d) => d.isActive && d.scope === 'ALL_ITEMS').length;
  const specificCount = discounts.filter((d) => d.isActive && d.scope === 'SPECIFIC_PRODUCTS').length;

  return (
    <ModernStaffLayout>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Diskon & Promosi Kafe</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                    Admin
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-0.5">
                  Atur diskon peluncuran kafe (Grand Opening), potongan per menu, atau diskon seluruh hidangan.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/20 hover:shadow-lg transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Diskon Baru</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Promo Aktif
              </span>
              <span className="text-xl font-black text-stone-900 dark:text-white">
                {activeCount} <span className="text-xs font-normal text-stone-400">promo</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                Diskon Semua Menu
              </span>
              <span className="text-xl font-black text-stone-900 dark:text-white">
                {allMenuCount} <span className="text-xs font-normal text-stone-400">promo toko</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                Diskon Menu Tertentu
              </span>
              <span className="text-xl font-black text-stone-900 dark:text-white">
                {specificCount} <span className="text-xs font-normal text-stone-400">promo menu</span>
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama promo atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs text-stone-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
              </button>
            ))}
          </div>
        </div>

        {/* Discounts List */}
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            <p className="text-xs font-bold text-stone-500">Memuat daftar diskon & promo...</p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-stone-200 dark:border-slate-800 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
              <Tag className="w-7 h-7 stroke-1" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Belum Ada Diskon / Promo
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Buat diskon peluncuran kafe atau promo menu favorit untuk menarik lebih banyak pelanggan dan meningkatkan omzet penjualan.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Diskon Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDiscounts.map((discount) => {
              const isExpired = discount.endDate && new Date(discount.endDate) < new Date();
              const isStorewide = discount.scope === 'ALL_ITEMS';

              return (
                <div
                  key={discount.id}
                  className={`rounded-3xl border transition-all duration-150 p-5 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md ${
                    discount.isActive && !isExpired
                      ? 'border-stone-200 dark:border-slate-800'
                      : 'border-stone-200/70 dark:border-slate-800/70 opacity-70 bg-stone-50/50'
                  }`}
                >
                  {/* Top: Header & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Value Badge */}
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                          {discount.type === 'PERCENTAGE'
                            ? `Diskon ${Number(discount.value)}%`
                            : `Hemat ${formatRupiah(discount.value)}`}
                        </span>

                        {/* Scope Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                            isStorewide
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                          }`}
                        >
                          {isStorewide ? (
                            <>
                              <Store className="w-3 h-3" /> Semua Menu
                            </>
                          ) : (
                            <>
                              <Coffee className="w-3 h-3" /> {discount.products?.length || 0} Menu Pilihan
                            </>
                          )}
                        </span>
                      </div>

                      {/* Quick Status Toggle */}
                      <button
                        type="button"
                        disabled={togglingId === discount.id}
                        onClick={() => handleToggleStatus(discount)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          discount.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'
                        }`}
                        title={discount.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            discount.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 dark:text-white mt-3 leading-snug">
                      {discount.name}
                    </h3>

                    {discount.description && (
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {discount.description}
                      </p>
                    )}

                    {/* Specific Products Pill preview */}
                    {!isStorewide && discount.products && discount.products.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {discount.products.slice(0, 3).map((p) => (
                          <span
                            key={p.productId}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-medium"
                          >
                            {p.product?.name || 'Menu'}
                          </span>
                        ))}
                        {discount.products.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-slate-300 font-bold">
                            +{discount.products.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conditions & Details */}
                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-slate-400 pt-2 border-t border-stone-100 dark:border-slate-800">
                    {Number(discount.minOrderAmount) > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Min. Belanja:</span>
                        <span className="font-semibold text-stone-800 dark:text-white">
                          {formatRupiah(discount.minOrderAmount)}
                        </span>
                      </div>
                    )}

                    {discount.maxDiscount && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Maks. Potongan:</span>
                        <span className="font-semibold text-stone-800 dark:text-white">
                          {formatRupiah(discount.maxDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Periode Berlaku:</span>
                      <span className="font-medium text-stone-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {discount.startDate || discount.endDate ? (
                          <>
                            {discount.startDate ? discount.startDate.slice(0, 10) : 'Awal'} s/d{' '}
                            {discount.endDate ? discount.endDate.slice(0, 10) : 'Seterusnya'}
                          </>
                        ) : (
                          'Selalu Aktif'
                        )}
                      </span>
                    </div>

                    {isExpired && (
                      <div className="p-1.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-200 text-center">
                        Promo telah berakhir (kadaluarsa)
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(discount)}
                      className="flex-1 py-2 px-3 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Ubah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(discount)}
                      className="py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold text-red-600 transition cursor-pointer"
                      title="Hapus Diskon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT DISKON (TABLET & KEYBOARD RESPONSIVE) */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh] sm:max-h-[90vh] my-auto overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                    {editingDiscount ? 'Ubah Pengaturan Diskon' : 'Tambah Diskon / Promo Baru'}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Diskon akan otomatis tampil pada katalog QR pelanggan dan POS kasir
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 space-y-4 flex-1 overscroll-contain text-sm">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. Nama Diskon */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nama Promo / Diskon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Diskon Launching Cafe 20%, Promo Kopi Pagi"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  />
                </div>

                {/* 2. Tipe Diskon & Nilai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Tipe Potongan <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (formType !== 'PERCENTAGE') {
                            setFormType('PERCENTAGE');
                            setFormValue(20);
                          }
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          formType === 'PERCENTAGE'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>Persen (%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (formType !== 'FIXED_AMOUNT') {
                            setFormType('FIXED_AMOUNT');
                            setFormValue(formatCurrencyInput(10000));
                          }
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          formType === 'FIXED_AMOUNT'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Nominal (Rp)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Besar Diskon {formType === 'PERCENTAGE' ? '(%)' : '(Rp)'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {formType === 'FIXED_AMOUNT' && (
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 select-none">
                          Rp
                        </span>
                      )}
                      <input
                        type={formType === 'PERCENTAGE' ? 'number' : 'text'}
                        inputMode="numeric"
                        required
                        min={formType === 'PERCENTAGE' ? 1 : undefined}
                        max={formType === 'PERCENTAGE' ? 100 : undefined}
                        step={formType === 'PERCENTAGE' ? 1 : undefined}
                        placeholder={formType === 'PERCENTAGE' ? '20' : '10.000'}
                        value={formValue}
                        onChange={(e) => {
                          if (formType === 'FIXED_AMOUNT') {
                            setFormValue(formatCurrencyInput(e.target.value));
                          } else {
                            setFormValue(e.target.value);
                          }
                        }}
                        className={`w-full py-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-base font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono ${
                          formType === 'FIXED_AMOUNT' ? 'pl-10 pr-3.5' : 'px-3.5 pr-10'
                        }`}
                      />
                      {formType === 'PERCENTAGE' && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                          %
                        </span>
                      )}
                    </div>

                    {/* Live Preview & Terbilang if FIXED_AMOUNT */}
                    {formType === 'FIXED_AMOUNT' && numericFixedValue > 0 ? (
                      <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs">
                        <div className="font-semibold flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatRupiah(numericFixedValue)}</span>
                        </div>
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 italic mt-0.5 leading-tight">
                          &ldquo;{terbilangRupiah(numericFixedValue)}&rdquo;
                        </p>
                      </div>
                    ) : null}

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium mr-0.5">Preset:</span>
                      {formType === 'PERCENTAGE' ? (
                        <>
                          {[10, 15, 20, 25, 50].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setFormValue(pct)}
                              className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                            >
                              {pct}%
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => adjustFixedValue(5000)}
                            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                          >
                            +5rb
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustFixedValue(10000)}
                            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                          >
                            +10rb
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustFixedValue(25000)}
                            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                          >
                            +25rb
                          </button>
                          {numericFixedValue > 0 && (
                            <button
                              type="button"
                              onClick={() => setFormValue('')}
                              className="px-1.5 py-0.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-[10px] font-semibold transition cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Cakupan Target Menu (Semua Menu vs Menu Tertentu) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Target Menu yang Didiskon <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      onClick={() => setFormScope('ALL_ITEMS')}
                      className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                        formScope === 'ALL_ITEMS'
                          ? 'bg-amber-50/70 border-amber-500 text-amber-900 dark:bg-amber-950/40 dark:border-amber-600 dark:text-amber-200'
                          : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        checked={formScope === 'ALL_ITEMS'}
                        onChange={() => setFormScope('ALL_ITEMS')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-bold block flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-amber-600" /> Semua Menu Kafe
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400">
                          Diskon berlaku otomatis ke seluruh menu (Grand Opening)
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setFormScope('SPECIFIC_PRODUCTS')}
                      className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                        formScope === 'SPECIFIC_PRODUCTS'
                          ? 'bg-amber-50/70 border-amber-500 text-amber-900 dark:bg-amber-950/40 dark:border-amber-600 dark:text-amber-200'
                          : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        checked={formScope === 'SPECIFIC_PRODUCTS'}
                        onChange={() => setFormScope('SPECIFIC_PRODUCTS')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-bold block flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-amber-600" /> Pilih Menu Tertentu
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400">
                          Hanya menu yang dipilih yang mendapat diskon
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. Product Selector (Only when SPECIFIC_PRODUCTS) */}
                {formScope === 'SPECIFIC_PRODUCTS' && (
                  <div className="p-3.5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pilih Menu ({selectedProductIds.length} dipilih):</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds(products.map((p) => p.id))}
                          className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds([])}
                          className="text-[11px] font-bold text-stone-500 hover:underline cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari menu dalam daftar..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>

                    <div className="max-h-44 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                      {modalFilteredProducts.map((prod) => {
                        const isSelected = selectedProductIds.includes(prod.id);
                        return (
                          <label
                            key={prod.id}
                            className="p-2.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-slate-800/80 cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProductIds([...selectedProductIds, prod.id]);
                                  } else {
                                    setSelectedProductIds(
                                      selectedProductIds.filter((id) => id !== prod.id)
                                    );
                                  }
                                }}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              <div className="truncate">
                                <span className="font-bold text-stone-900 dark:text-white block truncate">
                                  {prod.name}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  {prod.category?.name || 'Katalog'} &bull; {formatRupiah(prod.basePrice)}
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                                Terpilih
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Minimal Belanja & Maksimal Potongan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Min. Belanja */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Min. Belanja (Opsional)
                    </label>
                    <div className="relative">
                      <span className="text-xs font-bold text-gray-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0 (tanpa minimum)"
                        value={formMinOrder}
                        onChange={(e) => setFormMinOrder(formatCurrencyInput(e.target.value))}
                        className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    {/* Live Preview & Terbilang */}
                    {numericMinOrder > 0 ? (
                      <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs">
                        <div className="font-semibold flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatRupiah(numericMinOrder)}</span>
                        </div>
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 italic mt-0.5 leading-tight">
                          &ldquo;{terbilangRupiah(numericMinOrder)}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">
                        Format angka otomatis (kosongkan jika tanpa minimal belanja)
                      </p>
                    )}

                    {/* Quick Increment Buttons */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium mr-0.5">+Cepat:</span>
                      <button
                        type="button"
                        onClick={() => adjustMinOrder(20000)}
                        className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                      >
                        +20rb
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustMinOrder(50000)}
                        className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                      >
                        +50rb
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustMinOrder(100000)}
                        className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                      >
                        +100rb
                      </button>
                      {numericMinOrder > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormMinOrder('')}
                          className="px-1.5 py-0.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-[10px] font-semibold transition cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Maks. Diskon */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Maks. Diskon (Opsional)
                      {formType === 'FIXED_AMOUNT' && (
                        <span className="text-[10px] font-normal text-stone-400 ml-1 lowercase">
                          (hanya untuk diskon persen)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="text-xs font-bold text-gray-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={formType === 'FIXED_AMOUNT'}
                        placeholder={formType === 'FIXED_AMOUNT' ? 'Tidak berlaku untuk nominal' : 'Misal: 25.000'}
                        value={formType === 'FIXED_AMOUNT' ? '' : formMaxDiscount}
                        onChange={(e) => setFormMaxDiscount(formatCurrencyInput(e.target.value))}
                        className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 font-mono ${
                          formType === 'FIXED_AMOUNT'
                            ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-slate-800/40 dark:border-slate-800 cursor-not-allowed'
                            : 'border-gray-300 dark:border-slate-700 dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-amber-500'
                        }`}
                      />
                    </div>

                    {/* Live Preview & Terbilang */}
                    {formType === 'PERCENTAGE' && numericMaxDiscount > 0 ? (
                      <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs">
                        <div className="font-semibold flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatRupiah(numericMaxDiscount)}</span>
                        </div>
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 italic mt-0.5 leading-tight">
                          &ldquo;{terbilangRupiah(numericMaxDiscount)}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">
                        {formType === 'PERCENTAGE'
                          ? 'Batas potongan tertinggi untuk diskon persentase'
                          : 'Otomatis dinonaktifkan jika memilih potongan nominal'}
                      </p>
                    )}

                    {/* Quick Increment Buttons (Only if PERCENTAGE) */}
                    {formType === 'PERCENTAGE' && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-gray-400 font-medium mr-0.5">+Cepat:</span>
                        <button
                          type="button"
                          onClick={() => adjustMaxDiscount(10000)}
                          className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                        >
                          +10rb
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustMaxDiscount(25000)}
                          className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                        >
                          +25rb
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustMaxDiscount(50000)}
                          className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-stone-600 dark:text-slate-300 transition cursor-pointer"
                        >
                          +50rb
                        </button>
                        {numericMaxDiscount > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormMaxDiscount('')}
                            className="px-1.5 py-0.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-[10px] font-semibold transition cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Periode Berlaku (Tanggal Mulai & Tanggal Selesai) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Tanggal Mulai (Opsional)
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Tanggal Selesai (Opsional)
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* 7. Keterangan Promo */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Deskripsi / Catatan Promo (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Misal: Diskon launching kafe baru berlaku untuk santap di tempat (Dine-in)..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* 8. Status Aktif Checkbox */}
                <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Aktifkan promo ini sekarang</span>
                  </label>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex gap-2 p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingDiscount ? 'Simpan Perubahan' : 'Simpan Diskon'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI HAPUS DISKON */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center my-auto border border-stone-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Hapus Promo Diskon?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus promo{' '}
                <strong className="text-stone-800 dark:text-slate-200">&quot;{deleteTarget.name}&quot;</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernStaffLayout>
  );
}

