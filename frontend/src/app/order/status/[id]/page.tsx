/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatRupiah, formatTime, getImageUrl } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  ConciergeBell,
  CheckCheck,
  AlertCircle,
  Coffee,
  RotateCw,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Banknote,
  Loader2,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Receipt,
  Plus,
  Store,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import CallWaiterModal from '@/components/customer/CallWaiterModal';
import QrisPaymentModal from '@/components/payments/QrisPaymentModal';
import { saveCustomerOrder } from '@/lib/customerOrders';

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableToken, setTableToken] = useState<string | null>(null);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [qrisData, setQrisData] = useState<{
    qrString?: string | null;
    qrImageUrl?: string | null;
    paymentUrl?: string | null;
  }>({});

  // Resolve active table token from query params, order data, or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qToken = urlParams.get('token');
      const storedToken = localStorage.getItem('cafe_active_qr_token');
      const orderTableToken = (order?.table as any)?.qrToken;

      const resolved = qToken || orderTableToken || storedToken || null;
      if (resolved) {
        setTableToken(resolved);
        localStorage.setItem('cafe_active_qr_token', resolved);
      }
    }
  }, [order]);

  // Handle auto-open QRIS modal if URL contains openQris=1
  useEffect(() => {
    if (typeof window !== 'undefined' && order && order.status === 'PENDING_PAYMENT') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openQris') === '1') {
        const cleanUrl = window.location.pathname + (tableToken ? `?token=${encodeURIComponent(tableToken)}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
        handlePayOnline();
      }
    }
  }, [order?.status]);

  const handlePayOnline = async () => {
    if (!order) return;
    if (
      order.status === 'PAID' ||
      order.status === 'COMPLETED' ||
      order.status === 'PREPARING' ||
      order.status === 'READY' ||
      order.status === 'DELIVERED'
    ) {
      alert('Pesanan ini sudah berhasil dibayar!');
      return;
    }

    setPaymentLoading(true);
    try {
      const payment = (order as any).payments?.[0];

      // 1. Cek langsung jika data QRIS sudah tersedia di payment object (instant reuse)
      const existingPayload = payment?.providerPayload;
      if (
        existingPayload &&
        (existingPayload.qrString ||
          existingPayload.qr_string ||
          existingPayload.paymentUrl ||
          existingPayload.pay_url)
      ) {
        setQrisData({
          qrString: existingPayload.qrString || existingPayload.qr_string || null,
          qrImageUrl: existingPayload.qrImageUrl || existingPayload.qr_image_url || null,
          paymentUrl: existingPayload.paymentUrl || existingPayload.pay_url || null,
        });
        setIsQrisModalOpen(true);
        setPaymentLoading(false);
        return;
      }

      // 2. Request ke backend jika belum tersedia
      const paymentId = payment?.id;
      if (paymentId) {
        const borderPayRes = await api.post<any>(`/payments/${paymentId}/process-borderpay`, {
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        });
        if (borderPayRes) {
          setQrisData({
            qrString: borderPayRes.qrString || null,
            qrImageUrl: borderPayRes.qrImageUrl || null,
            paymentUrl: borderPayRes.paymentUrl || null,
          });
          setIsQrisModalOpen(true);
          return;
        }
      }

      // Fallback Xendit
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const res = await api.post<any>('/payments/xendit/invoice', {
        orderId: order.id,
        redirectUrl,
      });
      if (res && res.invoiceUrl) {
        setQrisData({
          paymentUrl: res.invoiceUrl,
        });
        setIsQrisModalOpen(true);
      }
    } catch (err: any) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already processed') || msg.includes('sudah dibayar')) {
        fetchOrder(true);
      } else {
        alert(err.message || 'Gagal membuka pembayaran. Silakan coba lagi.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchOrder = async (isManual = false) => {
    if (!orderId) return;
    if (isManual) setRefreshing(true);
    try {
      // Auto-sync status with BorderPay and Xendit APIs (instant status update without waiting for webhook)
      await Promise.allSettled([
        api.get(`/payments/${orderId}/borderpay-sync`),
        api.get(`/payments/xendit/sync/${orderId}`),
      ]);
      const res = await api.get<Order>(`/orders/${orderId}`);
      if (res) {
        setOrder(res);
        saveCustomerOrder({
          orderId: res.id,
          orderNumber: res.orderNumber,
          tableToken: tableToken || (res.table as any)?.qrToken || '',
          tableNumber: res.table?.tableNumber,
          totalAmount: Number(res.totalAmount),
          status: res.status,
          itemCount: res.items?.reduce((s, i) => s + i.quantity, 0),
          firstItemName: res.items?.[0]?.productName,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat status pesanan');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto-poll status every 4 seconds
    const interval = setInterval(() => {
      fetchOrder();
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/25 animate-spin mb-3">
          <RotateCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-stone-800">Memuat Status Pesanan...</p>
        <p className="text-xs text-stone-500 mt-1">Menghubungkan ke sistem dapur & kasir</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full p-6 rounded-3xl border border-stone-200/80 shadow-xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-stone-900">Pesanan Tidak Ditemukan</h3>
          <p className="text-xs text-stone-500">{error || 'ID pesanan tidak valid atau sudah kadaluarsa.'}</p>
          {tableToken ? (
            <Link
              href={`/order/${tableToken}`}
              className="inline-block px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Kembali ke Menu Meja
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold transition"
            >
              Kembali ke Beranda
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Define steps
  const steps: { key: OrderStatus[]; label: string; icon: any; description: string }[] = [
    {
      key: ['PENDING_PAYMENT'],
      label: 'Menunggu Pembayaran',
      icon: Clock,
      description: 'Menunggu konfirmasi pembayaran kasir / online',
    },
    {
      key: ['PAID', 'CONFIRMED'],
      label: 'Pesanan Dikonfirmasi',
      icon: CheckCircle2,
      description: 'Pesanan sudah masuk dan diterima oleh kasir',
    },
    {
      key: ['PREPARING'],
      label: 'Sedang Diracik & Dimasak',
      icon: UtensilsCrossed,
      description: 'Barista & koki sedang menyiapkan hidangan Anda',
    },
    {
      key: ['READY', 'OUT_FOR_DELIVERY'],
      label: 'Siap & Menuju Meja Anda',
      icon: ConciergeBell,
      description: 'Pelayan sedang mengantarkan pesanan ke meja',
    },
    {
      key: ['DELIVERED', 'COMPLETED'],
      label: 'Pesanan Telah Tiba 🎉',
      icon: CheckCheck,
      description: 'Pesanan telah diantar. Selamat menikmati!',
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'CANCELLED' || status === 'PAYMENT_FAILED' || status === 'EXPIRED') return -1;
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].key.includes(status)) return i;
    }
    return 0;
  };

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = ['CANCELLED', 'PAYMENT_FAILED', 'EXPIRED'].includes(order.status);
  const company = (order as any)?.outlet?.company || (order as any)?.table?.outlet?.company;
  const tableNumber = order.table?.tableNumber || (typeof window !== 'undefined' ? localStorage.getItem('cafe_active_table_number') : null);

  const activePayment = order.payments?.[0];
  const effectiveMethod = (order as any).paymentMethod || activePayment?.method || 'XENDIT';
  const isCashOrder = effectiveMethod === 'CASH' || activePayment?.method === 'CASH';
  const isPaid = ['PAID', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status) || Number(order.paidAmount) > 0;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-800 font-sans antialiased selection:bg-amber-500 selection:text-white">
      <div className="max-w-md mx-auto min-h-screen bg-stone-50/90 border-x border-stone-200/50 shadow-2xl relative pb-36 select-none">
        {/* Top Ambient Pro Accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Top Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/70 sticky top-0 z-20 shadow-xs pt-safe transition-all">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {company?.logoUrl || company?.logo ? (
                <img
                  src={getImageUrl(company.logoUrl || company.logo)}
                  alt={company?.name || 'Logo Cafe'}
                  className="w-10 h-10 object-contain rounded-2xl bg-amber-50/80 p-1 border border-amber-200/80 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-amber-500/20">
                  <Coffee className="w-5 h-5 drop-shadow-xs" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-stone-900 leading-tight truncate">
                  {company?.name || 'Status Pesanan'}
                </div>
                <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1.5 mt-0.5">
                  <span>#{order.orderNumber}</span>
                  {tableNumber && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-amber-700">Meja {tableNumber}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsCallWaiterOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:text-amber-800 hover:bg-amber-50 border border-stone-200/80 transition active:scale-90 cursor-pointer shadow-2xs"
                title="Panggil Pelayan ke Meja"
              >
                <ConciergeBell className="w-4 h-4 text-amber-700" />
              </button>

              <button
                onClick={() => fetchOrder(true)}
                disabled={refreshing}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:text-amber-800 hover:bg-amber-50 border border-stone-200/80 transition active:scale-90 cursor-pointer shadow-2xs"
                title="Perbarui Status Real-Time"
              >
                <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 space-y-4">
        {/* Status Card Banner */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs text-center space-y-2 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="text-xs text-stone-400 uppercase font-bold tracking-wider flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{tableNumber ? `Meja ${tableNumber}` : 'Takeaway'} • {formatTime(order.createdAt)}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {isCancelled ? (
              <span className="text-red-600">Pesanan Dibatalkan</span>
            ) : currentStepIndex === steps.length - 1 ? (
              <span className="text-emerald-600">Pesanan Telah Tiba 🎉</span>
            ) : (
              steps[currentStepIndex]?.label || order.status
            )}
          </h2>

          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            {isCancelled
              ? 'Pesanan ini telah dibatalkan atau waktu pembayaran telah habis.'
              : steps[currentStepIndex]?.description}
          </p>

          <div className="pt-2 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
              <span>Total Tagihan:</span>
              <span>{formatRupiah(order.totalAmount)}</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRO CALLOUT: "APAKAH INGIN MEMESAN LAGI? (TANPA SCAN QR LAGI)"           */}
        {/* ========================================================================= */}
        {tableToken ? (
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/15 border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-3.5 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                <UtensilsCrossed className="w-5 h-5 drop-shadow-xs" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-amber-950 leading-tight">
                    Ada Menu yang Terlewat atau Mau Tambah?
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-200/80 text-amber-900 border border-amber-300/80 shrink-0">
                    Instan
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                  Tidak perlu scan QR meja lagi! Anda bisa langsung memesan makanan, cemilan, atau minuman tambahan untuk <strong>Meja {tableNumber}</strong>.
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            <Link
              href={`/order/${tableToken}`}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 transition transform active:scale-[0.99] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Pesan Tambahan untuk Meja {tableNumber}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Quick Category Shortcut Pills */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Cepat:</span>
              <Link
                href={`/order/${tableToken}`}
                className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-stone-800 font-bold border border-amber-200/80 shadow-2xs transition active:scale-95"
              >
                ☕ Tambah Minuman
              </Link>
              <Link
                href={`/order/${tableToken}`}
                className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-stone-800 font-bold border border-amber-200/80 shadow-2xs transition active:scale-95"
              >
                🍟 Tambah Camilan
              </Link>
              <button
                type="button"
                onClick={() => setIsCallWaiterOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold border border-amber-300 shadow-2xs transition active:scale-95 cursor-pointer ml-auto flex items-center gap-1"
              >
                <ConciergeBell className="w-3.5 h-3.5 text-amber-700" />
                <span>Panggil Pelayan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ingin pesan menu tambahan? Silakan pindai kembali QR code di meja Anda.</span>
            </div>
          </div>
        )}

        {/* Online Payment Instruction Banner */}
        {order.status === 'PENDING_PAYMENT' && !isCashOrder && (
            <div className="bg-white p-5 rounded-3xl border border-amber-300 shadow-sm space-y-4 text-center animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>QRIS / Pembayaran Otomatis</span>
                </span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full animate-pulse">
                  Menunggu Pembayaran
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-stone-500">Total yang harus dibayar:</div>
                <div className="text-2xl font-black text-amber-800">
                  {formatRupiah(order.totalAmount)}
                </div>
              </div>

              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                Selesaikan pembayaran menggunakan <strong>QRIS (Semua Bank & E-Wallet)</strong>, GoPay, ShopeePay, OVO, DANA, atau <strong>Virtual Account</strong>.
              </p>

              <div className="pt-1 space-y-2">
                <button
                  onClick={handlePayOnline}
                  disabled={paymentLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-600/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      <span>Membuka Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Bayar Sekarang (QRIS / Online)</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => fetchOrder(true)}
                  disabled={refreshing}
                  className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-amber-700 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Mengecek Pembayaran...' : 'Sudah Bayar? Cek Status Sekarang'}</span>
                </button>
              </div>

              <div className="pt-1 text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
                <RotateCw className="w-3 h-3 animate-spin text-amber-600" />
                <span>Sistem otomatis memverifikasi pembayaran Anda secara instan.</span>
              </div>
            </div>
          )}

        {/* Cash Payment Instruction Banner */}
        {order.status === 'PENDING_PAYMENT' && isCashOrder && (
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-3 text-center animate-in fade-in duration-200">
            <div className="flex items-center justify-center space-x-2 text-stone-800 font-bold text-sm">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Pembayaran Tunai di Kasir</span>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl space-y-1 border border-stone-200/60">
              <div className="text-xs text-stone-500">Nomor Pesanan Anda:</div>
              <div className="text-lg font-black text-stone-900 font-mono">
                #{order.orderNumber}
              </div>
              <div className="text-xs text-stone-600 pt-1">
                Total Tagihan: <strong>{formatRupiah(order.totalAmount)}</strong>
              </div>
            </div>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Silakan menuju meja kasir dan sebutkan nomor pesanan untuk melakukan pembayaran tunai.
            </p>
          </div>
        )}

        {/* Paid / Confirmed Success Banner */}
        {isPaid && !isCancelled && (
          <div className="bg-white p-5 rounded-3xl border border-emerald-300/80 shadow-sm space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-stone-900 leading-tight">Status Pembayaran</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Telah Diverifikasi</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>LUNAS</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="text-[10px] text-stone-500 font-medium">Metode Pembayaran</div>
                <div className="font-extrabold text-stone-800 mt-1">
                  {isCashOrder ? '💵 Tunai di Kasir' : '⚡ QRIS / Pembayaran Otomatis'}
                </div>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="text-[10px] text-emerald-800 font-medium">Total Dibayar</div>
                <div className="font-extrabold text-emerald-700 mt-1 text-sm">
                  {formatRupiah(Number(order.paidAmount) > 0 ? order.paidAmount : order.totalAmount)}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 text-center pt-0.5">
              Pesanan Anda telah lunas dan sedang diproses sesuai urutan pesanan.
            </p>
          </div>
        )}

        {/* Progress Timeline */}
        {!isCancelled && (
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Langkah Proses Pesanan
              </h3>
              <span className="text-[10px] text-stone-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Update
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {steps.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.label} className="relative flex items-start space-x-3">
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                          : isCurrent
                          ? 'bg-amber-600 text-white ring-4 ring-amber-100 animate-pulse'
                          : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>

                    <div className="flex-1">
                      <div
                        className={`text-xs font-bold ${
                          isPassed || isCurrent ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-[11px] text-stone-500">{step.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items Summary Card */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-stone-400" />
              <span>Rincian Item ({order.items.length})</span>
            </h3>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              Meja {tableNumber}
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-start text-xs">
                <div>
                  <span className="font-bold text-stone-900">
                    {item.quantity}x {item.productName}
                  </span>
                  {item.variantName && (
                    <span className="text-stone-500 ml-1">({item.variantName})</span>
                  )}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {item.modifiers.map((m) => m.modifierOptionName).join(', ')}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[11px] text-amber-700 italic mt-0.5">
                      &quot;{item.notes}&quot;
                    </div>
                  )}
                </div>
                <span className="font-bold text-stone-900">
                  {formatRupiah(item.totalPrice ?? item.subtotal ?? (Number(item.unitPrice) * item.quantity))}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            {Number(order.taxAmount) > 0 && (
              <div className="flex justify-between">
                <span>Pajak Resto</span>
                <span>{formatRupiah(order.taxAmount)}</span>
              </div>
            )}
            {Number(order.serviceChargeAmount) > 0 && (
              <div className="flex justify-between">
                <span>Service Charge</span>
                <span>{formatRupiah(order.serviceChargeAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-stone-900 pt-2 border-t border-stone-100">
              <span>Total Tagihan</span>
              <span className="text-amber-800 text-base">{formatRupiah(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* PERSISTENT FLOATING BOTTOM ACTION: "PESAN LAGI UNTUK MEJA INI"           */}
      {/* ========================================================================= */}
      {tableToken && (
        <div className="fixed bottom-4 inset-x-0 z-30 max-w-lg mx-auto px-4 animate-in slide-in-from-bottom-3 duration-200">
          <Link
            href={`/order/${tableToken}`}
            className="p-3.5 bg-stone-950/95 backdrop-blur-xl text-white rounded-3xl shadow-2xl border border-stone-800 flex items-center justify-between hover:bg-stone-900 transition transform hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-md shadow-amber-500/25 shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white leading-tight">
                  Mau Pesan Menu Tambahan?
                </div>
                <div className="text-[11px] text-amber-400 mt-0.5">
                  Langsung ke Meja {tableNumber} (Tanpa Scan QR)
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-3.5 py-2 rounded-2xl shadow-md transition shrink-0">
              <span>Pesan Lagi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      )}

      {/* Modal Panggil Pelayan */}
      <CallWaiterModal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        tableToken={tableToken || undefined}
        tableId={order.table?.id}
        tableNumber={tableNumber || undefined}
      />

      {/* Modal QRIS Pembayaran In-App (Tanpa Berpindah Halaman) */}
      <QrisPaymentModal
        isOpen={isQrisModalOpen}
        onClose={() => setIsQrisModalOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        amount={Number(order.totalAmount)}
        qrString={qrisData.qrString}
        qrImageUrl={qrisData.qrImageUrl}
        paymentUrl={qrisData.paymentUrl}
        onPaymentSuccess={() => {
          setIsQrisModalOpen(false);
          fetchOrder(true);
        }}
      />
      </div>
    </div>
  );
}
