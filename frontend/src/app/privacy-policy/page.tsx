'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Coffee,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Building,
  Printer,
  ChevronRight,
  Database,
  Eye,
  Server,
  CreditCard,
  UserCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicyPage() {
  const lastUpdated = '16 September 2026';

  const sections = [
    { id: 'ringkasan', title: 'Ringkasan Eksekutif' },
    { id: 'definisi', title: '1. Definisi & Ruang Lingkup' },
    { id: 'dasar-hukum', title: '2. Dasar Hukum & Kepatuhan UU PDP' },
    { id: 'data-dikumpulkan', title: '3. Data yang Kami Kumpulkan' },
    { id: 'tujuan-pengolahan', title: '4. Tujuan Pengolahan Data' },
    { id: 'pembayaran-keamanan', title: '5. Transaksi & Keamanan Pembayaran' },
    { id: 'penyimpanan-keamanan', title: '6. Penyimpanan & Perlindungan Data' },
    { id: 'pembagian-pihak-ketiga', title: '7. Pembagian Data ke Pihak Ketiga' },
    { id: 'hak-pengguna', title: '8. Hak-Hak Subjek Data' },
    { id: 'retensi-data', title: '9. Kebijakan Retensi Data' },
    { id: 'cookies-storage', title: '10. Cookie & Local Storage' },
    { id: 'perubahan-kebijakan', title: '11. Perubahan Kebijakan Privasi' },
    { id: 'kontak-layanan', title: '12. Informasi Kontak & Pengaduan' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-gray-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-amber-100/90 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition flex items-center gap-1.5 text-xs font-bold"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            <div className="h-4 w-px bg-gray-200" />

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-xs">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight leading-tight block">
                  Cafe POS
                </span>
                <span className="text-[10px] text-gray-400 block -mt-0.5">By PT ADNAN BERKAH SEJAHTERA</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Cetak Dokumen"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Cetak Dokumen</span>
            </button>
            <Link
              href="/pos"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              <span>Akses POS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        {/* Title Hero */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-stone-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Kepatuhan UU No. 27 Tahun 2022 (UU PDP)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Kebijakan Privasi & Perlindungan Data Pribadi
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/80 leading-relaxed">
              Komitmen resmi PT ADNAN BERKAH SEJAHTERA dalam menjaga kerahasiaan, keamanan, dan kedaulatan data pribadi
              seluruh pengguna platform Cafe POS, mencakup merchant kafe, kasir, staf, serta pelanggan akhir pemesan QR meja.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-amber-200/90 font-medium">
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>Pengelola: PT ADNAN BERKAH SEJAHTERA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Enkripsi SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Terakhir Diperbarui: {lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Sticky Navigation (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-24 bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs space-y-2">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
              Daftar Bagian
            </div>
            <nav className="space-y-1 text-xs">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-amber-900 hover:bg-amber-50 font-medium transition truncate"
                >
                  {sec.title}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500">
              <span className="font-bold text-gray-700 block">Butuh bantuan privasi?</span>
              <a href="mailto:privacy@adnanberkah.com" className="text-amber-700 hover:underline">
                privacy@adnanberkah.com
              </a>
            </div>
          </aside>

          {/* Policy Document Content */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-xs space-y-10 text-sm leading-relaxed text-gray-700">
            {/* Section: Ringkasan Eksekutif */}
            <section id="ringkasan" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Ringkasan Eksekutif</h2>
              </div>
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 space-y-2 text-xs sm:text-sm text-emerald-950">
                <p className="font-semibold">
                  Di Cafe POS, privasi dan kepercayaan Anda adalah prioritas utama kami. Berikut adalah prinsip inti kami:
                </p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li><strong>Tidak Ada Penjualan Data:</strong> Kami tidak pernah dan tidak akan pernah menjual atau menyewakan data pribadi Anda ke pihak ketiga manapun untuk tujuan periklanan.</li>
                  <li><strong>Data Hanya untuk Operasional:</strong> Data pelanggan meja hanya digunakan untuk memproses pesanan, mengantar makanan, dan menerbitkan tanda terima/struk pembayaran.</li>
                  <li><strong>Keamanan Pembayaran:</strong> Data pembayaran online dan QRIS diproses secara aman dan langsung oleh Payment Gateway resmi berlisensi Bank Indonesia (Xendit) dengan standar PCI-DSS.</li>
                  <li><strong>Isolasi Antar Kafe (Multi-Tenant):</strong> Data tiap kafe/tenant terisolasi secara ketat dan aman sehingga tidak dapat diakses oleh tenant lain.</li>
                </ul>
              </div>
            </section>

            {/* Section 1: Definisi & Ruang Lingkup */}
            <section id="definisi" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">1. Definisi & Ruang Lingkup</h2>
              </div>
              <p>
                Kebijakan Privasi ini mengatur bagaimana <strong>PT ADNAN BERKAH SEJAHTERA</strong> (&quot;Kami&quot;, &quot;Perusahaan&quot;, atau &quot;Pengelola&quot;)
                mengumpulkan, menggunakan, menyimpan, mengungkapkan, dan melindungi data pribadi yang diperoleh melalui ekosistem aplikasi <strong>Cafe POS</strong>,
                yang mencakup:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-2">
                <li><strong>Aplikasi Web Kasir (POS):</strong> Modul pencatatan transaksi, rekonsiliasi kas laci (shift management), dan penerbitan struk.</li>
                <li><strong>Layar Dapur (Kitchen Display System / KDS):</strong> Modul manajemen antrian masak untuk juru masak / koki.</li>
                <li><strong>Layar Pelayan (Waiter Queue):</strong> Modul pengantaran pesanan siap saji ke nomor meja pelanggan.</li>
                <li><strong>Portal Pemesanan Meja QR (Customer QR Table Ordering):</strong> Antarmuka mandiri tanpa aplikasi yang diakses pelanggan dengan memindai QR code di meja.</li>
                <li><strong>Dashboard Manajemen & Laporan Keuangan (Admin/Owner Portal):</strong> Modul pengelolaan menu, harga modal, inventaris bahan baku, serta analitik laba-rugi.</li>
              </ul>
            </section>

            {/* Section 2: Dasar Hukum & Kepatuhan UU PDP */}
            <section id="dasar-hukum" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">2. Dasar Hukum & Kepatuhan Regulasi</h2>
              </div>
              <p>
                Kami menjalankan seluruh pemrosesan data pribadi dengan berlandaskan pada ketentuan perundang-undangan Republik Indonesia yang berlaku, khususnya:
              </p>
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2 text-xs sm:text-sm text-blue-950">
                <ul className="space-y-1.5 list-disc list-inside">
                  <li><strong>Undang-Undang Republik Indonesia No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).</strong></li>
                  <li><strong>Undang-Undang No. 19 Tahun 2016 tentang Perubahan atas Undang-Undang No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE).</strong></li>
                  <li><strong>Peraturan Pemerintah No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE).</strong></li>
                  <li><strong>Ketentuan Bank Indonesia</strong> mengenai standar pemrosesan transaksi pembayaran digital dan QRIS.</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500">
                Sebagai Pengendali dan Pemroses Data Pribadi, PT ADNAN BERKAH SEJAHTERA berkewajiban melindungi hak subjek data serta memastikan kepatuhan teknis di seluruh infrastruktur cloud server kami.
              </p>
            </section>

            {/* Section 3: Data yang Kami Kumpulkan */}
            <section id="data-dikumpulkan" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Database className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">3. Data Pribadi yang Kami Kumpulkan</h2>
              </div>
              <p>
                Kami hanya mengumpulkan data yang relevan dan dibutuhkan secara wajar untuk menjalankan operasional kafe serta melayani transaksi:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                  <h3 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-amber-700" />
                    <span>A. Data Pelanggan Meja (Customer QR)</span>
                  </h3>
                  <ul className="space-y-1 list-disc list-inside text-gray-700">
                    <li>Nama panggilan / nama pemesan (untuk verifikasi pesanan di meja).</li>
                    <li>Nomor meja dan outlet kafe yang dipindai.</li>
                    <li>Nomor telepon / WhatsApp (bersifat opsional untuk pengiriman e-struk & status pesanan).</li>
                    <li>Catatan pesanan khusus (misal: alergi, tingkat kepedasan, takaran gula).</li>
                    <li>Rincian item menu dan total transaksi yang dipesan.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-slate-700" />
                    <span>B. Data Pengelola & Staf Kafe (Merchant)</span>
                  </h3>
                  <ul className="space-y-1 list-disc list-inside text-gray-700">
                    <li>Nama lengkap pemilik kafe, manajer, kasir, koki, dan pelayan.</li>
                    <li>Alamat email dan kata sandi terenkripsi (hashed password) untuk otentikasi login.</li>
                    <li>Peran akun (Role-based access: Superadmin, Owner, Admin, Kasir, Dapur, Pelayan).</li>
                    <li>Nama bisnis, logo kafe, alamat outlet, dan nomor telepon kontak resmi kafe.</li>
                    <li>Catatan sesi kasir (nama shift, jam buka/tutup shift, rekonsiliasi kas laci).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
                  <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>C. Data Pembayaran & Keuangan</span>
                  </h3>
                  <ul className="space-y-1 list-disc list-inside text-gray-700">
                    <li>Metode pembayaran yang dipilih (Tunai di Kasir, QRIS Dinamis, Transfer).</li>
                    <li>Nominal transaksi, pajak (PB1), biaya layanan, dan diskon.</li>
                    <li>ID referensi pembayaran dari Payment Gateway resmi (Xendit).</li>
                    <li>Status verifikasi pembayaran (PAID, PENDING, EXPIRED).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-stone-700" />
                    <span>D. Data Teknis & Akses Perangkat</span>
                  </h3>
                  <ul className="space-y-1 list-disc list-inside text-gray-700">
                    <li>Alamat IP (Internet Protocol) untuk audit keamanan dan pencegahan spam.</li>
                    <li>Informasi jenis peramban (browser) dan resolusi layar (optimasi mobile/tablet).</li>
                    <li>Token sesi dan keranjang belanja sementara yang disimpan pada Local Storage.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4: Tujuan Pengolahan Data */}
            <section id="tujuan-pengolahan" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">4. Tujuan Pengolahan Data Pribadi</h2>
              </div>
              <p>Kami mengolah data pribadi semata-mata untuk tujuan yang sah dan transparan:</p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li><strong>Memproses Pesanan Meja Secara Real-Time:</strong> Meneruskan pesanan pelanggan meja ke monitor Kasir, monitor Dapur (KDS), dan monitor Pelayan.</li>
                <li><strong>Penyelesaian Pembayaran & Rekonsiliasi Kas:</strong> Memvalidasi pembayaran tunai di kasir atau pembayaran QRIS otomatis melalui Xendit.</li>
                <li><strong>Pencetakan Bukti Transaksi (Thermal Receipt):</strong> Mencetak struk fisik atau menampilkan e-receipt bagi pelanggan.</li>
                <li><strong>Laporan Keuangan & Manajemen Bisnis:</strong> Menyajikan data omzet, laba kotor, laba bersih, serta rekonsiliasi kas shift kasir bagi pemilik kafe.</li>
                <li><strong>Panggilan Pelayan & Permintaan Bill:</strong> Memfasilitasi fitur panggil pelayan meja (alat makan tambahan, minta bill) dari meja pelanggan.</li>
                <li><strong>Audit Keamanan & Kepatuhan Hukum:</strong> Mencegah transaksi manipulatif, penipuan online, dan memenuhi kewajiban pembukuan perpajakan Indonesia.</li>
              </ol>
            </section>

            {/* Section 5: Transaksi & Keamanan Pembayaran */}
            <section id="pembayaran-keamanan" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">5. Transaksi & Keamanan Pembayaran</h2>
              </div>
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2 text-xs sm:text-sm text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Jaminan Keamanan Informasi Finansial:</span>
                </div>
                <p>
                  Platform Cafe POS <strong>TIDAK PERNAH</strong> mencatat, menyimpan, atau memiliki akses terhadap nomor kartu kredit/debit, nomor CVV/CVC, maupun PIN perbankan pelanggan.
                </p>
                <p>
                  Seluruh pemrosesan pembayaran elektronik (QRIS, E-Wallet, Virtual Account) dilakukan melalui integrasi aman API Payment Gateway <strong>Xendit (PT Sinar Digital Terdepan)</strong> yang telah mengantongi izin resmi dari <strong>Bank Indonesia</strong> dan tersertifikasi <strong>PCI-DSS Level 1 (Payment Card Industry Data Security Standard)</strong>.
                </p>
              </div>
            </section>

            {/* Section 6: Penyimpanan & Perlindungan Data */}
            <section id="penyimpanan-keamanan" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Server className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">6. Penyimpanan & Perlindungan Data</h2>
              </div>
              <p>Kami menerapkan langkah-langkah pengamanan teknis dan organisasional tingkat tinggi:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>Enkripsi Transportasi Data (SSL/TLS):</strong> Seluruh komunikasi data antara browser pengguna, aplikasi kasir, dan server dienkripsi menggunakan protokol HTTPS dengan sertifikat SSL 256-bit standar industri.</li>
                <li><strong>Enkripsi Password & Kredensial:</strong> Kata sandi akun staf dan pemilik dienkripsi satu arah dengan algoritma hashing bcrypt yang aman.</li>
                <li><strong>Kontrol Akses Berjenjang (Role-Based Access):</strong> Karyawan dapur hanya dapat melihat pesanan memasak; pelayan hanya melihat pesanan siap antar; kasir mengelola pembayaran & shift; hanya pemilik/admin yang dapat mengakses laporan laba bersih.</li>
                <li><strong>Isolasi Multi-Tenant:</strong> Setiap kafe memiliki ruang data terisolasi berdasarkan <code>tenantId</code>, mencegah kebocoran data antar pemilik usaha.</li>
                <li><strong>Pencadangan Data Berkala (Backups):</strong> Database transaksi dicadangkan secara teratur untuk menjaga integritas data terhadap kegagalan perangkat keras.</li>
              </ul>
            </section>

            {/* Section 7: Pembagian Data ke Pihak Ketiga */}
            <section id="pembagian-pihak-ketiga" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Building className="w-5 h-5 text-stone-600" />
                <h2 className="text-lg font-bold text-gray-900">7. Pembagian Data ke Pihak Ketiga</h2>
              </div>
              <p>
                Kami <strong>tidak pernah memperjualbelikan</strong> data pribadi pengguna kepada pihak manapun. Data hanya dapat dibagikan kepada pihak ketiga dalam kondisi terbatas berikut:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>Mitra Kafe / Merchant yang Anda Pesan:</strong> Data pesanan dan nama Anda diteruskan ke kafe tempat Anda memesan agar pesanan dapat disiapkan dan diantarkan.</li>
                <li><strong>Penyedia Payment Gateway (Xendit):</strong> Untuk keperluan verifikasi pembayaran online QRIS yang Anda bayar.</li>
                <li><strong>Penyedia Server Cloud Hosting / VPS:</strong> Infrastruktur komputasi tempat data tersimpan secara aman dengan perjanjian kerahasiaan ketat.</li>
                <li><strong>Kepatuhan Hukum yang Sah:</strong> Jika diwajibkan oleh perintah pengadilan, kepolisian, atau instansi penegak hukum resmi berdasarkan peraturan perundang-undangan Republik Indonesia.</li>
              </ul>
            </section>

            {/* Section 8: Hak-Hak Subjek Data */}
            <section id="hak-pengguna" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">8. Hak-Hak Anda sebagai Subjek Data</h2>
              </div>
              <p>
                Sesuai ketentuan UU Pelindungan Data Pribadi No. 27 Tahun 2022, Anda berhak untuk:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <span className="font-bold text-gray-900 block">1. Hak Akses & Informasi</span>
                  <span>Mengetahui data apa saja yang kami simpan mengenai akun atau transaksi Anda.</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <span className="font-bold text-gray-900 block">2. Hak Koreksi Data</span>
                  <span>Memperbarui atau memperbaiki informasi profil akun kafe atau data Anda yang tidak akurat.</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <span className="font-bold text-gray-900 block">3. Hak Penghapusan Data</span>
                  <span>Meminta penonaktifan akun staf atau penghapusan data pribadi yang tidak lagi memiliki dasar hukum retensi.</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <span className="font-bold text-gray-900 block">4. Hak Menarik Persetujuan</span>
                  <span>Mencabut persetujuan pemrosesan data pribadi dengan menghubungi kontak resmi kami.</span>
                </div>
              </div>
            </section>

            {/* Section 9: Retensi Data */}
            <section id="retensi-data" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Database className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">9. Kebijakan Retensi Data</h2>
              </div>
              <p>
                Data transaksi keuangan dan riwayat pesanan disimpan selama masa aktif operasional kafe serta masa retensi minimum yang disyaratkan oleh ketentuan hukum perpajakan dan akuntansi di Indonesia (umumnya 5 hingga 10 tahun).
                Data sesi pemesanan sementara di keranjang pelanggan akan kedaluwarsa secara otomatis setelah sesi meja ditutup.
              </p>
            </section>

            {/* Section 10: Cookie & Local Storage */}
            <section id="cookies-storage" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">10. Penggunaan Cookie & Local Storage</h2>
              </div>
              <p>
                Aplikasi kami menggunakan teknologi <em>Local Storage</em> dan <em>Cookies</em> peramban untuk fungsi-fungsi berikut:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Menyimpan token otentikasi login kasir dan staf agar tidak logout berulang saat aplikasi berjalan.</li>
                <li>Menyimpan pilihan menu sementara di keranjang belanja pelanggan saat memilih varian & topping makanan.</li>
                <li>Menyimpan preferensi suara notifikasi lonceng pesanan dapur dan panggilan meja.</li>
              </ul>
              <p className="text-xs text-gray-500">
                Kami tidak menggunakan cookie pihak ketiga untuk pelacakan iklan invasif (tracking cross-site ads).
              </p>
            </section>

            {/* Section 11: Perubahan Kebijakan */}
            <section id="perubahan-kebijakan" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">11. Perubahan Kebijakan Privasi</h2>
              </div>
              <p>
                Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu untuk menyesuaikan perkembangan teknologi, penambahan fitur layanan, maupun regulasi terbaru.
                Setiap revisi akan disertai tanggal pembaruan di bagian atas halaman ini. Dengan terus menggunakan platform Cafe POS setelah perubahan dipublikasikan, Anda dianggap menyetujui ketentuan yang diperbarui.
              </p>
            </section>

            {/* Section 12: Kontak & Pengaduan */}
            <section id="kontak-layanan" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Mail className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">12. Informasi Kontak & Layanan Pengaduan</h2>
              </div>
              <p>
                Apabila Anda memiliki pertanyaan, keberatan, permohonan hak subjek data, atau pengaduan terkait perlindungan data pribadi, silakan menghubungi Tim Petugas Perlindungan Data (Data Protection Officer) kami:
              </p>

              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5 text-xs sm:text-sm text-stone-800">
                <div className="font-bold text-base text-gray-900">PT ADNAN BERKAH SEJAHTERA</div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Indonesia • Kantor Operasional & Manajemen Teknologi Cafe POS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Email Bantuan Privasi: </span>
                  <a href="mailto:privacy@adnanberkah.com" className="font-semibold text-amber-800 hover:underline">
                    privacy@adnanberkah.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Email Dukungan Operasional: </span>
                  <a href="mailto:agusrahadi1@gmail.com" className="font-semibold text-amber-800 hover:underline">
                    agusrahadi1@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Informasi Pemesanan: </span>
                  <a
                    href="https://wa.me/6285139139864?text=Halo%20Admin%20CafePOS%2C%20saya%20ingin%20informasi%20pemesanan"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-800 hover:underline"
                  >
                    WA 085139139864
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Layanan Bantuan Mitra Kafe & Resto</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

