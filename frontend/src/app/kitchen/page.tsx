'use client';

import React, { useEffect, useState, useRef } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { formatTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  ConciergeBell,
  Clock,
  RotateCw,
  Check,
  Play,
  Loader2,
  Volume2,
  VolumeX,
  Bell,
  Flame,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { playNotificationSound, isAudioMuted, setAudioMuted, testAudioNotification } from '@/lib/audio';

export default function KitchenPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [audioMuted, setAudioMutedState] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    setAudioMutedState(isAudioMuted());
  }, []);

  const toggleMute = () => {
    const next = !audioMuted;
    setAudioMutedState(next);
    setAudioMuted(next);
    if (!next) {
      testAudioNotification('order');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchKitchenOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // Fetch orders for kitchen: PAID, CONFIRMED and PREPARING
      const res = await api.get<Order[]>('/orders');
      if (res && Array.isArray(res)) {
        const kitchenQueue = res.filter((o) => ['PAID', 'CONFIRMED', 'PREPARING'].includes(o.status));

        if (!isInitialLoadRef.current) {
          const newOrders = kitchenQueue.filter((o) => !prevOrderIdsRef.current.has(o.id));
          if (newOrders.length > 0) {
            playNotificationSound('order');
            const latest = newOrders[0];
            const tableName = latest.table?.tableNumber ? `Meja ${latest.table.tableNumber}` : `#${latest.orderNumber}`;
            setNewOrderAlert(`🔔 Ada ${newOrders.length} pesanan baru masuk! (${tableName})`);
            setTimeout(() => setNewOrderAlert(null), 5000);
          }
        } else {
          isInitialLoadRef.current = false;
        }

        prevOrderIdsRef.current = new Set(kitchenQueue.map((o) => o.id));
        setOrders(kitchenQueue);
      }
    } catch (e) {
      console.error('Error fetching kitchen orders:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(() => {
      fetchKitchenOrders();
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartPreparing = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'PREPARING' });
      fetchKitchenOrders();
    } catch (e: any) {
      alert(e.message || 'Gagal mengubah status');
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'READY' });
      fetchKitchenOrders();
    } catch (e: any) {
      alert(e.message || 'Gagal mengubah status');
    }
  };

  // Helper for KDS elapsed minutes & priority color
  const getElapsedInfo = (createdAt: string) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (elapsedMinutes >= 15) {
      return {
        text: `${elapsedMinutes}m lalu (Prioritas!)`,
        badgeClass: 'bg-red-500/30 text-red-300 border-red-500/50 animate-pulse',
        isUrgent: true,
      };
    }
    if (elapsedMinutes >= 10) {
      return {
        text: `${elapsedMinutes}m lalu`,
        badgeClass: 'bg-amber-500/30 text-amber-300 border-amber-500/40',
        isUrgent: false,
      };
    }
    return {
      text: `${Math.max(1, elapsedMinutes)}m lalu`,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      isUrgent: false,
    };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <ModernStaffLayout>
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-stone-950 text-stone-100 select-none pb-safe">
        
        {/* KDS Header Toolbar */}
        <header className="bg-stone-900 border-b border-stone-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 z-20 shadow-md">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner shrink-0">
              <UtensilsCrossed className="w-5 h-5 drop-shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  Kitchen / Bar Display (KDS)
                </h1>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-stone-400 truncate">
                Antrean pembuatan makanan dan minuman kafe
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Audio Controls */}
            <button
              type="button"
              onClick={toggleMute}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition active:scale-90 cursor-pointer ${
                audioMuted
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
              title={audioMuted ? 'Suara Dinonaktifkan (Klik untuk aktifkan)' : 'Suara Aktif'}
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{audioMuted ? 'Muted' : 'Sound On'}</span>
            </button>

            {/* Test Sound */}
            <button
              type="button"
              onClick={() => testAudioNotification('order')}
              className="w-9 h-9 hidden sm:flex items-center justify-center rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition active:scale-90 cursor-pointer"
              title="Tes Suara Dapur"
            >
              <Bell className="w-4 h-4 text-amber-400" />
            </button>

            {/* Ticket Counter Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{orders.length} Tiket</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchKitchenOrders(true)}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center bg-stone-800 hover:bg-stone-700 rounded-xl transition text-stone-300 border border-stone-700 active:scale-90 cursor-pointer"
              title="Segarkan Antrean"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Floating Real-time Order Arrival Banner */}
        {newOrderAlert && (
          <div className="bg-amber-500 text-stone-950 px-6 py-2.5 font-black text-xs sm:text-sm flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-950 animate-ping" />
              <span>{newOrderAlert}</span>
            </div>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="text-xs font-black px-2.5 py-1 bg-stone-950/20 hover:bg-stone-950/30 rounded-lg transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Order Tickets Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto no-scrollbar">
          {orders.length === 0 ? (
            <div className="py-24 text-center text-stone-500">
              <div className="w-20 h-20 rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto mb-4 text-stone-600 shadow-inner">
                <UtensilsCrossed className="w-10 h-10 stroke-1" />
              </div>
              <h3 className="text-lg font-black text-stone-300">Semua Masakan Selesai!</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Tidak ada tiket antrean yang perlu dimasak saat ini. Tiket baru dari kasir atau QR meja akan muncul otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {orders.map((order) => {
                const isPreparing = order.status === 'PREPARING';
                const elapsed = getElapsedInfo(order.createdAt);

                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-200 active:scale-[0.99] ${
                      isPreparing
                        ? 'bg-stone-900 border-amber-500/70 ring-2 ring-amber-500/25'
                        : 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {/* Ticket Header */}
                    <div
                      className={`px-4 py-3 border-b flex items-center justify-between ${
                        isPreparing
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-stone-800/80 border-stone-800 text-stone-300'
                      }`}
                    >
                      <div>
                        <div className="text-base font-black font-mono tracking-tight text-white">
                          #{order.orderNumber}
                        </div>
                        <div className="text-xs font-black text-amber-400 mt-0.5">
                          {order.table?.tableNumber ? `MEJA ${order.table.tableNumber}` : 'TAKEAWAY'}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="text-[11px] font-bold text-stone-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-stone-500" />
                          <span>{formatTime(order.createdAt)}</span>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${elapsed.badgeClass}`}
                        >
                          {elapsed.text}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto no-scrollbar">
                      {order.customerNotes && (
                        <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-300 font-bold flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                          <span>Catatan: &ldquo;{order.customerNotes}&rdquo;</span>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="border-b border-stone-800 pb-2.5 last:border-0 last:pb-0">
                            <div className="flex items-start gap-2.5">
                              <span className="w-7 h-7 rounded-xl bg-stone-800 border border-stone-700 font-black text-xs flex items-center justify-center shrink-0 text-amber-400">
                                {item.quantity}x
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="font-extrabold text-sm text-stone-100 block leading-snug">
                                  {item.productName}
                                </span>
                                {item.variantName && (
                                  <span className="text-xs text-stone-400 block font-medium mt-0.5">
                                    Varian: {item.variantName}
                                  </span>
                                )}
                                {item.modifiers && item.modifiers.length > 0 && (
                                  <div className="text-[11px] text-amber-300/90 font-semibold mt-0.5">
                                    + {item.modifiers.map((m) => m.modifierOptionName).join(', ')}
                                  </div>
                                )}
                                {item.notes && (
                                  <div className="text-[11px] text-yellow-300 italic mt-0.5">
                                    &ldquo;{item.notes}&rdquo;
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions Footer (Fat-finger friendly button) */}
                    <div className="p-3 border-t border-stone-800 bg-stone-950/70">
                      {!isPreparing ? (
                        <button
                          type="button"
                          onClick={() => handleStartPreparing(order.id)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Mulai Memasak</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkReady(order.id)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Selesai / Panggil Pelayan</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ModernStaffLayout>
  );
}
