/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { formatTime } from '@/lib/utils';
import {
  ConciergeBell,
  Utensils,
  Receipt,
  MessageSquare,
  Check,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';

interface WaiterCallToastProps {
  calls: any[];
  onOpenModal: () => void;
  onResolve: (callId: string) => Promise<void> | void;
}

export default function WaiterCallToast({
  calls,
  onOpenModal,
  onResolve,
}: WaiterCallToastProps) {
  if (!calls || calls.length === 0) return null;

  const latestCall = calls[0];

  const getCallTypeName = (type: string) => {
    switch (type) {
      case 'REQUEST_BILL':
        return 'Minta Tagihan / Bill';
      case 'NEED_UTENSILS':
        return 'Alat Makan & Tisu';
      case 'CUSTOM':
        return 'Permintaan Khusus';
      case 'CALL_WAITER':
      default:
        return 'Bantuan Pelayan';
    }
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'REQUEST_BILL':
        return Receipt;
      case 'NEED_UTENSILS':
        return Utensils;
      case 'CUSTOM':
        return MessageSquare;
      case 'CALL_WAITER':
      default:
        return ConciergeBell;
    }
  };

  const Icon = getCallIcon(latestCall.type);

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-md shrink-0 border-b border-amber-500/50 animate-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* Left: Table & Request Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/30 animate-bounce">
            <Icon className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-stone-950/80 text-amber-300 font-extrabold text-[11px] font-mono">
                MEJA {latestCall.table?.tableNumber || '-'}
              </span>
              <span className="font-extrabold text-white text-xs">
                {getCallTypeName(latestCall.type)}
              </span>
              <span className="text-amber-200 text-[11px] font-medium hidden xs:inline">
                ({formatTime(latestCall.createdAt)})
              </span>
            </div>

            {latestCall.notes && (
              <p className="text-[11px] text-amber-100 font-medium truncate mt-0.5">
                Catatan: &ldquo;{latestCall.notes}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {calls.length > 1 && (
            <span className="px-2 py-1 rounded-lg bg-white/20 text-white font-black text-[11px]">
              +{calls.length - 1} Meja Lain
            </span>
          )}

          <button
            type="button"
            onClick={() => onResolve(latestCall.id)}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer border border-emerald-500/40"
            title="Selesaikan panggilan meja ini"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Selesai</span>
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="px-3 py-1.5 rounded-xl bg-white text-stone-900 hover:bg-amber-50 active:scale-95 font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Notifikasi ({calls.length})</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
