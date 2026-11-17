'use client';

import React from 'react';
import { Table } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { getImageUrl } from '@/lib/utils';
import { Smartphone, Coffee, Scissors, Sparkles } from 'lucide-react';

export interface TableQrStandeeCardProps {
  table: Table;
  tenantProfile: any;
  qrUrl: string;
  size?: 'normal' | 'compact';
  showCutGuide?: boolean;
}

export default function TableQrStandeeCard({
  table,
  tenantProfile,
  qrUrl,
  size = 'normal',
  showCutGuide = true,
}: TableQrStandeeCardProps) {
  const isCompact = size === 'compact';
  const tenantName = tenantProfile?.name || 'Mokka Cafe & Resto';
  const tenantTagline = tenantProfile?.tagline || 'Pesan Langsung dari Meja Anda';
  const tenantLogo = getImageUrl(tenantProfile?.logoUrl || tenantProfile?.logo);

  return (
    <div
      className={`table-qr-card relative bg-white border-2 border-stone-800 text-stone-900 rounded-3xl flex flex-col items-center justify-between text-center overflow-hidden transition-all print:border-2 print:border-stone-800 print:shadow-none ${
        isCompact
          ? 'w-[310px] min-h-[430px] p-3.5 shadow-sm'
          : 'w-[335px] min-h-[460px] p-4 shadow-md'
      }`}
      style={{
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Decorative Corner Trim Guide */}
      {showCutGuide && (
        <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-semibold text-stone-400 print:text-stone-500 uppercase tracking-wider">
          <Scissors className="w-2.5 h-2.5" />
          <span>Garis Potong</span>
        </div>
      )}

      {/* 1. Header Cafe Branding */}
      <div className="w-full flex flex-col items-center pt-1">
        {tenantLogo ? (
          <img
            src={tenantLogo}
            alt={tenantName}
            className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} object-contain mx-auto mb-1`}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className={`${isCompact ? 'w-9 h-9' : 'w-10 h-10'} rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black mb-1`}>
            <Coffee className="w-5 h-5" />
          </div>
        )}

        <h2 className="text-sm font-black tracking-wider uppercase text-stone-900 leading-tight">
          {tenantName}
        </h2>
        {tenantTagline && (
          <p className="text-[10px] text-stone-500 italic mt-0.5 line-clamp-1">
            {tenantTagline}
          </p>
        )}
      </div>

      {/* 2. Table Number Pill Badge */}
      <div className="my-2 px-5 py-1 bg-stone-900 text-white rounded-full flex items-center justify-center gap-2 shadow-xs print:shadow-none">
        <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">NO.</span>
        <span className={`${isCompact ? 'text-lg' : 'text-xl'} font-black tracking-wider`}>
          MEJA {table.tableNumber}
        </span>
      </div>

      {/* 3. QR Code Frame Container */}
      <div className="w-full bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3 flex flex-col items-center shadow-2xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5 mb-2">
          <Smartphone className="w-3.5 h-3.5 text-amber-600" />
          <span>SCAN UNTUK PESAN & BAYAR</span>
        </span>

        {qrUrl ? (
          <div className="p-2.5 bg-white rounded-xl shadow-xs border border-amber-200/80">
            <QRCodeSVG
              value={qrUrl}
              size={isCompact ? 120 : 145}
              level="H"
              includeMargin={false}
            />
          </div>
        ) : (
          <div className="w-28 h-28 bg-stone-100 rounded-xl flex items-center justify-center text-xs text-stone-400">
            QR Belum Aktif
          </div>
        )}

        <p className="text-[9px] text-stone-600 mt-2 font-medium">
          Arahkan kamera smartphone Anda ke kode di atas
        </p>
      </div>

      {/* 4. Three Steps Infographic */}
      <div className="grid grid-cols-3 gap-1.5 w-full my-2 pt-2 border-t border-dashed border-stone-200 text-center">
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[9px] font-black mb-0.5">
            1
          </div>
          <span className="text-[9px] font-bold text-stone-800">Scan QR</span>
          <span className="text-[8px] text-stone-500 leading-tight">Buka Menu</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[9px] font-black mb-0.5">
            2
          </div>
          <span className="text-[9px] font-bold text-stone-800">Pilih Menu</span>
          <span className="text-[8px] text-stone-500 leading-tight">Pesan & Bayar</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[9px] font-black mb-0.5">
            3
          </div>
          <span className="text-[9px] font-bold text-stone-800">Duduk Santai</span>
          <span className="text-[8px] text-stone-500 leading-tight">Pesanan Diantar</span>
        </div>
      </div>

      {/* 5. Footer Greetings */}
      <div className="pt-1.5 border-t border-stone-200 w-full text-center">
        <p className="text-[9px] font-bold text-stone-700 flex items-center justify-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
          <span>Selamat Menikmati Santapan Anda</span>
          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
        </p>
        {tenantProfile?.phone && (
          <p className="text-[8px] text-stone-400 mt-0.5">
            Bantuan Pelayan / Kasir: {tenantProfile.phone}
          </p>
        )}
      </div>
    </div>
  );
}

