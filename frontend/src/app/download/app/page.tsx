'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Smartphone,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Store,
  ChevronRight,
  ChevronDown,
  Cpu,
  Layers,
  Sparkles,
  QrCode,
  Check,
  Copy,
  Info,
  Clock,
  Radio,
  Receipt,
  ExternalLink,
  Laptop,
  CheckCircle,
} from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function DownloadAppPage() {
  const [activeTab, setActiveTab] = useState<'qr' | 'specs'>('qr');
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const downloadUrl = 'https://cafe.abstech.web.id/downloads/CafePOS.apk';
  const appVersion = 'v1.0.2 Live PRO';
  const apkSize = '6.2 MB';
  const releaseDate = 'November 2026';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-amber-50/30 text-stone-900 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR                                                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/pos" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-orange-600/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-stone-900 tracking-tight block">
                  Cafe POS
                </span>
                <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {appVersion}
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium block">
                Official Android Native Suite
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/pos"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100/80 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Laptop className="w-4 h-4 text-stone-500" />
              <span className="hidden sm:inline">Buka Web POS</span>
            </Link>

            <a
              href="/downloads/CafePOS.apk"
              download="CafePOS.apk"
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-xs shadow-orange-600/25 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Unduh APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SHOWCASE SECTION                                                  */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:py-16 px-4 sm:px-8">
        {/* Subtle Decorative Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-amber-400/15 via-orange-400/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* SISI KIRI: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-800 font-extrabold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Aplikasi Kasir Android Resmi • Standar POS F&B Modern</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-[1.15]">
              Cepat, Andal & Langsung Terhubung ke{' '}
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Printer Thermal Bluetooth
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Solusi POS kasir native Android untuk smartphone dan tablet. Cetak struk otomatis tanpa dialog browser, rekap shift kasir presisi dengan integrasi QRIS BorderPay, dan sinkronisasi pesanan meja tanpa jeda.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <a
                href="/downloads/CafePOS.apk"
                download="CafePOS.apk"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm sm:text-base shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <div className="text-left leading-tight">
                  <div>Download CafePOS.apk</div>
                  <div className="text-[10px] font-semibold text-amber-100 opacity-90">
                    Versi 1.0.2 • Bebas Lisensi • {apkSize}
                  </div>
                </div>
              </a>

              <Link
                href="/pos"
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-extrabold text-sm border border-stone-200/90 flex items-center justify-center gap-2 active:scale-95 transition-all duration-150"
              >
                <Laptop className="w-4 h-4 text-stone-600" />
                <span>Buka Web POS (Tanpa Pasang)</span>
              </Link>
            </div>

            {/* Trust & Spec Micro-Tags */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-stone-500">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bebas Virus & Terverifikasi</span>
              </div>
              <span className="text-stone-300">•</span>
              <div className="flex items-center gap-1.5 text-stone-700">
                <Cpu className="w-4 h-4 text-stone-500 shrink-0" />
                <span>Android 8.0 s/d 14+</span>
              </div>
              <span className="text-stone-300">•</span>
              <div className="flex items-center gap-1.5 text-stone-700">
                <Printer className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Thermal 58mm & 80mm</span>
              </div>
            </div>
          </div>

          {/* SISI KANAN: QR Code Hub & Spec Details */}
          <div className="lg:col-span-5">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/80 shadow-xl p-5 sm:p-6 space-y-4">
              {/* Header Selector Tabs */}
              <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('qr')}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'qr'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-orange-600" />
                  <span>Scan QR di HP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'specs'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 text-orange-600" />
                  <span>Spesifikasi File</span>
                </button>
              </div>

              {activeTab === 'qr' ? (
                <div className="text-center space-y-3 pt-1">
                  <div className="inline-block p-3.5 bg-white rounded-2xl border border-stone-200 shadow-inner">
                    <QRCodeSVG
                      value={downloadUrl}
                      size={180}
                      level="M"
                      includeMargin={false}
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-xs text-stone-600 font-medium max-w-xs mx-auto">
                    Arahkan kamera ponsel Android Anda ke QR di atas untuk mengunduh berkas APK secara langsung.
                  </p>

                  <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200/70 text-xs text-stone-600">
                    <span className="truncate flex-1 font-mono text-[11px] text-stone-500 select-all">
                      {downloadUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 hover:bg-stone-100 flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 transition"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-black">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-500" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-medium">Nama Paket</span>
                    <span className="font-mono font-bold text-stone-800">id.web.abstech.cafe</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-medium">Versi Rilis</span>
                    <span className="font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      {appVersion}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-medium">Ukuran Berkas</span>
                    <span className="font-bold text-stone-900 tabular-nums">{apkSize}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-medium">Kebutuhan OS</span>
                    <span className="font-bold text-stone-800">Android 8.0 s/d 14+</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-medium">Protokol Printer</span>
                    <span className="font-bold text-stone-800">Bluetooth SPP (Classic) & BLE</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-stone-500 font-medium">Tanggal Update</span>
                    <span className="font-semibold text-stone-700">{releaseDate}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BENTO GRID: FITUR UTAMA PRO MAX                                        */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-8 border-t border-stone-200/80 bg-white/70">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
              Keunggulan Native APK
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Kenapa Memilih Versi Aplikasi Android?
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Dibuat khusus untuk mengatasi keterbatasan browser web standar saat menangani operasional kasir harian yang cepat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bento Item 1 */}
            <div className="p-5 rounded-3xl bg-stone-50/80 border border-stone-200/80 hover:border-orange-300 transition-all duration-200 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-stone-900">Silent Direct Printing</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Struk kasir langsung tercetak otomatis dalam hitungan 0.3 detik via Bluetooth tanpa perlu membuka popup dialog preview browser.
              </p>
            </div>

            {/* Bento Item 2 */}
            <div className="p-5 rounded-3xl bg-stone-50/80 border border-stone-200/80 hover:border-emerald-300 transition-all duration-200 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-stone-900">Rekonsiliasi BorderPay QRIS</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Transaksi QRIS BorderPay otomatis terekap ke shift kasir yang sedang aktif. Tutup shift kasir akurat tanpa selisih pembukuan.
              </p>
            </div>

            {/* Bento Item 3 */}
            <div className="p-5 rounded-3xl bg-stone-50/80 border border-stone-200/80 hover:border-amber-300 transition-all duration-200 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-stone-900">Layar Kiosk & Anti Sleep</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Fitur Wake Lock menjaga layar tablet kasir tetap menyala selama jam operasional tanpa khawatir layar terkunci saat antrian ramai.
              </p>
            </div>

            {/* Bento Item 4 */}
            <div className="p-5 rounded-3xl bg-stone-50/80 border border-stone-200/80 hover:border-blue-300 transition-all duration-200 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-stone-900">Ringan di HP Entry-Level</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Ukuran sangat kecil ({apkSize}) dan hemat memori. Berjalan mulus di ponsel kasir RAM 2GB (seperti vivo Y22, Samsung Galaxy, atau Redmi).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. STEP-BY-STEP INSTALLATION GUIDE                                        */}
      {/* ========================================================================= */}
      <section className="py-14 px-4 sm:px-8 border-t border-stone-200/80 bg-stone-50/50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-stone-500">
              Panduan Pemasangan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              4 Langkah Mudah Memasang APK di Android
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Karena berkas diunduh langsung dari server kafe resmi kami, ikuti panduan praktis berikut:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 font-black text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-stone-900">Unduh Berkas APK</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tekan tombol <strong>Unduh CafePOS.apk</strong> di atas atau scan QR dengan kamera HP.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 font-black text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-stone-900">Buka Notifikasi Unduhan</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tarik bar notifikasi di ponsel Anda, lalu sentuh berkas <code>CafePOS.apk</code> yang telah selesai diunduh.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 font-black text-sm flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-stone-900">Izinkan Sumber Ini</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Jika muncul peringatan keamanan browser, pilih <strong>Setelan</strong> lalu aktifkan opsi <strong>Izinkan dari sumber ini</strong>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0">
                4
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-stone-900">Buka & Hubungkan Printer</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Klik <strong>Pasang / Install</strong>. Setelah selesai, buka aplikasi lalu tap ikon <strong>Printer</strong> di pojok kanan atas untuk menghubungkan printer Bluetooth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HARDWARE COMPATIBILITY BADGES                                          */}
      {/* ========================================================================= */}
      <section className="py-10 px-4 sm:px-8 border-t border-stone-200/80 bg-white text-center space-y-4">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
          Kompatibilitas Printer Thermal Teruji
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 max-w-3xl mx-auto">
          {['Panda Mobile', 'VSC Thermal', 'Eppos 58mm', 'Iware Bluetooth', 'Zjiang 5802', 'Sunmi V1/V2', 'Xprinter Mini', 'Generic BT POS'].map(
            (printerName) => (
              <span
                key={printerName}
                className="px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700"
              >
                {printerName}
              </span>
            )
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FAQ ACCORDION                                                          */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-8 border-t border-stone-200/80 bg-stone-50/70">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Pertanyaan Sering Diajukan (FAQ)
            </h3>
            <p className="text-xs text-stone-500">
              Jawaban seputar pemasangan dan penggunaan aplikasi kasir Cafe POS Android.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                q: 'Apakah aplikasi ini bisa digunakan di beberapa smartphone kasir sekaligus?',
                a: 'Ya, sistem Cafe POS berbasis Multi-User dan Multi-Device Cloud. Anda dapat memasang aplikasi di banyak ponsel kasir sekaligus, dan seluruh transaksi akan tersinkronisasi otomatis secara realtime.',
              },
              {
                q: 'Bagaimana jika ponsel saya belum memiliki Bluetooth Thermal Printer?',
                a: 'Aplikasi tetap berfungsi 100% normal. Anda dapat tetap menerima pesanan meja, memproses pembayaran tunai maupun QRIS BorderPay. Fitur cetak dapat diaktifkan kapan saja setelah Anda memiliki printer.',
              },
              {
                q: 'Apakah data penjualan kafe aman jika ponsel kasir hilang atau rusak?',
                a: 'Sangat aman. Semua data transaksi, produk, dan laporan shift tersimpan di server cloud terenkripsi (bukan tersimpan lokal di ponsel). Jika ponsel berganti, Anda cukup login kembali di ponsel baru.',
              },
              {
                q: 'Bagaimana cara memperbarui aplikasi ketika ada update baru?',
                a: 'Cukup buka kembali halaman download ini dan unduh file APK terbaru. Saat Anda meng-install file baru, sistem Android akan otomatis memperbarui aplikasi tanpa menghapus akun atau sesi login Anda.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 bg-white overflow-hidden transition-all duration-150"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-stone-800 hover:text-stone-900 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-orange-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-2 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SHARED FOOTER                                                          */}
      {/* ========================================================================= */}
      <Footer />
    </div>
  );
}
