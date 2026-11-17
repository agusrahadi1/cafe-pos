'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Coffee,
  QrCode,
  LayoutDashboard,
  UtensilsCrossed,
  ConciergeBell,
  ArrowRight,
  CheckCircle2,
  Printer,
  Smartphone,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  Receipt,
  Store,
  Layers,
  Users,
  Check,
  ExternalLink,
  Laptop,
  Download,
} from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Table } from '@/types';

export default function HomePage() {
  const [activeRoleTab, setActiveRoleTab] = useState<'pos' | 'qr' | 'kitchen' | 'waiter' | 'admin'>('pos');

  const roleShowcases = {
    pos: {
      title: 'Dashboard Kasir & Order Kanban',
      badge: 'Modul Utama Kasir',
      color: 'amber',
      description:
        'Sistem kasir cerdas dengan alur Kanban visual: pesanan baru, proses masak, siap saji, hingga pembayaran lunas. Dilengkapi kalkulator uang kembalian cepat dan rekap kasir otomatis.',
      features: [
        'Input pesanan walk-in manual atau terima order otomatis dari meja',
        'Cetak struk thermal Bluetooth portable 58mm & 80mm instan (0.3 detik)',
        'Rekonsiliasi kasir otomatis: pisahkan uang tunai & QRIS BorderPay tanpa selisih',
        'Buka & Tutup Shift dengan modal awal serta laporan rekap tercetak rapi',
      ],
      linkText: 'Buka Dashboard Kasir (POS)',
      linkUrl: '/pos',
      icon: LayoutDashboard,
      previewBadge: 'Live Kiosk Ready',
    },
    qr: {
      title: 'Pemesanan Mandiri Meja QR Pelanggan',
      badge: 'Self-Service Customer',
      color: 'orange',
      description:
        'Pelanggan cukup scan QR code di atas meja menggunakan kamera ponsel. Bebas memilih varian (Hot/Ice), level gula, topping, dan checkout dengan QRIS nasional tanpa perlu memanggil pelayan.',
      features: [
        'Tanpa perlu instal aplikasi — langsung terbuka di browser HP pelanggan',
        'Varian menu dinamis: takaran es, rasa sirup, pilihan susu, dan catatan khusus',
        'Pembayaran instan QRIS BorderPay langsung diverifikasi otomatis',
        'Pelacakan status hidangan realtime (Pesanan Diterima → Dimasak → Diantar)',
      ],
      linkText: 'Coba Simulasi Pesan di Meja',
      linkUrl: '/admin/tables',
      icon: QrCode,
      previewBadge: 'Zero Wait Time',
    },
    kitchen: {
      title: 'Layar Dapur (Kitchen Display System)',
      badge: 'Layar Khusus Koki',
      color: 'blue',
      description:
        'Layar antrian pesanan khusus koki dan barista dengan kontras tinggi. Setiap pesanan masuk langsung berbunyi dan menampilkan detail modifikasi menu secara jelas.',
      features: [
        'Notifikasi suara bel otomatis setiap ada pesanan baru masuk',
        'Timer durasi masak dengan indikator warna (Hijau → Kuning → Merah jika telat)',
        'Tombol aksi satu tap: "Mulai Masak" dan "Siap Disajikan"',
        'Pengelompokan otomatis per kategori minuman bar & makanan dapur',
      ],
      linkText: 'Buka Layar Dapur (KDS)',
      linkUrl: '/kitchen',
      icon: UtensilsCrossed,
      previewBadge: 'High Contrast Mode',
    },
    waiter: {
      title: 'Antrian Antar Pramusaji (Waiter Delivery)',
      badge: 'Operasional Pelayan',
      color: 'purple',
      description:
        'Memandu pramusaji mengetahui makanan/minuman yang telah selesai dibuat oleh dapur, nomor meja tujuan, serta menerima panggilan bantuan langsung dari pelanggan.',
      features: [
        'Daftar pesanan berstatus "Siap Antar" lengkap dengan nomor meja pelanggan',
        'Pusat notifikasi panggilan pelayan (*Waiter Call*) dari meja tamu',
        'Konfirmasi antar selesai (*Delivered*) langsung dari smartphone pramusaji',
        'Mencegah salah antar meja dan mempercepat perputaran meja tamu (*table turnover*)',
      ],
      linkText: 'Buka Layar Pelayan',
      linkUrl: '/waiter',
      icon: ConciergeBell,
      previewBadge: 'Instant Dispatch',
    },
    admin: {
      title: 'Manajemen Menu, Harga & Meja',
      badge: 'Panel Pemilik & Manajer',
      color: 'emerald',
      description:
        'Pusat kendali operasional kafe: atur katalog produk, harga modal vs harga jual, toggle stok habis, cetak QR code meja, dan tinjau riwayat shift kasir.',
      features: [
        'Kelola menu, kategori, varian opsi, dan foto produk menggugah selera',
        'Toggle ketersediaan stok produk (Tersedia / Habis) seketika',
        'Generator QR Code meja dengan cetak kartu nomor meja siap pakai',
        'Audit rekap shift kasir dan riwayat transaksi harian',
      ],
      linkText: 'Kelola Menu & Kafe',
      linkUrl: '/admin/menu',
      icon: Store,
      previewBadge: 'Full Control',
    },
  };

  const currentRole = roleShowcases[activeRoleTab];
  const CurrentIcon = currentRole.icon;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/70 via-stone-50 to-orange-50/30 text-stone-900 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP STICKY NAVBAR                                                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-orange-600/20 group-hover:scale-105 transition-transform shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-stone-900 tracking-tight block">
                  Cafe POS
                </span>
                <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  v1.0.2 Live PRO
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium block">
                Integrated F&B Management Suite
              </span>
            </div>
          </Link>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/download/app"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/90 active:scale-95 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download App</span>
              <span className="px-1.5 py-0.2 bg-emerald-200/90 text-emerald-950 font-black text-[9px] rounded uppercase">
                APK
              </span>
            </Link>

            <Link
              href="/demo-cafe"
              aria-label="Kunjungi Demo Kafe POS"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 active:scale-95 transition-all"
            >
              <Store className="w-3.5 h-3.5 text-stone-600" aria-hidden="true" />
              <span className="hidden xs:inline">Demo Cafe</span>
              <span className="sr-only">Demo Cafe POS</span>
            </Link>

            <Link
              href="/pos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-xs shadow-orange-600/25 active:scale-95 transition-all"
            >
              <span>Buka POS Kasir</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SHOWCASE SECTION (HIGH IMPACT)                                    */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:py-20 px-4 sm:px-8">
        {/* Ambient Warm Gradient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-amber-400/20 via-orange-400/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto space-y-10 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-amber-200/90 shadow-2xs text-amber-900 font-extrabold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Platform F&B Generasi Baru • Terintegrasi Multi-Peran & Multi-Outlet</span>
          </div>

          {/* Main Title & Subtitle */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-stone-900 tracking-tight leading-[1.12]">
              Satu Sistem Terpadu untuk{' '}
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                Kasir, Meja QR, Dapur
              </span>{' '}
              & Rekonsiliasi Otomatis
            </h1>
            <p className="mt-4 text-sm sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Hubungkan pesanan pelanggan langsung dari meja ke layar koki dapur. Dilengkapi integrasi printer thermal Bluetooth portable dan rekapitulasi shift QRIS BorderPay tanpa selisih rupiah.
            </p>
          </div>

          {/* Action Button CTA Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/pos"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm sm:text-base shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Buka Demo Kasir (POS)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>

            <Link
              href="/download/app"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-extrabold text-sm sm:text-base border border-stone-200 shadow-sm flex items-center justify-center gap-2.5 active:scale-95 transition-all duration-150"
            >
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>Unduh App Android (6.2 MB)</span>
            </Link>

            <Link
              href="/admin/tables"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-amber-100/70 hover:bg-amber-200/80 text-amber-900 font-extrabold text-sm border border-amber-200/80 flex items-center justify-center gap-2 active:scale-95 transition-all duration-150"
            >
              <QrCode className="w-4 h-4 text-amber-700" />
              <span>Simulasi Meja QR</span>
            </Link>
          </div>

          {/* Live Trust Metrics Strip */}
          <div className="pt-4 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Printer className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Printer Thermal</span>
              </div>
              <div className="font-black text-lg text-stone-900 tabular-nums">0.3 Detik</div>
              <div className="text-[11px] text-stone-500 font-medium">Cetak Struk Bluetooth</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Receipt className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">BorderPay QRIS</span>
              </div>
              <div className="font-black text-lg text-stone-900">100% Akurat</div>
              <div className="text-[11px] text-stone-500 font-medium">Rekonsiliasi Kasir Otomatis</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Multi-Role</span>
              </div>
              <div className="font-black text-lg text-stone-900">5-in-1 Modul</div>
              <div className="text-[11px] text-stone-500 font-medium">Kasir, Meja, Dapur, Waiter</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Sinkronisasi</span>
              </div>
              <div className="font-black text-lg text-stone-900">Realtime</div>
              <div className="text-[11px] text-stone-500 font-medium">Multi-Device Cloud</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE MULTI-ROLE SHOWCASE (TABS)                                 */}
      {/* ========================================================================= */}
      <section className="py-14 px-4 sm:px-8 border-t border-stone-200/80 bg-white/90">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-orange-950 bg-orange-100 border border-orange-300 px-3.5 py-1.5 rounded-full inline-block">
              Arsitektur Operasional
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Satu Sistem, Terintegrasi untuk Seluruh Tim Kafe
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Pilih peran di bawah ini untuk melihat bagaimana Cafe POS mempermudah setiap bagian bisnis kuliner Anda.
            </p>
          </div>

          {/* Interactive Role Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'pos', label: 'Kasir & POS', icon: LayoutDashboard },
              { id: 'qr', label: 'Pemesanan Meja QR', icon: QrCode },
              { id: 'kitchen', label: 'Layar Dapur (KDS)', icon: UtensilsCrossed },
              { id: 'waiter', label: 'Pelayan (Waiter)', icon: ConciergeBell },
              { id: 'admin', label: 'Kelola Menu & Admin', icon: Store },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeRoleTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRoleTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-md'
                      : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isSelected ? 'text-orange-400' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Role Detail Showcase Card */}
          <div className="rounded-3xl border border-stone-200/80 bg-stone-50/70 p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider">
                  {currentRole.badge}
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  {currentRole.previewBadge}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {currentRole.title}
              </h3>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {currentRole.description}
              </p>

              <div className="space-y-2.5 pt-2">
                {currentRole.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-700">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-semibold leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href={currentRole.linkUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-700 hover:bg-orange-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-700/20 active:scale-95 transition-all"
                >
                  <span>{currentRole.linkText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Visual Preview Tile */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/90 shadow-md p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                    <CurrentIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-stone-900">{currentRole.badge}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase">
                  Aktif Online
                </span>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-stone-500">
                  <span>Kompatibilitas Layar</span>
                  <span className="font-bold text-stone-800">HP, Tablet, iPad & Laptop</span>
                </div>
                <div className="flex justify-between items-center text-stone-500">
                  <span>Protokol Transmisi</span>
                  <span className="font-bold text-stone-800">WebSocket & SSE Realtime</span>
                </div>
                <div className="flex justify-between items-center text-stone-500">
                  <span>Otorisasi Role</span>
                  <span className="font-bold text-stone-800">Role-Based Access Control</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
                <Zap className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Terhubung otomatis tanpa perlu install server lokal di kafe.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BENTO GRID OF CORE INNOVATIONS                                         */}
      {/* ========================================================================= */}
      <section className="py-14 px-4 sm:px-8 border-t border-stone-200/80 bg-stone-50/60">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-stone-400">
              Fitur Unggulan Sistem
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Teknologi Modern yang Dibutuhkan Kafe Masa Kini
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Menghilangkan hambatan manual di kasir dan meja demi pengalaman pelanggan yang tak tertandingi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento Card 1 */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-stone-900">Bluetooth Thermal ESC/POS</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Mendukung semua printer Bluetooth thermal 58mm & 80mm murah. Cetak struk otomatis dan instan tanpa jeda dialog preview browser.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-stone-900">Rekap Shift & QRIS BorderPay</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Penjualan QRIS langsung terekap ke shift kasir yang aktif. Tutup shift kasir dan rekonsiliasi kas jadi sangat mudah dan 100% akurat.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-stone-900">Kepatuhan UU PDP & Enkripsi SSL</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Menjaga kerahasiaan data pribadi pelanggan dan merchant sesuai UU PDP No. 27/2022 dengan enkripsi standar perbankan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DOWNLOAD APP PROMOTION CALLOUT                                          */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-8 border-t border-stone-200/80 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Aplikasi Native Android (APK)</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Gunakan Aplikasi Cafe POS di HP & Tablet Android
            </h3>
            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
              Dapatkan kenyamanan cetak struk Bluetooth thermal instan dan mode layar kiosk kasir anti-sleep. Ukuran ringan hanya 6.2 MB.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/download/app"
              className="px-6 py-3.5 rounded-2xl bg-white text-stone-900 font-black text-sm shadow-xl hover:bg-stone-100 active:scale-95 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-orange-600 stroke-[2.5]" />
              <span>Halaman Download APK</span>
            </Link>

            <a
              href="/downloads/CafePOS.apk"
              download="CafePOS.apk"
              className="px-5 py-3.5 rounded-2xl bg-orange-800/60 hover:bg-orange-800 text-white font-extrabold text-sm border border-white/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Direct Download (6.2 MB)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. COMPREHENSIVE LEGAL & OPERATIONAL FOOTER                                */}
      {/* ========================================================================= */}
      <Footer />
    </main>
  );
}
