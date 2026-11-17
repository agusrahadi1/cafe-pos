'use client';

import React, { useState, useMemo } from 'react';
import { Product, OrderStatus, Discount, Order } from '@/types';
import { api } from '@/lib/api';
import { formatRupiah, getImageUrl } from '@/lib/utils';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Coffee,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShoppingBag,
  User,
  Utensils,
  Car,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  Receipt,
  FileText,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Check,
  Tag,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  discountedPrice?: number;
  unitSaving?: number;
}

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  tables: any[];
  products: Product[];
  activeDiscounts?: Discount[];
  activeOrders?: Order[];
}

type PaymentMethodType = 'CASH' | 'QRIS' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'BANK_TRANSFER';

export default function NewOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  tables,
  products,
  activeDiscounts = [],
  activeOrders = [],
}: NewOrderModalProps) {
  // Navigation for mobile screens (Tab 1: Menu, Tab 2: Checkout)
  const [mobileTab, setMobileTab] = useState<'MENU' | 'CHECKOUT'>('MENU');

  // Order Details
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DRIVE_THRU'>('DINE_IN');
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Catalog Filters
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Payment Setup
  const [paymentOption, setPaymentOption] = useState<'PAY_NOW' | 'PAY_LATER'>('PAY_NOW');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Extract Categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean))) as string[];
    return ['ALL', ...cats];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'AVAILABLE' && p.isActive === false) return false;
      const matchSearch =
        !searchProduct ||
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchProduct.toLowerCase()));
      const matchCat = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchProduct, selectedCategory]);

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

  // Real-time Tables Status Map based on active orders
  const tableStatusMap = useMemo(() => {
    const map = new Map<string, { isOccupied: boolean; activeOrder?: Order }>();
    const activeStatuses: OrderStatus[] = [
      'PENDING_PAYMENT',
      'PAID',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    (activeOrders || []).forEach((order) => {
      if (order.tableId && activeStatuses.includes(order.status)) {
        if (!map.has(order.tableId)) {
          map.set(order.tableId, { isOccupied: true, activeOrder: order });
        }
      }
    });

    return map;
  }, [activeOrders]);

  if (!isOpen) return null;

  // Cart operations
  const addToCart = (product: Product) => {
    setError('');
    const discountInfo = getProductDiscountInfo(product);
    const discountedPrice = discountInfo ? discountInfo.discountedPrice : Number(product.basePrice);
    const unitSaving = discountInfo ? discountInfo.saving : 0;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, discountedPrice, unitSaving }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updateItemNotes = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, notes } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const regularSubtotal = cart.reduce(
    (acc, item) => acc + Number(item.product.basePrice) * item.quantity,
    0
  );
  const totalDiscountAmount = cart.reduce((acc, item) => {
    const discountInfo = getProductDiscountInfo(item.product);
    const saving = discountInfo ? discountInfo.saving : (item.unitSaving || 0);
    return acc + saving * item.quantity;
  }, 0);

  const totalAmount = Math.max(0, regularSubtotal - totalDiscountAmount);

  // Cash Calculation
  const cashReceivedNumber = Number(cashReceivedInput.replace(/\D/g, '')) || 0;
  const changeAmount = cashReceivedNumber - totalAmount;

  const handleCashPreset = (amount: number) => {
    setCashReceivedInput(amount.toLocaleString('id-ID'));
  };

  const handleExactCash = () => {
    setCashReceivedInput(totalAmount.toLocaleString('id-ID'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Pilih minimal 1 menu untuk membuat pesanan.');
      return;
    }

    if (orderType === 'DINE_IN' && !tableId) {
      setError('Harap pilih nomor meja untuk pesanan Dine In.');
      return;
    }

    if (paymentOption === 'PAY_NOW' && paymentMethod === 'CASH') {
      if (cashReceivedNumber > 0 && cashReceivedNumber < totalAmount) {
        setError(
          `Uang tunai kurang ${formatRupiah(totalAmount - cashReceivedNumber)}. Harap terima uang yang cukup.`
        );
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Send create order with validated paymentMethod and discountAmount
      const payload = {
        tableId: orderType === 'DINE_IN' ? tableId : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerNotes: customerNotes.trim() || undefined,
        paymentMethod: paymentMethod, // Wajib diisi: CASH, QRIS, DEBIT_CARD, dll
        discountAmount: totalDiscountAmount > 0 ? totalDiscountAmount : undefined,
        items: cart.map((item) => {
          const discountInfo = getProductDiscountInfo(item.product);
          const itemSaving = discountInfo ? discountInfo.saving : 0;
          return {
            productId: item.product.id,
            quantity: item.quantity,
            discountAmount: itemSaving > 0 ? itemSaving * item.quantity : undefined,
            notes: item.notes || undefined,
          };
        }),
      };

      const createdOrder = await api.post<any>('/orders', payload);

      // 2. If cashier selected "PAY_NOW" and order was created successfully:
      if (paymentOption === 'PAY_NOW' && createdOrder?.id) {
        try {
          // Update status to PAID / CONFIRMED immediately
          await api.put(`/orders/${createdOrder.id}/status`, {
            status: 'CONFIRMED',
            reason: `Kasir bayar langsung (${paymentMethod})`,
          });
        } catch (statusErr) {
          console.warn('Auto status update to CONFIRMED notice:', statusErr);
        }
      }

      onOrderCreated();
      onClose();

      // Reset Form
      setCart([]);
      setTableId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNotes('');
      setCashReceivedInput('');
      setMobileTab('MENU');
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat pesanan baru.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-3 md:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[94vh] sm:max-w-5xl xl:max-w-6xl rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-100 pb-safe select-none"
      >
        {/* Flutter Drag Handle for Mobile */}
        <div className="pt-2.5 pb-0.5 flex justify-center shrink-0 sm:hidden">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* =========================================================================
            1. MODAL HEADER
           ========================================================================= */}
        <header className="px-4 py-3 sm:px-6 sm:py-4 border-b border-stone-200/80 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg text-stone-900 tracking-tight">
                  Buat Pesanan Baru
                </h2>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                  POS Kasir
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Pilih menu, tentukan meja & pelanggan, serta konfirmasi pembayaran langsung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab Switcher */}
            <div className="flex sm:hidden bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMobileTab('MENU')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  mobileTab === 'MENU'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500'
                }`}
              >
                Menu
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('CHECKOUT')}
                className={`px-3 py-1.5 rounded-lg transition relative ${
                  mobileTab === 'CHECKOUT'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500'
                }`}
              >
                Pesanan
                {cart.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-orange-600 text-white rounded-full text-[9px]">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            2. BODY CONTENT (DUAL COLUMN DESKTOP & TABLET / TABBED MOBILE)
           ========================================================================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-stone-50/50">
          {/* ---------------------------------------------------------------------
              LEFT COLUMN: MENU CATALOG (7 OF 12 COLS)
             --------------------------------------------------------------------- */}
          <div
            className={`lg:col-span-7 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-stone-200/80 bg-white ${
              mobileTab === 'CHECKOUT' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Search & Categories Bar */}
            <div className="p-3 sm:p-4 border-b border-stone-100 space-y-2.5 shrink-0 bg-stone-50/30">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama menu atau kategori..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-white border border-stone-200/90 rounded-2xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                {searchProduct && (
                  <button
                    type="button"
                    onClick={() => setSearchProduct('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Horizontal Scrollable Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  const count = cat === 'ALL'
                    ? products.length
                    : products.filter((p) => p.category?.name === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                      }`}
                    >
                      <span>{cat === 'ALL' ? 'Semua Menu' : cat}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-stone-700 text-stone-200' : 'bg-stone-200/90 text-stone-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto scrollbar-thin">
              {filteredProducts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-3xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                    <Coffee className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-stone-800">Menu Tidak Ditemukan</p>
                  <p className="text-xs text-stone-400 mt-1 max-w-xs">
                    Coba ubah kata kunci pencarian atau pilih kategori menu yang lain.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                  {filteredProducts.map((prod) => {
                    const inCart = cart.find((item) => item.product.id === prod.id);
                    const discountInfo = getProductDiscountInfo(prod);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => addToCart(prod)}
                        className={`group relative p-2.5 sm:p-3 rounded-2xl border transition duration-150 cursor-pointer flex flex-col justify-between select-none active:scale-95 ${
                          inCart
                            ? 'bg-orange-50/70 border-orange-400 shadow-sm ring-1 ring-orange-400/50'
                            : 'bg-white border-stone-200/80 hover:border-orange-300 hover:shadow-md'
                        }`}
                      >
                        <div>
                          {/* Image Container */}
                          <div className="w-full aspect-4/3 rounded-xl bg-stone-100 overflow-hidden mb-2 relative">
                            {prod.image ? (
                              <img
                                src={getImageUrl(prod.image)}
                                alt={prod.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300 bg-gradient-to-tr from-stone-100 to-stone-50">
                                <Coffee className="w-8 h-8 opacity-40" />
                              </div>
                            )}

                            {/* Floating Promo Badge */}
                            {discountInfo && (
                              <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md animate-pulse">
                                <Tag className="w-2.5 h-2.5" />
                                <span>{discountInfo.label}</span>
                              </div>
                            )}

                            {/* Floating Active Quantity Badge */}
                            {inCart && (
                              <div className="absolute top-1.5 right-1.5 bg-orange-600 text-white font-black text-xs min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                                {inCart.quantity}
                              </div>
                            )}
                          </div>

                          <p className="font-extrabold text-xs sm:text-sm text-stone-900 group-hover:text-orange-600 line-clamp-1 transition">
                            {prod.name}
                          </p>
                          {prod.category?.name && (
                            <p className="text-[10px] text-stone-400 font-medium line-clamp-1">
                              {prod.category.name}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                          <div>
                            {discountInfo ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono text-stone-400 line-through">
                                  {formatRupiah(prod.basePrice)}
                                </span>
                                <span className="font-mono text-xs sm:text-sm font-black text-red-600">
                                  {formatRupiah(discountInfo.discountedPrice)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-xs sm:text-sm font-black text-stone-900">
                                {formatRupiah(prod.basePrice)}
                              </span>
                            )}
                          </div>
                          {inCart ? (
                            <div
                              className="flex items-center gap-1 bg-orange-600 text-white rounded-xl p-0.5 shadow-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => updateQuantity(prod.id, -1)}
                                className="w-6 h-6 rounded-lg hover:bg-orange-700 flex items-center justify-center cursor-pointer active:scale-90 transition"
                                title="Kurangi Kuantiti"
                              >
                                <Minus className="w-3 h-3 text-white" />
                              </button>
                              <span className="w-5 text-center font-black text-xs font-mono select-none">
                                {inCart.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(prod.id, 1)}
                                className="w-6 h-6 rounded-lg hover:bg-orange-700 flex items-center justify-center cursor-pointer active:scale-90 transition"
                                title="Tambah Kuantiti"
                              >
                                <Plus className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition shadow-2xs active:scale-90 cursor-pointer"
                              title="Tambah ke Pesanan"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Bottom Quick Switcher */}
            <div className="p-3 border-t border-stone-200 bg-white lg:hidden flex items-center justify-between">
              <div>
                <p className="text-[11px] text-stone-500 font-medium">
                  {cart.length} item dipilih
                </p>
                <p className="text-sm font-black font-mono text-stone-900">
                  {formatRupiah(totalAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileTab('CHECKOUT')}
                disabled={cart.length === 0}
                className="py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Lanjut ke Pesanan</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              RIGHT COLUMN: ORDER INFO, CART & PAYMENT (5 OF 12 COLS)
             --------------------------------------------------------------------- */}
          <div
            className={`lg:col-span-5 flex flex-col justify-between overflow-hidden bg-white ${
              mobileTab === 'MENU' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
              {/* Scrollable Order Details & Payment Area */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin flex-1">
                {/* Mobile Back Button */}
                <div className="lg:hidden pb-1">
                  <button
                    type="button"
                    onClick={() => setMobileTab('MENU')}
                    className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Pilihan Menu</span>
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-2xl text-xs flex items-start gap-2.5 border border-red-200 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 font-semibold">{error}</div>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="text-red-400 hover:text-red-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 1. Tipe Pesanan Segmented Control */}
                <div>
                  <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1.5">
                    1. Tipe Pesanan
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setOrderType('DINE_IN')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        orderType === 'DINE_IN'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Dine In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('TAKEAWAY')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        orderType === 'TAKEAWAY'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Takeaway</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('DRIVE_THRU')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        orderType === 'DRIVE_THRU'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Drive Thru</span>
                    </button>
                  </div>
                </div>

                {/* 2. Meja & Informasi Pelanggan */}
                <div className="space-y-2.5">
                  {orderType === 'DINE_IN' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                          Pilih Nomor Meja <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-stone-400">
                          {tables.length} Meja
                        </span>
                      </div>

                      {/* Quick Visual Table Chips */}
                      {tables.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                          {tables.map((t) => {
                            const statusInfo = tableStatusMap.get(t.id);
                            const activeOrder = statusInfo?.activeOrder;
                            const isOccupied =
                              t.status === 'AVAILABLE'
                                ? !!(activeOrder && ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY'].includes(activeOrder.status))
                                : (statusInfo?.isOccupied || ['OCCUPIED', 'ORDERING', 'PREPARING', 'WAITING_DELIVERY'].includes(t.status));
                            const isSelected = tableId === t.id;

                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setTableId(t.id);
                                  setError('');
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-black shrink-0 border transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                  isSelected
                                    ? 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-500/20'
                                    : isOccupied
                                    ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
                                }`}
                                title={`Meja ${t.tableNumber} - ${isOccupied ? 'Sedang Terisi' : 'Kosong Tersedia'}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-rose-500' : 'bg-emerald-500'} ${isSelected ? 'ring-2 ring-white' : ''}`} />
                                <span>Meja {t.tableNumber}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <select
                        value={tableId}
                        onChange={(e) => {
                          setTableId(e.target.value);
                          setError('');
                        }}
                        className="w-full py-2.5 px-3 bg-stone-50 hover:bg-stone-100/70 border border-stone-200/90 rounded-2xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition cursor-pointer"
                      >
                        <option value="">-- Atau Pilih dari Dropdown Meja --</option>
                        {tables.map((t) => {
                          const statusInfo = tableStatusMap.get(t.id);
                          const activeOrder = statusInfo?.activeOrder;
                          // If table is marked AVAILABLE, only mark occupied if an order is actively in payment or preparation
                          const isOccupied =
                            t.status === 'AVAILABLE'
                              ? !!(activeOrder && ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY'].includes(activeOrder.status))
                              : (statusInfo?.isOccupied || ['OCCUPIED', 'ORDERING', 'PREPARING', 'WAITING_DELIVERY'].includes(t.status));
                          const guestName = isOccupied && activeOrder?.customerName ? ` (${activeOrder.customerName})` : '';

                          return (
                            <option key={t.id} value={t.id}>
                              Meja {t.tableNumber} {isOccupied ? `🔴 (Terisi${guestName})` : '🟢 (Kosong / Tersedia)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1">
                        Nama Pelanggan
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Nama (opsional)"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200/90 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-1">
                        No. HP (WhatsApp)
                      </label>
                      <input
                        type="text"
                        placeholder="0812..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200/90 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Ringkasan Keranjang Item */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                      2. Rincian Pesanan ({cart.length} item)
                    </label>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCart([])}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 transition cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>

                  <div className="border border-stone-200/80 rounded-2xl divide-y divide-stone-100 max-h-40 overflow-y-auto bg-stone-50/40 scrollbar-thin">
                    {cart.length === 0 ? (
                      <div className="py-6 text-center text-stone-400 text-xs flex flex-col items-center justify-center">
                        <ShoppingBag className="w-6 h-6 mb-1.5 opacity-30" />
                        <span>Belum ada menu yang dipilih</span>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.product.id} className="p-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-stone-900 truncate">
                                {item.product.name}
                              </p>
                              {item.unitSaving && item.unitSaving > 0 ? (
                                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                  <span className="text-stone-400 line-through">
                                    {formatRupiah(item.product.basePrice)}
                                  </span>
                                  <span className="font-bold text-red-600">
                                    {formatRupiah(item.discountedPrice || (Number(item.product.basePrice) - item.unitSaving))}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-[11px] font-mono text-stone-500">
                                  {formatRupiah(item.product.basePrice)}
                                </p>
                              )}
                            </div>

                            {/* Counter Controls */}
                            <div className="flex items-center gap-1 shrink-0 bg-white border border-stone-200 rounded-xl p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="w-6 h-6 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-600 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-black text-xs text-stone-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="w-6 h-6 rounded-lg hover:bg-orange-50 text-orange-600 flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="w-6 h-6 rounded-lg text-stone-300 hover:text-red-600 flex items-center justify-center transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Item Note Toggle / Input */}
                          {editingNoteId === item.product.id ? (
                            <div className="mt-2 flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Catatan: sedikit gula, pedas..."
                                value={item.notes || ''}
                                onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                                className="flex-1 px-2.5 py-1 text-[11px] bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-2 py-1 bg-stone-200 hover:bg-stone-300 rounded-lg text-[10px] font-bold text-stone-700"
                              >
                                Simpan
                              </button>
                            </div>
                          ) : (
                            <div className="mt-1 flex items-center justify-between text-[10px]">
                              {item.notes ? (
                                <p className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md italic">
                                  "{item.notes}"
                                </p>
                              ) : (
                                <span />
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(item.product.id)}
                                className="text-stone-400 hover:text-orange-600 font-semibold cursor-pointer"
                              >
                                {item.notes ? 'Ubah Catatan' : '+ Tambah Catatan'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. METODE PEMBAYARAN & FULFILLMENT */}
                <div className="pt-2 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                      3. Pembayaran & Kasir
                    </label>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPaymentOption('PAY_NOW')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          paymentOption === 'PAY_NOW'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Bayar Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentOption('PAY_LATER')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          paymentOption === 'PAY_LATER'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Bayar Nanti
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'CASH', label: 'Tunai', icon: Banknote },
                      { id: 'QRIS', label: 'QRIS', icon: QrCode },
                      { id: 'DEBIT_CARD', label: 'Debit EDC', icon: CreditCard },
                      { id: 'CREDIT_CARD', label: 'Kredit', icon: CreditCard },
                      { id: 'BANK_TRANSFER', label: 'Transfer', icon: Building2 },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                          className={`p-2 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-2xs font-extrabold'
                              : 'bg-white border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-stone-50 font-bold'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-stone-400'}`} />
                          <span className="text-[10px] leading-tight">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash Change Calculator (Only if CASH and PAY_NOW) */}
                  {paymentOption === 'PAY_NOW' && paymentMethod === 'CASH' && (
                    <div className="p-3 bg-stone-50 border border-stone-200/90 rounded-2xl space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-stone-700">Uang Diterima:</span>
                        <div className="relative max-w-[160px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                            Rp
                          </span>
                          <input
                            type="text"
                            placeholder="0"
                            value={cashReceivedInput}
                            onChange={(e) => {
                              const num = e.target.value.replace(/\D/g, '');
                              setCashReceivedInput(num ? Number(num).toLocaleString('id-ID') : '');
                            }}
                            className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-right font-mono font-black text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={handleExactCash}
                          className="px-2 py-1 rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 transition shrink-0"
                        >
                          Uang Pas
                        </button>
                        {[10000, 20000, 50000, 100000, 200000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleCashPreset(amt)}
                            className="px-2 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition shrink-0 font-mono"
                          >
                            {(amt / 1000).toLocaleString('id-ID')}rb
                          </button>
                        ))}
                      </div>

                      {/* Live Kembalian Feedback */}
                      {cashReceivedNumber > 0 && (
                        <div
                          className={`p-2 rounded-xl flex items-center justify-between text-xs font-bold ${
                            changeAmount >= 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span>{changeAmount >= 0 ? 'Kembalian:' : 'Uang Kurang:'}</span>
                          <span className="font-mono font-black text-sm">
                            {formatRupiah(Math.abs(changeAmount))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* =========================================================================
                  BOTTOM SUMMARY & ACTION BUTTONS
                 ========================================================================= */}
              <div className="p-4 sm:p-5 border-t border-stone-200 bg-white space-y-3 shrink-0">
                <div className="space-y-1.5 border-b border-stone-100 pb-2 text-xs">
                  <div className="flex items-center justify-between text-stone-500">
                    <span>Subtotal Menu</span>
                    <span className="font-mono font-bold text-stone-800">{formatRupiah(regularSubtotal)}</span>
                  </div>

                  {totalDiscountAmount > 0 && (
                    <div className="flex items-center justify-between font-bold text-red-600 bg-red-50/70 px-2 py-1 rounded-lg">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>Diskon Promo:</span>
                      </span>
                      <span className="font-mono">-{formatRupiah(totalDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 font-extrabold text-stone-900">
                    <div>
                      <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                        Total Tagihan
                      </p>
                      <p className="text-xs text-stone-500 font-medium">
                        {paymentOption === 'PAY_NOW' ? 'Langsung Lunas' : 'Simpan Antrian Meja'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-black text-xl text-stone-900">
                        {formatRupiah(totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3 px-4 rounded-2xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || cart.length === 0}
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Pesanan...</span>
                      </>
                    ) : paymentOption === 'PAY_NOW' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Bayar & Proses Pesanan</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Simpan Antrian (Bayar Nanti)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
