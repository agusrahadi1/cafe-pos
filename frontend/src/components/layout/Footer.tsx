'use client';

import React from 'react';
import Link from 'next/link';
import {
  Coffee,
  ShieldCheck,
  Lock,
  FileText,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Layers,
  UtensilsCrossed,
  ConciergeBell,
  LayoutDashboard,
  Smartphone,
  Download,
  MessageSquare,
} from 'lucide-react';

interface FooterProps {
  tenantName?: string;
  isCompact?: boolean;
}

export default function Footer({ tenantName, isCompact = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (isCompact) {
    return (
      <footer className="border-t border-amber-200/60 bg-white/70 backdrop-blur-xs text-xs text-gray-500 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span>© {currentYear} {tenantName || 'Cafe POS'} • Didukung oleh </span>
            <strong className="text-gray-700 font-semibold">PT ADNAN BERKAH SEJAHTERA</strong>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium text-amber-800">
            <Link href="/privacy-policy" className="hover:underline flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kebijakan Privasi</span>
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-gray-400" />
              <span>Enkripsi SSL 256-bit</span>
            </span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-amber-200/70 bg-gradient-to-b from-stone-50 via-white to-amber-50/40 text-gray-600 text-xs">
      {/* Top Value / Trust Highlights */}
      <div className="border-b border-gray-100/80 bg-white/80 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-gray-900 block text-[11px]">Kepatuhan UU PDP No. 27/2022</span>
              <span className="text-[10px] text-gray-500">Perlindungan data pribadi pelanggan & merchant</span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-gray-900 block text-[11px]">Transaksi & QRIS Aman</span>
              <span className="text-[10px] text-gray-500">Enkripsi SSL & Payment Gateway Berlisensi</span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-gray-900 block text-[11px]">Multi-Role F&B Operational</span>
              <span className="text-[10px] text-gray-500">POS Kasir, Meja QR, Dapur, & Pelayan terintegrasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Company Identity */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 text-base tracking-tight block leading-none">Cafe POS</span>
                <span className="text-[10px] text-amber-800 font-semibold tracking-wide">F&B Management Suite</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Platform Point of Sale (POS) dan Pemesanan Mandiri Meja QR terintegrasi untuk kafe, resto, dan gerai kuliner modern di Indonesia.
            </p>

            <div className="pt-1 text-[11px] text-gray-500 space-y-1">
              <div className="font-bold text-gray-800">Dikelola & Dikembangkan oleh:</div>
              <div className="text-amber-900 font-bold">PT ADNAN BERKAH SEJAHTERA</div>
              <p className="text-[10px] text-gray-400">Penyedia Solusi Teknologi & Sistem Operasional Bisnis</p>
            </div>
          </div>

          {/* Col 2: Alur Operasional & Modul */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Modul Operasional</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/pos" className="hover:text-amber-700 transition flex items-center gap-1.5">
                  <LayoutDashboard className="w-3 h-3 text-amber-600" />
                  <span>Dashboard Kasir / POS</span>
                </Link>
              </li>
              <li>
                <Link href="/kitchen" className="hover:text-amber-700 transition flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                  <span>Layar Dapur (Kitchen Display)</span>
                </Link>
              </li>
              <li>
                <Link href="/waiter" className="hover:text-amber-700 transition flex items-center gap-1.5">
                  <ConciergeBell className="w-3 h-3 text-purple-600" />
                  <span>Antrian Pelayan (Waiter)</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/menu" className="hover:text-amber-700 transition flex items-center gap-1.5">
                  <Coffee className="w-3 h-3 text-orange-600" />
                  <span>Kelola Menu & Harga</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/tables" className="hover:text-amber-700 transition flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-blue-600" />
                  <span>Meja & QR Code Ordering</span>
                </Link>
              </li>
              <li className="pt-1">
                <Link
                  href="/download/app"
                  className="font-bold text-emerald-800 hover:text-emerald-900 transition flex items-center justify-between group bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-200/80 hover:bg-emerald-100"
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span>Download App Android</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-950 text-[9px] font-extrabold uppercase">
                    APK
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legalitas & Privasi */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Legalitas & Privasi</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link
                  href="/privacy-policy"
                  className="font-bold text-amber-800 hover:text-amber-900 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kebijakan Privasi (Privacy Policy)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/kebijakan-privasi"
                  className="hover:text-amber-700 transition flex items-center gap-1.5 text-gray-500"
                >
                  <FileText className="w-3 h-3 text-gray-400" />
                  <span>Perlindungan Data Pelanggan</span>
                </Link>
              </li>
              <li>
                <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/60 text-[10px] text-amber-900 space-y-1">
                  <span className="font-bold block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Jaminan Keamanan Data</span>
                  </span>
                  <span>Data transaksi dan pelanggan dienkripsi dan tidak pernah diperjualbelikan kepada pihak ketiga.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Layanan Bantuan & Kontak */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Bantuan & Kontak</h4>
            <div className="space-y-2 text-[11px] text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>Indonesia • PT ADNAN BERKAH SEJAHTERA</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <a
                  href="https://wa.me/6285139139864?text=Halo%20Admin%20CafePOS%2C%20saya%20ingin%20informasi%20pemesanan"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-gray-800 font-medium"
                >
                  Informasi pemesanan: <strong className="text-emerald-700 font-bold">WA 085139139864</strong>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <a href="mailto:agusrahadi1@gmail.com" className="hover:underline text-gray-800 font-medium">
                  agusrahadi1@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-gray-800 font-medium">Layanan Bantuan Mitra Kafe</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-[11px] font-bold transition shadow-xs"
              >
                <span>Portal Staf / Owner</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright & Disclaimer Bar */}
      <div className="border-t border-gray-200/80 bg-stone-100/90 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left text-[11px]">
          <div>
            <span>© {currentYear} <strong>Cafe POS System</strong>. Hak Cipta Dilindungi Undang-Undang.</span>
            <span className="block sm:inline sm:ml-1 text-gray-400">
              Dikembangkan oleh <strong>PT ADNAN BERKAH SEJAHTERA</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3 font-semibold text-amber-800">
            <Link href="/privacy-policy" className="hover:underline">
              Kebijakan Privasi
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500 font-normal">v1.0 Production Release</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

