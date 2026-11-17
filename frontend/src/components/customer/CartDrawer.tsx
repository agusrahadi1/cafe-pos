/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatRupiah, getImageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  Banknote,
  Loader2,
  AlertCircle,
  QrCode as QrIcon,
  Zap,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Store,
} from 'lucide-react';
import { PaymentMethod } from '@/types';
import { saveCustomerOrder } from '@/lib/customerOrders';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company?: any;
  tableToken?: string;
}

export default function CartDrawer({ isOpen, onClose, company, tableToken }: CartDrawerProps) {
  const router = useRouter();
  const {
    items,
    tableId,
    tableNumber,
    customerName,
    customerPhone,
    customerNotes,
    subtotal,
    taxRate,
    serviceRate,
    taxAmount,
    serviceChargeAmount,
    discountAmount,
    appliedDiscount,
    totalAmount,
    setCustomerInfo,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [name, setName] = useState(() => {
    if (customerName) return customerName;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cafe_customer_name') || '';
    }
    return '';
  });
  const [phone, setPhone] = useState(() => {
    if (customerPhone) return customerPhone;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cafe_customer_phone') || '';
    }
    return '';
  });
  const [notes, setNotes] = useState(customerNotes || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('XENDIT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitOrder = async () => {
    if (!name.trim()) {
      setError('Mohon masukkan nama pemesan.');
      return;
    }

    if (items.length === 0) {
      setError('Keranjang Anda masih kosong.');
      return;
    }

    setLoading(true);
    setError(null);

    // Auto-persist customer details for future orders in this cafe
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cafe_customer_name', name.trim());
        if (phone.trim()) localStorage.setItem('cafe_customer_phone', phone.trim());
      } catch {}
    }

    try {
      setCustomerInfo(name, phone, notes);

      // Build payload according to CreateOrderDto
      const payload = {
        tableId: tableId || undefined,
        customerName: name.trim(),
        customerPhone: phone.trim() || undefined,
        customerNotes: notes.trim() || undefined,
        paymentMethod: paymentMethod === 'XENDIT' ? 'BORDERPAY' : paymentMethod,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id || undefined,
          quantity: item.quantity,
          notes: item.notes || undefined,
          modifiers: item.selectedModifiers.map((m) => ({
            modifierGroupId: m.modifierGroupId,
            modifierOptionId: m.modifierOptionId,
          })),
        })),
      };

      const order = await api.post<any>('/orders', payload);

      if (order && order.id) {
        const tokenQuery = tableToken ? `?token=${encodeURIComponent(tableToken)}` : '';
        const statusPageUrl = `/order/status/${order.id}${tokenQuery}`;

        // Save order to customer's "Pesanan Saya" persistence
        saveCustomerOrder({
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableToken: tableToken || '',
          tableNumber: tableNumber,
          totalAmount: totalAmount,
          status: order.status || 'PENDING_PAYMENT',
          itemCount: items.reduce((s, i) => s + i.quantity, 0),
          firstItemName: items[0]?.product?.name,
        });

        if (typeof window !== 'undefined' && tableToken) {
          localStorage.setItem('cafe_active_qr_token', tableToken);
          if (tableNumber) localStorage.setItem('cafe_active_table_number', String(tableNumber));
        }

        // Process BorderPay QRIS / Online Payment
        if (
          paymentMethod === 'XENDIT' ||
          paymentMethod === 'QRIS' ||
          paymentMethod === 'BORDERPAY'
        ) {
          try {
            const paymentId = order.payments?.[0]?.id;
            if (paymentId) {
              const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
              const bpRes = await api.post<any>(`/payments/${paymentId}/process-borderpay`, { origin });
              if (bpRes && bpRes.paymentUrl) {
                clearCart();
                onClose();
                const separator = statusPageUrl.includes('?') ? '&' : '?';
                router.push(`${statusPageUrl}${separator}openQris=1`);
                return;
              }
            }
          } catch (bpErr: any) {
            console.warn('BorderPay payment processing warning:', bpErr);
          }
        }

        clearCart();
        onClose();
        router.push(statusPageUrl);
      } else {
        setError('Gagal membuat pesanan. Silakan coba lagi.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim pesanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md max-h-[92vh] rounded-t-[32px] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 relative select-none pb-safe"
      >
        {/* Flutter Drag Handle Pill */}
        <div className="pt-3 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Bottom Sheet Header */}
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            {company?.logoUrl || company?.logo ? (
              <img
                src={getImageUrl(company.logoUrl || company.logo)}
                alt={company?.name || 'Logo'}
                className="w-9 h-9 object-contain rounded-2xl bg-amber-50 p-1 border border-amber-200/80 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0 border border-amber-500/20">
                <ShoppingBag className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-black text-stone-900 text-sm leading-tight">
                {company?.name ? company.name : 'Keranjang Pesanan'}
              </h3>
              <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{tableNumber ? `Meja ${tableNumber}` : 'Pesanan Meja'}</span>
                <span>•</span>
                <span className="text-stone-500 font-medium">
                  {items.reduce((s, i) => s + i.quantity, 0)} Item
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200/80 transition active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="py-14 text-center text-stone-400">
              <div className="w-14 h-14 rounded-3xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-7 h-7 stroke-1" />
              </div>
              <p className="text-sm font-bold text-stone-700">Keranjang Belanja Kosong</p>
              <p className="text-xs text-stone-400 mt-1">Pilih hidangan lezat favorit Anda terlebih dahulu</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-black text-stone-500 uppercase tracking-wider">
                <span>Daftar Menu ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 font-semibold normal-case text-xs transition active:scale-95 cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/60 flex flex-col gap-2.5 transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 pr-1">
                      <div className="font-extrabold text-sm text-stone-900 leading-snug">
                        {item.product.name}
                      </div>
                      {item.variant && (
                        <div className="text-xs text-amber-800 font-bold mt-0.5">
                          Varian: {item.variant.name}
                        </div>
                      )}
                      {item.selectedModifiers.length > 0 && (
                        <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                          + {item.selectedModifiers.map((m) => m.modifierOptionName).join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[11px] text-stone-500 italic mt-0.5">
                          &ldquo;{item.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-sm text-stone-900">
                        {formatRupiah(item.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Actions Stepper */}
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200/50">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-stone-400 hover:text-red-600 p-1 transition active:scale-90 cursor-pointer"
                      title="Hapus Menu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="inline-flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-stone-200 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center active:scale-75 transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-stone-900 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center active:scale-75 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer Details Form */}
          {items.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                Informasi Pemesan
              </label>

              <div>
                <input
                  type="text"
                  placeholder="Nama Lengkap Pemesan *"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 bg-stone-100/80 border border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition font-medium"
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Nomor WhatsApp (Opsional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-3 bg-stone-100/80 border border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition font-medium"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Catatan pesanan meja (Opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-3 bg-stone-100/80 border border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition font-medium"
                />
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          {items.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-stone-100">
              <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                Metode Pembayaran
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('XENDIT')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.98] cursor-pointer relative overflow-hidden ${
                    paymentMethod === 'XENDIT'
                      ? 'border-amber-600 bg-amber-50/80 text-amber-950 font-semibold ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <QrIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold text-stone-900">QRIS & Online</span>
                  </div>
                  <span className="text-[10px] text-stone-500 mt-2">Otomatis & Terverifikasi</span>
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full w-fit">
                    <Zap className="w-2.5 h-2.5" />
                    <span>Instan Otomatis</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'border-amber-600 bg-amber-50/80 text-amber-950 font-semibold ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold text-stone-900">Bayar Kasir</span>
                  </div>
                  <span className="text-[10px] text-stone-500 mt-2">Bayar tunai ke kasir</span>
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full w-fit">
                    <span>Kasir Manual</span>
                  </div>
                </button>
              </div>

              {/* Payment Channel Badges Info */}
              {(paymentMethod === 'XENDIT' || paymentMethod === 'QRIS' || paymentMethod === 'BORDERPAY') && (
                <div className="p-3.5 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 rounded-2xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Pembayaran Otomatis BorderPay</span>
                    </span>
                    <span className="text-[10px] font-black bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-full">
                      QRIS Instan
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Mendukung pembayaran langsung dengan <strong>QRIS (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, DANA)</strong> & Virtual Account.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {['QRIS Dinamis', 'BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'DANA', 'ShopeePay'].map((channel) => (
                      <span
                        key={channel}
                        className="text-[10px] font-bold bg-white border border-emerald-200 text-stone-700 px-2 py-0.5 rounded-lg shadow-2xs"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="p-3 bg-stone-100/80 rounded-2xl border border-stone-200/80 text-xs text-stone-600 space-y-1">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pembayaran Tunai di Kasir</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Setelah memesan, silakan ke kasir dan sebutkan nomor pesanan untuk konfirmasi bayar tunai.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Price Breakdown */}
          {items.length > 0 && (
            <div className="p-4 bg-stone-50/90 rounded-2xl space-y-2 text-xs text-stone-600 border border-stone-200/60">
              <div className="flex justify-between font-medium">
                <span>Subtotal Menu</span>
                <span className="font-bold text-stone-900">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Diskon Promo {appliedDiscount ? `(${appliedDiscount.name})` : ''}</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Pajak Resto ({Math.round((taxRate || 0) * 100)}%)</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
              )}
              {serviceChargeAmount > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Service Charge ({Math.round((serviceRate || 0) * 100)}%)</span>
                  <span>{formatRupiah(serviceChargeAmount)}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-stone-200/80 flex justify-between font-black text-sm text-stone-900">
                <span>Total Pembayaran</span>
                <span className="text-amber-800 text-base">{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-100 bg-white/95 backdrop-blur-md shrink-0">
            <button
              onClick={handleSubmitOrder}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm shadow-lg shadow-amber-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 transition active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Memproses Pesanan...</span>
                </>
              ) : (
                <div className="flex items-center justify-between w-full px-2">
                  <div className="text-left">
                    <span className="block text-[11px] font-medium text-amber-100 leading-tight">
                      Kirim Pesanan
                    </span>
                    <span className="text-base font-black leading-tight">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-black text-xs bg-white/20 px-3 py-1.5 rounded-xl">
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
