'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  Bell,
  Utensils,
  Receipt,
  MessageSquare,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  ConciergeBell,
} from 'lucide-react';

interface CallWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableToken?: string;
  tableId?: string;
  tableNumber?: string | number;
}

export default function CallWaiterModal({
  isOpen,
  onClose,
  tableToken,
  tableId,
  tableNumber,
}: CallWaiterModalProps) {
  const [callType, setCallType] = useState<'CALL_WAITER' | 'NEED_UTENSILS' | 'REQUEST_BILL' | 'CUSTOM'>('CALL_WAITER');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const options = [
    {
      id: 'CALL_WAITER',
      label: 'Panggil Pelayan',
      sublabel: 'Butuh bantuan seputar kafe atau menu',
      icon: ConciergeBell,
      badge: 'Umum',
    },
    {
      id: 'NEED_UTENSILS',
      label: 'Alat Makan & Tisu',
      sublabel: 'Minta sendok, garpu, sedotan, atau tisu',
      icon: Utensils,
      badge: 'Perlengkapan',
    },
    {
      id: 'REQUEST_BILL',
      label: 'Minta Tagihan / Bill',
      sublabel: 'Siap bayar tunai / cetak struk di meja',
      icon: Receipt,
      badge: 'Kasir',
    },
    {
      id: 'CUSTOM',
      label: 'Kebutuhan Lainnya',
      sublabel: 'Tulis pesan khusus untuk staf kafe',
      icon: MessageSquare,
      badge: 'Catatan',
    },
  ];

  const handleSendCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any>('/tables/call-waiter', {
        tableToken,
        tableId,
        type: callType,
        notes: notes.trim() || undefined,
      });

      if (res && res.success) {
        setSuccess(res.message || `Pelayan telah dipanggil ke Meja ${tableNumber || ''}!`);
        setTimeout(() => {
          setSuccess(null);
          setNotes('');
          onClose();
        }, 2500);
      } else {
        setError(res?.message || 'Gagal memanggil pelayan. Silakan coba lagi.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat memanggil pelayan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 duration-300 relative select-none pb-safe"
      >
        {/* Flutter Drag Handle Pill */}
        <div className="pt-3 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-500/20 shrink-0">
              <ConciergeBell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-stone-900 leading-tight">
                Panggil Pelayan
              </h3>
              <p className="text-[11px] text-amber-800 font-bold mt-0.5">
                {tableNumber ? `Untuk Meja ${tableNumber}` : 'Bantuan Meja'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200/80 transition active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 no-scrollbar">
          {success ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-stone-900 text-base">Permintaan Terkirim!</h4>
              <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                {success}
              </p>
              <div className="p-3 bg-emerald-50 rounded-2xl text-[11px] text-emerald-800 font-bold border border-emerald-200/60 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Pelayan segera mendatangi meja Anda</span>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-stone-400 uppercase tracking-wider mb-2">
                  Pilih Keperluan Anda:
                </label>
                <div className="space-y-2">
                  {options.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = callType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCallType(opt.id as any)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-400/40'
                            : 'border-stone-200/80 hover:border-stone-300 text-stone-700 hover:bg-stone-50 bg-white'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 transition-colors ${
                            isSelected ? 'bg-amber-500 text-white shadow-xs' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold">{opt.label}</span>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-amber-200/90 text-amber-900'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                            {opt.sublabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-[11px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
                  Catatan Tambahan (Opsional):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Minta 2 sedotan dan sendok tambahan..."
                  rows={2}
                  className="w-full text-xs p-3 bg-stone-100/80 border border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition resize-none font-medium"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendCall}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim Panggilan...</span>
                    </>
                  ) : (
                    <>
                      <ConciergeBell className="w-4 h-4" />
                      <span>Panggil Pelayan ke Meja {tableNumber || ''}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
