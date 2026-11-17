/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { getSavedCustomerOrders, updateSavedOrderStatus, SavedCustomerOrder } from '@/lib/customerOrders';
import {
  X,
  Receipt,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  ConciergeBell,
  CheckCheck,
  XCircle,
  ChevronRight,
  RotateCw,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface MyOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTableToken?: string;
}

export default function MyOrdersDrawer({ isOpen, onClose, currentTableToken }: MyOrdersDrawerProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<SavedCustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveOrdersMap, setLiveOrdersMap] = useState<Record<string, any>>({});

  const loadAndSyncOrders = async () => {
    const saved = getSavedCustomerOrders();
    setOrders(saved);

    if (saved.length === 0) return;

    setLoading(true);
    try {
      const results = await Promise.allSettled(
        saved.map((o) => api.get<any>(`/orders/${o.orderId}`))
      );

      const map: Record<string, any> = {};
      results.forEach((res) => {
        if (res.status === 'fulfilled' && res.value && res.value.id) {
          map[res.value.id] = res.value;
          if (res.value.status) {
            updateSavedOrderStatus(res.value.id, res.value.status);
          }
        }
      });
      setLiveOrdersMap(map);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAndSyncOrders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return {
          label: 'Menunggu Bayar',
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          icon: Clock,
        };
      case 'PAID':
      case 'CONFIRMED':
        return {
          label: 'Dikonfirmasi',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: CheckCircle2,
        };
      case 'PREPARING':
        return {
          label: 'Sedang Diracik',
          bg: 'bg-orange-50 text-orange-800 border-orange-200 animate-pulse',
          icon: UtensilsCrossed,
        };
      case 'READY':
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Siap Diantar',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold',
          icon: ConciergeBell,
        };
      case 'DELIVERED':
      case 'COMPLETED':
        return {
          label: 'Selesai',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: CheckCheck,
        };
      case 'CANCELLED':
        return {
          label: 'Dibatalkan',
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
        };
      default:
        return {
          label: 'Memproses',
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
          icon: Clock,
        };
    }
  };

  const handleNavigateToStatus = (order: SavedCustomerOrder) => {
    onClose();
    const token = order.tableToken || currentTableToken;
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    router.push(`/order/status/${order.orderId}${tokenQuery}`);
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

        {/* Sheet Header */}
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-sm leading-tight">
                Pesanan Saya
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Riwayat & status pesanan meja Anda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadAndSyncOrders}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200/80 transition active:scale-90 cursor-pointer"
              title="Perbarui Status"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-700' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200/80 transition active:scale-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sheet Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-stone-50/60 no-scrollbar">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-stone-400 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-2xs">
              <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-7 h-7 stroke-1" />
              </div>
              <p className="text-sm font-bold text-stone-800">Belum Ada Pesanan</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                Pesanan yang Anda buat di kafe ini akan otomatis tersimpan dan dapat dilacak statusnya di sini.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs rounded-2xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                Pilih Menu Favorit
              </button>
            </div>
          ) : (
            orders.map((savedOrder) => {
              const live = liveOrdersMap[savedOrder.orderId];
              const effectiveStatus = live?.status || savedOrder.status;
              const badge = getStatusBadge(effectiveStatus);
              const BadgeIcon = badge.icon;
              const total = live?.totalAmount || savedOrder.totalAmount;
              const itemCount = live?.items?.reduce((s: number, i: any) => s + i.quantity, 0) || savedOrder.itemCount;
              const previewItem = live?.items?.[0]?.productName || savedOrder.firstItemName;

              const isOngoing = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(effectiveStatus);

              return (
                <div
                  key={savedOrder.orderId}
                  onClick={() => handleNavigateToStatus(savedOrder)}
                  className={`p-4 bg-white rounded-2xl border transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-2xs hover:shadow-md ${
                    isOngoing ? 'border-amber-400/80 ring-2 ring-amber-400/20' : 'border-stone-200/80 hover:border-amber-200'
                  }`}
                >
                  {/* Top Bar: Order Number & Status Badge */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-black text-xs text-stone-900 font-mono">
                        #{live?.orderNumber || savedOrder.orderNumber}
                      </span>
                      {savedOrder.tableNumber && (
                        <span className="text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full font-bold">
                          Meja {savedOrder.tableNumber}
                        </span>
                      )}
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badge.bg}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Middle Details */}
                  <div className="py-2.5">
                    {previewItem && (
                      <p className="text-xs font-bold text-stone-800 truncate">
                        {previewItem}
                        {itemCount && itemCount > 1 ? ` (+${itemCount - 1} item lainnya)` : ''}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
                      <span>{formatDateTime(savedOrder.createdAt)}</span>
                      {total && (
                        <span className="font-black text-amber-800 text-xs">
                          {formatRupiah(total)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Hint */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-amber-800 font-black">
                    <span className="text-[11px]">
                      {effectiveStatus === 'PENDING_PAYMENT' ? '⚠️ Selesaikan Pembayaran' : 'Lihat Status & Rincian'}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sheet Footer */}
        <div className="p-4 border-t border-stone-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs transition active:scale-[0.98] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
