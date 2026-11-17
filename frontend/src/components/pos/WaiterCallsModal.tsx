/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { formatTime } from '@/lib/utils';
import {
  X,
  ConciergeBell,
  Utensils,
  Receipt,
  MessageSquare,
  CheckCircle2,
  Clock,
  Check,
  Search,
  Sparkles,
  MapPin,
  Volume2,
} from 'lucide-react';

export interface WaiterCallItem {
  id: string;
  tableId: string;
  table?: {
    id: string;
    tableNumber: string | number;
    name?: string;
  };
  type: 'CALL_WAITER' | 'NEED_UTENSILS' | 'REQUEST_BILL' | 'CUSTOM' | string;
  notes?: string;
  createdAt: string | Date;
  status: 'PENDING' | 'RESOLVED';
}

interface WaiterCallsModalProps {
  isOpen: boolean;
  onClose: () => void;
  calls: WaiterCallItem[];
  onResolve: (callId: string) => Promise<void> | void;
  onFilterTableOrders?: (tableNumber: string | number) => void;
}

export default function WaiterCallsModal({
  isOpen,
  onClose,
  calls,
  onResolve,
  onFilterTableOrders,
}: WaiterCallsModalProps) {
  if (!isOpen) return null;

  const getCallTypeInfo = (type: string) => {
    switch (type) {
      case 'REQUEST_BILL':
        return {
          title: 'Minta Tagihan / Bill',
          description: 'Pelanggan ingin membayar di meja atau meminta cetak struk tagihan',
          icon: Receipt,
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          accent: 'border-amber-500',
        };
      case 'NEED_UTENSILS':
        return {
          title: 'Alat Makan & Tisu',
          description: 'Pelanggan membutuhkan sendok, garpu, sedotan, atau tisu tambahan',
          icon: Utensils,
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          accent: 'border-blue-500',
        };
      case 'CUSTOM':
        return {
          title: 'Permintaan Khusus',
          description: 'Pelanggan memiliki pesan atau instruksi khusus untuk pelayan',
          icon: MessageSquare,
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
          accent: 'border-purple-500',
        };
      case 'CALL_WAITER':
      default:
        return {
          title: 'Panggil Pelayan',
          description: 'Pelanggan membutuhkan bantuan pelayan di meja',
          icon: ConciergeBell,
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
          accent: 'border-rose-500',
        };
    }
  };

  const getTimeAgo = (dateInput: string | Date) => {
    try {
      const d = new Date(dateInput);
      const diffMs = Date.now() - d.getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Baru saja';
      if (mins === 1) return '1 menit lalu';
      if (mins < 60) return `${mins} menit lalu`;
      const hrs = Math.floor(mins / 60);
      return `${hrs} jam lalu`;
    } catch {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-xl rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 pb-safe select-none"
      >
        {/* Mobile Drag Handle */}
        <div className="pt-2.5 pb-0.5 flex justify-center shrink-0 sm:hidden">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-800 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <ConciergeBell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">
                  Pusat Panggilan Pelayan
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-xs">
                  {calls.length} Meja
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Daftar permintaan pelanggan dari QR Meja secara real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-stone-50/50">
          {calls.length === 0 ? (
            <div className="py-14 text-center text-stone-400 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-2xs">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-stone-800">Semua Panggilan Telah Dilayani</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Tidak ada meja yang sedang menunggu panggilan pelayan saat ini. Sistem akan berbunyi otomatis jika ada panggilan baru.
              </p>
            </div>
          ) : (
            calls.map((call) => {
              const info = getCallTypeInfo(call.type);
              const Icon = info.icon;
              const timeFormatted = formatTime(call.createdAt);
              const timeAgo = getTimeAgo(call.createdAt);

              return (
                <div
                  key={call.id}
                  className={`p-4 bg-white rounded-2xl border-l-4 ${info.accent} border-t border-r border-b border-stone-200/80 shadow-xs hover:shadow-md transition space-y-3`}
                >
                  {/* Top: Table Number + Call Type Badge + Time */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-stone-900 text-white font-black text-xs shadow-xs flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>MEJA {call.table?.tableNumber || '-'}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${info.badgeBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{info.title}</span>
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-stone-700 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{timeFormatted}</span>
                      </div>
                      <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                        {timeAgo}
                      </div>
                    </div>
                  </div>

                  {/* Description & Custom Notes */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 space-y-1">
                    <p className="text-xs text-stone-600 font-medium leading-relaxed">
                      {info.description}
                    </p>
                    {call.notes && (
                      <div className="pt-1.5 mt-1.5 border-t border-stone-200/80 text-xs text-stone-900 flex items-start gap-1.5">
                        <span className="font-bold text-amber-900 shrink-0">Catatan Khusus:</span>
                        <span className="bg-amber-100/60 px-2 py-0.5 rounded text-amber-950 font-medium">
                          &ldquo;{call.notes}&rdquo;
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Selesaikan & Lihat Pesanan */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {onFilterTableOrders && call.table?.tableNumber ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onFilterTableOrders(call.table!.tableNumber);
                        }}
                        className="text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Cek Pesanan Meja</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={() => onResolve(call.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Selesai Dilayani</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Notifikasi otomatis memperbarui setiap detik</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
