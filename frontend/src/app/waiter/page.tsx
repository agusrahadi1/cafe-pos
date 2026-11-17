/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useRef } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import { Order, Table } from '@/types';
import { formatTime, formatRupiah } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ConciergeBell,
  CheckCheck,
  RotateCw,
  Clock,
  Check,
  Send,
  Loader2,
  Volume2,
  VolumeX,
  Bell,
  Utensils,
  Receipt,
  MessageSquare,
  Sparkles,
  LayoutGrid,
  Users,
  ChevronRight,
  ArrowRight,
  X,
  Coffee,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { playNotificationSound, isAudioMuted, setAudioMuted, testAudioNotification } from '@/lib/audio';

interface WaiterCall {
  id: string;
  tableId: string;
  tableNumber: string;
  tableName?: string;
  type: string;
  notes?: string;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED';
}

type WaiterTab = 'CALLS' | 'READY' | 'TABLES';

export default function WaiterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<WaiterTab>('CALLS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [audioMuted, setAudioMutedState] = useState(false);

  const prevReadyOrderIdsRef = useRef<Set<string>>(new Set());
  const prevWaiterCallIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    setAudioMutedState(isAudioMuted());
  }, []);

  const toggleMute = () => {
    const next = !audioMuted;
    setAudioMutedState(next);
    setAudioMuted(next);
    if (!next) {
      testAudioNotification('bell');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchWaiterData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [ordersRes, callsRes, tablesRes] = await Promise.all([
        api.get<Order[]>('/orders').catch(() => []),
        api.get<WaiterCall[]>('/tables/waiter-calls').catch(() => []),
        api.get<Table[]>('/tables').catch(() => []),
      ]);

      if (Array.isArray(ordersRes)) {
        const waiterQueue = ordersRes.filter((o) => ['READY', 'OUT_FOR_DELIVERY'].includes(o.status));

        if (!isInitialLoadRef.current) {
          const newReady = waiterQueue.filter(
            (o) => o.status === 'READY' && !prevReadyOrderIdsRef.current.has(o.id)
          );
          if (newReady.length > 0) {
            playNotificationSound('ready');
          }
        }

        prevReadyOrderIdsRef.current = new Set(waiterQueue.map((o) => o.id));
        setOrders(waiterQueue);
      }

      if (Array.isArray(callsRes)) {
        if (!isInitialLoadRef.current) {
          const newCalls = callsRes.filter((c) => !prevWaiterCallIdsRef.current.has(c.id));
          if (newCalls.length > 0) {
            playNotificationSound('bell');
          }
        }

        prevWaiterCallIdsRef.current = new Set(callsRes.map((c) => c.id));
        setWaiterCalls(callsRes);

        // Auto switch to CALLS tab if new calls arrived and user was on default
        if (callsRes.length > 0 && activeTab === 'TABLES') {
          // keep as is, do not force
        }
      }

      if (Array.isArray(tablesRes)) {
        // Sort tables naturally by tableNumber
        const sorted = [...tablesRes].sort((a, b) => {
          const numA = parseInt(a.tableNumber, 10);
          const numB = parseInt(b.tableNumber, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.tableNumber.localeCompare(b.tableNumber);
        });
        setTables(sorted);
      }

      isInitialLoadRef.current = false;
    } catch (e) {
      console.error('Error fetching waiter data:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWaiterData();
    const interval = setInterval(() => {
      fetchWaiterData();
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePickUp = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'OUT_FOR_DELIVERY' });
      fetchWaiterData();
    } catch (e: any) {
      alert(e.message || 'Gagal mengubah status');
    }
  };

  const handleDelivered = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'DELIVERED' });
      fetchWaiterData();
    } catch (e: any) {
      alert(e.message || 'Gagal mengubah status');
    }
  };

  const handleResolveWaiterCall = async (callId: string) => {
    try {
      await api.put(`/tables/waiter-calls/${callId}/resolve`);
      setWaiterCalls((prev) => prev.filter((c) => c.id !== callId));
    } catch (e: any) {
      alert(e.message || 'Gagal menyelesaikan panggilan meja');
    }
  };

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case 'REQUEST_BILL':
        return { label: 'Minta Tagihan / Bill', icon: Receipt, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'NEED_UTENSILS':
        return { label: 'Alat Makan & Tisu', icon: Utensils, color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'CUSTOM':
        return { label: 'Pesan Khusus', icon: MessageSquare, color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'Panggil Pelayan', icon: ConciergeBell, color: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;

  return (
    <ModernStaffLayout>
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-stone-100/60 select-none pb-20 md:pb-0">
        
        {/* Flutter Native App Bar for Waiter Screen */}
        <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 flex items-center justify-between gap-3 shrink-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
              <ConciergeBell className="w-5 h-5 drop-shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-stone-900 leading-tight truncate">
                  Layar Pelayan (Waiter)
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                {user?.outlet?.name || 'Monitoring Meja & Antaran'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Audio Mute/Unmute */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-9 h-9 flex items-center justify-center rounded-full border transition active:scale-90 cursor-pointer ${
                audioMuted
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
              title={audioMuted ? 'Suara Bel Mati (Klik untuk Nyalakan)' : 'Suara Bel Aktif'}
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Test Bell */}
            <button
              type="button"
              onClick={() => testAudioNotification('bell')}
              className="w-9 h-9 hidden sm:flex items-center justify-center rounded-full bg-stone-100 hover:bg-purple-50 text-stone-700 hover:text-purple-700 border border-stone-200 transition active:scale-90 cursor-pointer"
              title="Tes Suara Bel"
            >
              <Bell className="w-4 h-4 text-purple-600" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchWaiterData(true)}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-700 border border-stone-200 transition active:scale-90 cursor-pointer"
              title="Segarkan Data"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
            </button>
          </div>
        </header>

        {/* Top Segmented Tab Control (Flutter TabBar Style) */}
        <div className="px-4 py-2.5 bg-white/70 border-b border-stone-200/60 shrink-0">
          <div className="max-w-md mx-auto flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-2xl">
            {/* Tab 1: Panggilan Meja */}
            <button
              type="button"
              onClick={() => setActiveTab('CALLS')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer relative ${
                activeTab === 'CALLS'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Panggilan</span>
              {waiterCalls.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                  {waiterCalls.length}
                </span>
              )}
            </button>

            {/* Tab 2: Siap Antar */}
            <button
              type="button"
              onClick={() => setActiveTab('READY')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer relative ${
                activeTab === 'READY'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ConciergeBell className="w-3.5 h-3.5" />
              <span>Siap Antar</span>
              {orders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-black text-[9px] flex items-center justify-center">
                  {orders.length}
                </span>
              )}
            </button>

            {/* Tab 3: Denah Meja */}
            <button
              type="button"
              onClick={() => setActiveTab('TABLES')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer relative ${
                activeTab === 'TABLES'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Meja</span>
              <span className="text-[10px] text-stone-400 font-bold">
                ({occupiedCount}/{tables.length})
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4">

            {/* ================================================================= */}
            {/* TAB 1: PANGGILAN MEJA (WAITER CALL QUEUE)                         */}
            {/* ================================================================= */}
            {activeTab === 'CALLS' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold text-stone-800">
                      Panggilan Menunggu ({waiterCalls.length})
                    </span>
                  </div>
                  <span>Ketuk &ldquo;Selesai&rdquo; jika sudah dilayani</span>
                </div>

                {waiterCalls.length === 0 ? (
                  <div className="py-20 text-center text-stone-400 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <Bell className="w-8 h-8 stroke-1" />
                    </div>
                    <p className="text-base font-black text-stone-800">Tidak Ada Panggilan Meja</p>
                    <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                      Saat pelanggan menekan tombol panggil pelayan di meja, notifikasi akan langsung berdering di sini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {waiterCalls.map((call) => {
                      const callConfig = getCallTypeLabel(call.type);
                      const Icon = callConfig.icon;

                      return (
                        <div
                          key={call.id}
                          className="p-4 bg-white rounded-3xl border-2 border-purple-400 shadow-md flex flex-col justify-between space-y-3 relative overflow-hidden transition-all duration-150 active:scale-[0.99]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                                {call.tableNumber}
                              </div>
                              <div>
                                <div className="text-sm font-black text-stone-900">
                                  MEJA {call.tableNumber}
                                </div>
                                {call.tableName && (
                                  <div className="text-xs text-stone-400 font-medium">({call.tableName})</div>
                                )}
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${callConfig.color}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{callConfig.label}</span>
                            </span>
                          </div>

                          {call.notes && (
                            <p className="text-xs text-stone-800 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/70 font-medium italic">
                              &ldquo;{call.notes}&rdquo;
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                            <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTime(call.createdAt)}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleResolveWaiterCall(call.id)}
                              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition active:scale-90 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Selesai Dilayani</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: SIAP ANTAR (READY / OUT_FOR_DELIVERY QUEUE)                */}
            {/* ================================================================= */}
            {activeTab === 'READY' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="font-bold text-stone-800">
                      Antrean Siap Antar ({orders.length})
                    </span>
                  </div>
                  <span>Pesanan siap disajikan ke meja pelanggan</span>
                </div>

                {orders.length === 0 ? (
                  <div className="py-20 text-center text-stone-400 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <ConciergeBell className="w-8 h-8 stroke-1" />
                    </div>
                    <p className="text-base font-black text-stone-800">Tidak Ada Makanan Siap Antar</p>
                    <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                      Semua hidangan sedang diracik oleh dapur atau sudah berhasil disajikan ke meja.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {orders.map((order) => {
                      const isOut = order.status === 'OUT_FOR_DELIVERY';

                      return (
                        <div
                          key={order.id}
                          className={`bg-white rounded-3xl border p-4.5 shadow-xs flex flex-col justify-between space-y-3.5 transition-all duration-200 ${
                            isOut
                              ? 'border-amber-400 ring-2 ring-amber-400/20'
                              : 'border-purple-300 ring-1 ring-purple-200/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-stone-900 text-white font-black text-xs rounded-xl shadow-xs">
                                  {order.table?.tableNumber ? `Meja ${order.table.tableNumber}` : 'Takeaway'}
                                </span>
                                <span className="text-xs font-mono font-bold text-stone-500">
                                  #{order.orderNumber}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatTime(order.createdAt)}</span>
                                {order.customerName && (
                                  <>
                                    <span>•</span>
                                    <span className="font-bold text-stone-700">{order.customerName}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                isOut
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-purple-100 text-purple-900 border border-purple-300'
                              }`}
                            >
                              {isOut ? '🚀 Sedang Diantar' : '🔔 Siap Antar'}
                            </span>
                          </div>

                          {/* Items Checklist Box */}
                          <div className="bg-stone-50/90 p-3 rounded-2xl space-y-1.5 border border-stone-200/60">
                            <div className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                              Daftar Hidangan:
                            </div>
                            <div className="divide-y divide-stone-200/60 text-xs">
                              {order.items.map((item) => (
                                <div key={item.id} className="py-1.5 flex justify-between items-start">
                                  <div>
                                    <span className="font-extrabold text-stone-900">
                                      {item.quantity}x {item.productName}
                                    </span>
                                    {item.variantName && (
                                      <span className="text-amber-800 font-bold ml-1">
                                        ({item.variantName})
                                      </span>
                                    )}
                                    {item.modifiers && item.modifiers.length > 0 && (
                                      <div className="text-[10px] text-stone-500 mt-0.5">
                                        + {item.modifiers.map((m) => m.modifierOptionName).join(', ')}
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="text-[10px] text-amber-700 italic mt-0.5">
                                        &ldquo;{item.notes}&rdquo;
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-1">
                            {!isOut ? (
                              <button
                                onClick={() => handlePickUp(order.id)}
                                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                              >
                                <Send className="w-4 h-4" />
                                <span>Ambil & Antar ke Meja</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelivered(order.id)}
                                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                              >
                                <CheckCheck className="w-4 h-4" />
                                <span>Tandai Sudah Sampai Meja</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 3: DENAH MEJA (LIVE TABLE STATUS GRID)                        */}
            {/* ================================================================= */}
            {activeTab === 'TABLES' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>{availableCount} Kosong</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-amber-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>{occupiedCount} Terisi</span>
                    </span>
                  </div>
                  <span>Ketuk meja untuk rincian</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {tables.map((table) => {
                    const isOccupied = table.status === 'OCCUPIED';
                    const hasCall = waiterCalls.some((c) => c.tableId === table.id || c.tableNumber === table.tableNumber);

                    return (
                      <div
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={`p-3.5 rounded-3xl border transition-all duration-200 cursor-pointer active:scale-95 flex flex-col justify-between shadow-2xs relative ${
                          hasCall
                            ? 'bg-red-50 border-red-400 ring-2 ring-red-400/30'
                            : isOccupied
                            ? 'bg-amber-50/80 border-amber-300 hover:shadow-md'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {/* Status Icon Indicator */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{table.capacity} Org</span>
                          </span>

                          {hasCall ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                          ) : (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                              }`}
                            />
                          )}
                        </div>

                        {/* Table Number */}
                        <div className="py-2.5 text-center">
                          <div className="text-xl font-black text-stone-900 tracking-tight">
                            MEJA {table.tableNumber}
                          </div>
                          {table.name && (
                            <div className="text-[11px] text-stone-500 font-semibold truncate mt-0.5">
                              {table.name}
                            </div>
                          )}
                        </div>

                        {/* Table Status Badge */}
                        <div className="pt-1 border-t border-stone-200/50 flex items-center justify-between text-[10px]">
                          <span
                            className={`font-black uppercase px-2 py-0.5 rounded-full ${
                              hasCall
                                ? 'bg-red-200 text-red-900'
                                : isOccupied
                                ? 'bg-amber-200/80 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {hasCall ? 'Panggil' : isOccupied ? 'Terisi' : 'Kosong'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MOBILE FLOATING BOTTOM NAVIGATION BAR (FLUTTER/CUPERTINO STYLE)        */}
        {/* ===================================================================== */}
        <div className="block md:hidden fixed bottom-3 inset-x-4 max-w-sm mx-auto z-40">
          <div className="p-1.5 bg-stone-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-stone-800 flex items-center justify-around">
            {/* Button Calls */}
            <button
              onClick={() => setActiveTab('CALLS')}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-90 relative ${
                activeTab === 'CALLS' ? 'text-amber-400 font-black' : 'text-stone-400 font-medium'
              }`}
            >
              <div className="relative">
                <Bell className="w-4 h-4" />
                {waiterCalls.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-red-600 text-white font-black text-[8px] flex items-center justify-center animate-pulse">
                    {waiterCalls.length}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Panggilan</span>
            </button>

            {/* Button Ready */}
            <button
              onClick={() => setActiveTab('READY')}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-90 relative ${
                activeTab === 'READY' ? 'text-amber-400 font-black' : 'text-stone-400 font-medium'
              }`}
            >
              <div className="relative">
                <ConciergeBell className="w-4 h-4" />
                {orders.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-purple-500 text-white font-black text-[8px] flex items-center justify-center">
                    {orders.length}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Siap Antar</span>
            </button>

            {/* Button Tables */}
            <button
              onClick={() => setActiveTab('TABLES')}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-90 relative ${
                activeTab === 'TABLES' ? 'text-amber-400 font-black' : 'text-stone-400 font-medium'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[10px]">Meja ({occupiedCount})</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MODAL BOTTOM SHEET: TABLE DETAIL (NATIVE MOBILE SHEET)                */}
        {/* ===================================================================== */}
        {selectedTable && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedTable(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-200 pb-safe"
            >
              {/* Flutter Drag Handle */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-black text-base shadow-xs">
                    {selectedTable.tableNumber}
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900 text-base leading-tight">
                      MEJA {selectedTable.tableNumber}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Kapasitas {selectedTable.capacity} Orang • {selectedTable.name || 'Meja Kafe'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 transition active:scale-90 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sheet Body */}
              <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
                {/* Status Card */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Status Saat Ini
                    </div>
                    <div className="font-black text-sm text-stone-900 mt-0.5">
                      {selectedTable.status === 'OCCUPIED' ? 'Sedang Digunakan (Terisi)' : 'Meja Kosong (Tersedia)'}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      selectedTable.status === 'OCCUPIED'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {selectedTable.status}
                  </span>
                </div>

                {/* QR Code Action Shortcut */}
                {selectedTable.qrToken && (
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-amber-700" />
                        <span>Bantu Input Pesanan Meja</span>
                      </span>
                      <span className="text-[9px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                        QR Aktif
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Jika pelanggan kesulitan menggunakan HP mereka, Anda dapat membuka menu pemesanan meja ini secara langsung.
                    </p>
                    <a
                      href={`/order/${selectedTable.qrToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <span>Buka Menu Meja Ini</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Sheet Footer */}
              <div className="p-4 border-t border-stone-100 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs transition active:scale-95 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ModernStaffLayout>
  );
}
