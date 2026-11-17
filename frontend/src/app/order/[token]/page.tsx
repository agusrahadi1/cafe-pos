/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { Category, Product, Discount } from '@/types';
import { formatRupiah, getImageUrl } from '@/lib/utils';
import ModifierModal from '@/components/customer/ModifierModal';
import CartDrawer from '@/components/customer/CartDrawer';
import CallWaiterModal from '@/components/customer/CallWaiterModal';
import MyOrdersDrawer from '@/components/customer/MyOrdersDrawer';
import { getSavedCustomerOrders, updateSavedOrderStatus, SavedCustomerOrder } from '@/lib/customerOrders';
import {
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  AlertCircle,
  Search,
  Sparkles,
  Info,
  Loader2,
  CheckCircle2,
  X,
  Store,
  ChevronRight,
  ArrowRight,
  Flame,
  Utensils,
  Layers,
  HelpCircle,
  ConciergeBell,
  ShieldCheck,
  Tag,
  Percent,
  Receipt,
  CupSoda,
  Cookie,
  LayoutGrid,
} from 'lucide-react';

export default function CustomerOrderPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const {
    items,
    setTableInfo,
    totalAmount,
    activeDiscounts,
    setActiveDiscounts,
    addItem,
    updateQuantity,
  } = useCart();

  const [tableData, setTableData] = useState<any>(null);
  const [outletData, setOutletData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [savedOrders, setSavedOrders] = useState<SavedCustomerOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync and fetch live status for active customer orders in the background
  const refreshSavedOrders = async () => {
    const list = getSavedCustomerOrders();
    setSavedOrders(list);

    const ongoingOrders = list.filter((o) =>
      ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status || '')
    );

    if (ongoingOrders.length > 0) {
      try {
        const results = await Promise.allSettled(
          ongoingOrders.map((o) => api.get<any>(`/orders/${o.orderId}`))
        );

        let hasChanges = false;
        const updatedList = list.map((item) => {
          const match = results.find(
            (r) => r.status === 'fulfilled' && r.value && r.value.id === item.orderId
          );
          if (match && match.status === 'fulfilled' && match.value?.status && match.value.status !== item.status) {
            hasChanges = true;
            updateSavedOrderStatus(item.orderId, match.value.status);
            return { ...item, status: match.value.status };
          }
          return item;
        });

        if (hasChanges) {
          setSavedOrders(updatedList);
        }
      } catch (e) {
        // silent fallback
      }
    }
  };

  useEffect(() => {
    refreshSavedOrders();
    const interval = setInterval(refreshSavedOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const latestActiveOrder = useMemo(() => {
    return savedOrders.find((o) =>
      ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status || '')
    );
  }, [savedOrders]);

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Menunggu Bayar';
      case 'PAID':
      case 'CONFIRMED':
        return 'Dikonfirmasi';
      case 'PREPARING':
        return 'Sedang Diracik 🍳';
      case 'READY':
      case 'OUT_FOR_DELIVERY':
        return 'Siap Diantar 🚀';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'Selesai ✨';
      default:
        return 'Aktif';
    }
  };

  // Read optional URL category parameter (e.g. from "Pesan Lagi" shortcuts)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('cat');
      if (catParam) {
        setActiveCategory(catParam);
      }
      const searchParam = urlParams.get('q');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const validateAndLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Validate QR Code token
        const validation = await api.get<any>(`/qr-codes/validate/${token}`);

        if (!validation.valid) {
          setError(validation.reason || 'QR Code meja tidak valid atau sudah kadaluarsa.');
          setLoading(false);
          return;
        }

        setTableData(validation.table);
        setOutletData(validation.outlet);
        setCompanyData(validation.company);

        // Save active table session into localStorage so customer never loses their table
        if (typeof window !== 'undefined') {
          localStorage.setItem('cafe_active_qr_token', token);
          if (validation.table?.tableNumber) {
            localStorage.setItem('cafe_active_table_number', String(validation.table.tableNumber));
          }
          if (validation.company?.name) {
            localStorage.setItem('cafe_active_cafe_name', validation.company.name);
          }
        }

        // Store table info in cart context
        const outletTaxRate = validation.outlet?.taxRate != null ? Number(validation.outlet.taxRate) / 100 : 0;
        const outletServiceRate = validation.outlet?.serviceCharge != null ? Number(validation.outlet.serviceCharge) / 100 : 0;

        setTableInfo(
          validation.table.id,
          validation.table.tableNumber,
          validation.outlet.id,
          outletTaxRate,
          outletServiceRate
        );

        // 2. Fetch Categories, Products & Active Discounts strictly scoped to this table's outlet
        const [catsRes, prodsRes, discountsRes] = await Promise.all([
          api.get<Category[]>(`/categories/active?outletId=${validation.outlet.id}`).catch(() => []),
          api.get<Product[]>(`/products/active?outletId=${validation.outlet.id}`).catch(() => []),
          api.get<Discount[]>(`/discounts/active?outletId=${validation.outlet.id}`).catch(() => []),
        ]);

        setCategories(catsRes || []);
        setProducts(prodsRes || []);
        if (discountsRes && discountsRes.length > 0) {
          setActiveDiscounts(discountsRes);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat menu meja.');
      } finally {
        setLoading(false);
      }
    };

    validateAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Helper to calculate product discount info
  const getProductDiscountInfo = (product: Product) => {
    if (!activeDiscounts || activeDiscounts.length === 0) return null;

    let bestSaving = 0;
    let bestDiscount: Discount | null = null;
    const basePrice = Number(product.basePrice);

    for (const d of activeDiscounts) {
      if (!d.isActive) continue;
      let applies = false;
      if (d.scope === 'ALL_ITEMS') {
        applies = true;
      } else if (d.scope === 'SPECIFIC_PRODUCTS') {
        const pIds = (d.products || []).map((p: any) => p.productId);
        if (pIds.includes(product.id)) {
          applies = true;
        }
      }

      if (!applies) continue;

      let saving = 0;
      if (d.type === 'PERCENTAGE') {
        saving = basePrice * (Number(d.value) / 100);
        if (d.maxDiscount && Number(d.maxDiscount) > 0) {
          saving = Math.min(saving, Number(d.maxDiscount));
        }
      } else {
        saving = Math.min(basePrice, Number(d.value));
      }

      if (saving > bestSaving) {
        bestSaving = saving;
        bestDiscount = d;
      }
    }

    if (bestSaving > 0 && bestDiscount) {
      const discountedPrice = Math.max(0, basePrice - bestSaving);
      const label =
        bestDiscount.type === 'PERCENTAGE'
          ? `-${Number(bestDiscount.value)}%`
          : `Hemat ${formatRupiah(bestDiscount.value)}`;
      return {
        discount: bestDiscount,
        discountedPrice,
        saving: bestSaving,
        label,
      };
    }

    return null;
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive || p.status === 'INACTIVE') return false;
      const matchCategory =
        activeCategory === 'all' ||
        p.categoryId === activeCategory ||
        (p.category && p.category.name.toLowerCase() === activeCategory.toLowerCase());
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Helper to count how many of this product are in cart
  const getProductCartCount = (productId: string) => {
    return items
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Helper to find simple cart item (no variant, no modifiers)
  const getSimpleCartItem = (productId: string) => {
    return items.find(
      (item) =>
        item.product.id === productId &&
        !item.variant &&
        (!item.selectedModifiers || item.selectedModifiers.length === 0)
    );
  };

  // Helper for Category Icons
  const getCategoryIcon = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('kopi') || lower.includes('coffee') || lower.includes('espresso')) return Coffee;
    if (lower.includes('minum') || lower.includes('drink') || lower.includes('tea') || lower.includes('teh') || lower.includes('jus') || lower.includes('juice')) return CupSoda;
    if (lower.includes('makan') || lower.includes('food') || lower.includes('nasi') || lower.includes('mie') || lower.includes('dish') || lower.includes('pasta')) return Utensils;
    if (lower.includes('snack') || lower.includes('camil') || lower.includes('cemil') || lower.includes('roti') || lower.includes('cake') || lower.includes('dessert') || lower.includes('pastry')) return Cookie;
    return Sparkles;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full p-8 rounded-3xl shadow-2xl border border-stone-200/80 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
            <Coffee className="w-8 h-8" />
          </div>
          <p className="text-base font-black text-stone-900">Menyiapkan Menu Meja...</p>
          <p className="text-xs text-stone-500 mt-1">Memverifikasi meja dan sinkronisasi harga kafe</p>
          <div className="flex items-center gap-2 mt-4 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/60">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Memuat hidangan lezat...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tableData) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full p-6 rounded-3xl border border-red-100 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-stone-900">QR Code Tidak Valid</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            {error || 'QR code meja tidak dapat ditemukan atau sudah dinonaktifkan oleh kasir.'}
          </p>
          <div className="p-3 bg-amber-50/80 rounded-2xl text-[11px] text-amber-900 text-left flex items-start gap-2.5 border border-amber-200/60">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <span>Silakan tanyakan kasir atau pelayan untuk mendapatkan kode meja yang aktif.</span>
          </div>
        </div>
      </div>
    );
  }

  const cafeName = companyData?.name || outletData?.name || 'Cafe & Resto';
  const cafeLogo = companyData?.logoUrl || companyData?.logo;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-800 font-sans antialiased selection:bg-amber-500 selection:text-white">
      {/* Mobile-Container Preview Frame on Desktop, 100% on Mobile */}
      <div className="max-w-md mx-auto min-h-screen bg-stone-50/90 border-x border-stone-200/50 shadow-2xl relative pb-36 select-none">
        
        {/* Top Native Status Accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Flutter SliverAppBar Feel Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/70 sticky top-0 z-30 shadow-xs pt-safe transition-all">
          <div className="px-4 py-3 flex items-center justify-between gap-2.5">
            {/* Brand Info & Table Capsule */}
            <div className="flex items-center gap-3 min-w-0">
              {cafeLogo ? (
                <img
                  src={getImageUrl(cafeLogo)}
                  alt={cafeName}
                  className="w-10 h-10 object-contain rounded-2xl bg-amber-50/80 p-1 border border-amber-200/80 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-amber-500/25 shrink-0">
                  <Coffee className="w-5 h-5 drop-shadow-xs" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h1 className="font-black text-xs sm:text-sm text-stone-900 leading-tight truncate">
                    {cafeName}
                  </h1>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                </div>

                {/* Table Badge Capsule */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-stone-900 text-white shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>MEJA {tableData.tableNumber}</span>
                  </div>
                  {tableData.name && (
                    <span className="text-[10px] text-stone-500 font-semibold truncate max-w-[80px]">
                      ({tableData.name})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Native Action Buttons: Waiter Bell, My Orders, Cart */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Call Waiter Mini Button */}
              <button
                type="button"
                onClick={() => setIsCallWaiterOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:text-amber-800 hover:bg-amber-50 border border-stone-200/80 transition active:scale-90 cursor-pointer shadow-2xs"
                title="Panggil Pelayan"
              >
                <ConciergeBell className="w-4 h-4" />
              </button>

              {/* My Orders Mini Button */}
              <button
                type="button"
                onClick={() => setIsMyOrdersOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:text-amber-800 hover:bg-amber-50 border border-stone-200/80 transition active:scale-90 cursor-pointer relative shadow-2xs"
                title="Pesanan Saya"
              >
                <Receipt className="w-4 h-4" />
                {savedOrders.length > 0 && (
                  <span className={`absolute -top-1 -right-1 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md ${
                    latestActiveOrder ? 'bg-gradient-to-tr from-orange-600 to-red-600 animate-pulse' : 'bg-stone-700'
                  }`}>
                    {savedOrders.length}
                  </span>
                )}
              </button>

              {/* Cart Mini Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 transition active:scale-90 cursor-pointer relative"
                title="Keranjang"
              >
                <ShoppingBag className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-tr from-orange-600 to-red-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Discount Promo Banner if any */}
          {activeDiscounts && activeDiscounts.length > 0 && (
            <div className="px-4 pb-2.5">
              <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-2xl px-3 py-2 flex items-center justify-between text-xs text-white shadow-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Percent className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="truncate">
                    <span className="font-black text-[11px] truncate block leading-tight">
                      🎉 {activeDiscounts[0].name}
                    </span>
                    <span className="text-[9px] text-amber-100 font-medium block truncate">
                      {activeDiscounts[0].scope === 'ALL_ITEMS'
                        ? 'Berlaku untuk semua menu!'
                        : 'Berlaku untuk menu pilihan'}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-xl bg-white text-red-600 font-black text-[10px] shadow-2xs">
                  {activeDiscounts[0].type === 'PERCENTAGE'
                    ? `-${Number(activeDiscounts[0].value)}%`
                    : `Hemat ${formatRupiah(activeDiscounts[0].value)}`}
                </span>
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="px-4 pb-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari kopi, makanan, cemilan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2 bg-stone-100/90 border border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Flutter Category Chips Carousel */}
          <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-0.5">
            {/* All Menu Pill */}
            <button
              onClick={() => setActiveCategory('all')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-md shadow-stone-900/20 scale-[1.02]'
                  : 'bg-white text-stone-600 hover:bg-stone-100/90 border border-stone-200/80 shadow-2xs'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Semua</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeCategory === 'all' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {products.length}
              </span>
            </button>

            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const IconComp = getCategoryIcon(cat.name);
              const count = products.filter(
                (p) => p.categoryId === cat.id || (p.category && p.category.name.toLowerCase() === cat.name.toLowerCase())
              ).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-md shadow-stone-900/20 scale-[1.02]'
                      : 'bg-white text-stone-600 hover:bg-stone-100/90 border border-stone-200/80 shadow-2xs'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Main Product Feed (Flutter ListView) */}
        <main className="px-4 py-3.5 space-y-3">
          {/* Hero Ambience Card for Table Guest (UI-UX Pro Max) */}
          <div className="p-4 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl shadow-md shadow-orange-500/20 relative overflow-hidden space-y-2.5">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200 bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Layanan Meja Aktif
              </span>
              <span className="text-xs font-black tracking-tight text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs shadow-2xs">
                MEJA {tableData.tableNumber}
              </span>
            </div>
            <div>
              <h2 className="text-base font-black leading-tight text-white">
                Selamat Datang di {cafeName}
              </h2>
              <p className="text-[11px] text-amber-100/90 leading-relaxed mt-1">
                Pilih hidangan favorit Anda, pesan langsung dari meja, dan pesanan akan diantar ke meja ini.
              </p>
            </div>
            <div className="pt-0.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCallWaiterOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer backdrop-blur-xs"
              >
                <ConciergeBell className="w-3.5 h-3.5" />
                <span>Panggil Pelayan</span>
              </button>
              {savedOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsMyOrdersOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-black/25 hover:bg-black/35 text-amber-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer backdrop-blur-xs"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-300" />
                  <span>Pesanan Saya ({savedOrders.length})</span>
                </button>
              )}
            </div>
          </div>
          {/* Results Counter if searching */}
          {searchQuery.trim() !== '' && (
            <div className="flex items-center justify-between text-xs text-stone-500 px-1">
              <span>
                Hasil pencarian &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </span>
              <span className="font-bold text-amber-700">{filteredProducts.length} menu</span>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-stone-400 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs">
              <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <Coffee className="w-7 h-7 stroke-1" />
              </div>
              <p className="text-sm font-black text-stone-800">Menu Tidak Ditemukan</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'Coba gunakan kata kunci lain atau pilih kategori di atas.'
                  : 'Belum ada menu yang tersedia di kategori ini.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 rounded-2xl bg-amber-600 text-white font-black text-xs hover:bg-amber-700 transition active:scale-95 cursor-pointer"
                >
                  Tampilkan Semua Menu
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((product) => {
              const hasCustomization =
                (product.variants && product.variants.length > 0) ||
                (product.modifiers && product.modifiers.length > 0);

              const isOutOfStock = product.status === 'OUT_OF_STOCK';
              const cartQty = getProductCartCount(product.id);
              const discountInfo = getProductDiscountInfo(product);
              const simpleItem = getSimpleCartItem(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && setSelectedProduct(product)}
                  className={`p-3.5 bg-white rounded-3xl border transition-all duration-200 flex justify-between gap-3 relative select-none ${
                    isOutOfStock
                      ? 'border-stone-200 opacity-60 cursor-not-allowed bg-stone-50/50'
                      : 'border-stone-200/80 hover:border-amber-300 hover:shadow-md cursor-pointer active:scale-[0.99] shadow-xs'
                  }`}
                >
                  {/* Left: Product Info & Actions */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-sm text-stone-900 leading-snug">
                          {product.name}
                        </h3>
                        {hasCustomization && (
                          <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded-md border border-amber-200/60">
                            Kustom
                          </span>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Direct Stepper / Add Action Button */}
                    <div className="mt-3 flex items-center justify-between pt-1">
                      {/* Price Display */}
                      <div className="flex flex-col">
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider leading-none">
                          Harga
                        </span>
                        {discountInfo ? (
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="font-black text-sm text-red-600 leading-tight">
                              {formatRupiah(discountInfo.discountedPrice)}
                            </span>
                            <span className="text-[10px] text-stone-400 line-through font-medium leading-tight">
                              {formatRupiah(product.basePrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-sm text-amber-900 leading-tight mt-0.5">
                            {formatRupiah(product.basePrice)}
                          </span>
                        )}
                      </div>

                      {/* Action Button: Habis / Stepper / Pilih */}
                      {isOutOfStock ? (
                        <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-xl border border-red-100">
                          Habis
                        </span>
                      ) : hasCustomization ? (
                        /* Customizable Menu */
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer shadow-2xs ${
                            cartQty > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{cartQty > 0 ? `${cartQty} • Ubah` : 'Pilih'}</span>
                        </button>
                      ) : (
                        /* Simple Non-customizable Menu (Direct Stepper) */
                        cartQty === 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(product, undefined, [], 1);
                            }}
                            className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs transition active:scale-90 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                        ) : (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-2 py-1 rounded-xl shadow-sm border border-stone-800"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (simpleItem) {
                                  updateQuantity(simpleItem.id, -1);
                                }
                              }}
                              className="w-5 h-5 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white active:scale-75 transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black w-4 text-center">
                              {cartQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (simpleItem) {
                                  updateQuantity(simpleItem.id, 1);
                                } else {
                                  addItem(product, undefined, [], 1);
                                }
                              }}
                              className="w-5 h-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center active:scale-75 transition cursor-pointer font-black"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Right: Product Image Thumbnail with Floating Discount Tag */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-50/70 border border-amber-100/90 shrink-0 flex items-center justify-center text-amber-700/60 overflow-hidden relative shadow-2xs">
                    {discountInfo && (
                      <span className="absolute top-1 left-1 z-10 text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{discountInfo.label}</span>
                      </span>
                    )}

                    {product.image ? (
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-2xl aspect-square"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Coffee className="w-7 h-7 stroke-1 text-amber-600/50" />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Customer Trust Footer */}
          <div className="pt-8 pb-12 text-center text-xs text-stone-400 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pemesanan & Pembayaran QR Meja Terenkripsi</span>
            </div>
            <div className="text-[10px] text-stone-400">
              <span>Didukung oleh Cafe POS System</span>
            </div>
          </div>
        </main>

        {/* Floating Active Order Live Tracker Pill */}
        {latestActiveOrder && (
          <div className={`fixed ${totalCartCount > 0 ? 'bottom-20' : 'bottom-4'} inset-x-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-3 duration-200`}>
            <div
              onClick={() => {
                const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
                router.push(`/order/status/${latestActiveOrder.orderId}${tokenQuery}`);
              }}
              className="p-3 bg-stone-950/95 backdrop-blur-xl text-white rounded-2xl shadow-xl border border-amber-500/40 flex items-center justify-between cursor-pointer hover:bg-stone-900 transition transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-stone-400 flex items-center gap-1.5 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-extrabold text-emerald-400">#{latestActiveOrder.orderNumber}</span>
                    <span>•</span>
                    <span>Meja {tableData.tableNumber}</span>
                  </div>
                  <div className="text-xs font-black text-amber-300 truncate mt-1">
                    Status: {getStatusLabel(latestActiveOrder.status)}
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl shadow-xs shrink-0 ml-2 transition">
                <span>Lihat Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        {/* Floating Persistent Bottom Cart Widget (Flutter-like Floating Pill) */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-5 duration-200">
            <div
              onClick={() => setIsCartOpen(true)}
              className="p-3 bg-stone-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-900 transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-xs text-white shadow-md shadow-amber-500/30 shrink-0">
                  {totalCartCount}
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 flex items-center gap-1 leading-tight">
                    <span>Meja {tableData.tableNumber}</span>
                    <span>•</span>
                    <span>{totalCartCount} item siap</span>
                  </div>
                  <div className="font-black text-sm sm:text-base text-amber-400 leading-tight mt-0.5">
                    {formatRupiah(totalAmount)}
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-xs font-black bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-3.5 py-2 rounded-xl shadow-md transition shrink-0">
                <span>Keranjang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        {/* Flutter Native Modal Bottom Sheets */}
        <ModifierModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          company={companyData}
          tableToken={token}
        />

        <MyOrdersDrawer
          isOpen={isMyOrdersOpen}
          onClose={() => setIsMyOrdersOpen(false)}
          currentTableToken={token}
        />

        <CallWaiterModal
          isOpen={isCallWaiterOpen}
          onClose={() => setIsCallWaiterOpen(false)}
          tableToken={token}
          tableId={tableData?.id}
          tableNumber={tableData?.tableNumber}
        />
      </div>
    </div>
  );
}
