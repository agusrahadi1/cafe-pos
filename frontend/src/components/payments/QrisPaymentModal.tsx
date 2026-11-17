/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import {
  X,
  RotateCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  QrCode as QrIcon,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface QrisPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  qrString?: string | null;
  qrImageUrl?: string | null;
  paymentUrl?: string | null;
  onPaymentSuccess?: () => void;
}

export default function QrisPaymentModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  qrString,
  qrImageUrl,
  paymentUrl,
  onPaymentSuccess,
}: QrisPaymentModalProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isChecking, setIsChecking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isSuccess) return;
    setTimeLeft(15 * 60);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isSuccess]);

  // Format time MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check payment status helper
  const checkStatus = async (isManual = false) => {
    if (!orderId || isSuccess) return;
    if (isManual) setIsChecking(true);

    try {
      const res = await api.get<{ synced: boolean; status?: string; orderStatus?: string }>(
        `/payments/${orderId}/borderpay-sync`,
      );

      const status = (res?.status || res?.orderStatus || '').toUpperCase();
      if (status === 'PAID' || status === 'CONFIRMED' || status === 'COMPLETED' || status === 'SUCCESS') {
        setIsSuccess(true);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);

        setTimeout(() => {
          if (onPaymentSuccess) {
            onPaymentSuccess();
          } else {
            onClose();
          }
        }, 1800);
      }
    } catch (err) {
      // Ignore background poll errors silently
    } finally {
      if (isManual) setIsChecking(false);
    }
  };

  // Auto-polling status every 3 seconds while open
  useEffect(() => {
    if (!isOpen || isSuccess || !orderId) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(() => {
      checkStatus(false);
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, isSuccess, orderId]);

  if (!isOpen) return null;

  // The QR value to render: prefer qrString, then paymentUrl
  const qrValue = qrString || paymentUrl || '';

  const handleCopyLink = () => {
    if (!paymentUrl) return;
    navigator.clipboard.writeText(paymentUrl);
    setHasCopiedUrl(true);
    setTimeout(() => setHasCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <QrIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <span>QRIS Pembayaran Instan</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Otomatis
                </span>
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                {orderNumber ? `#${orderNumber}` : 'Pesanan Kafe'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {isSuccess ? (
            /* SUCCESS STATE ANIMATION */
            <div className="py-8 flex flex-col items-center space-y-3 animate-in zoom-in-90 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-stone-900">Pembayaran Berhasil! 🎉</h3>
                <p className="text-xs text-stone-500 max-w-xs">
                  Dana telah diterima secara instan. Pesanan Anda segera disiapkan oleh barista & dapur.
                </p>
              </div>
            </div>
          ) : (
            /* ACTIVE QRIS SCANNING STATE */
            <>
              {/* Total Tagihan */}
              <div className="w-full bg-stone-50 rounded-2xl p-3 border border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Total Pembayaran:</span>
                <span className="text-base sm:text-lg font-black text-amber-700 font-mono">
                  {formatRupiah(amount)}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="relative p-3 bg-white rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col items-center justify-center">
                {/* Official QRIS Header Badge */}
                <div className="w-full pb-2 mb-1 border-b border-stone-100 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black tracking-widest text-red-600 font-mono">QRIS</span>
                    <span className="text-[9px] text-stone-400 font-bold">Nasional</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span className="font-mono font-bold text-amber-700">{formatCountdown(timeLeft)}</span>
                  </div>
                </div>

                {/* The QR Display */}
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Kode QRIS Pembayaran"
                    className="w-52 h-52 object-contain rounded-lg"
                  />
                ) : qrValue ? (
                  <div className="bg-white p-2 rounded-lg">
                    <QRCodeSVG
                      value={qrValue}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                ) : (
                  <div className="w-52 h-52 flex flex-col items-center justify-center text-stone-400 space-y-2">
                    <RotateCw className="w-6 h-6 animate-spin text-amber-600" />
                    <span className="text-xs">Memuat Kode QRIS...</span>
                  </div>
                )}

                {/* Subtext info */}
                <div className="w-full pt-2 mt-1 border-t border-stone-100 text-[10px] text-stone-400 font-medium flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mendukung Semua Bank & E-Wallet</span>
                </div>
              </div>

              {/* Pulsing Status Bar */}
              <div className="w-full py-2 px-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-[11px] font-bold">Menunggu pembayaran Anda...</span>
                </div>

                <button
                  type="button"
                  onClick={() => checkStatus(true)}
                  disabled={isChecking}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer underline underline-offset-2"
                  title="Cek Status Pembayaran"
                >
                  <RotateCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Mengecek...' : 'Cek Status'}</span>
                </button>
              </div>

              {/* Instructions */}
              <p className="text-[11px] text-stone-500 leading-relaxed text-left bg-stone-50 p-2.5 rounded-xl border border-stone-100 w-full">
                <strong>Cara Bayar:</strong> Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, ShopeePay, DANA), lalu pilih menu <strong>Scan QRIS</strong> dan arahkan kamera ke kode di atas.
              </p>

              {/* External Link Fallback */}
              {paymentUrl && (
                <div className="w-full flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-stone-500 hover:text-stone-800 flex items-center gap-1 transition cursor-pointer"
                  >
                    {hasCopiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{hasCopiedUrl ? 'Tautan Disalin!' : 'Salin Tautan Bayar'}</span>
                  </button>

                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 transition"
                  >
                    <span>Buka Layar Penuh</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
