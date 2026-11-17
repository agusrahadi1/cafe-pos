---
name: ui-ux-pro-max
description: >-
  Standardisasi desain antarmuka (UI) dan pengalaman pengguna (UX) tingkat komersial SaaS kelas dunia.
  Gunakan skill ini ketika merancang, membangun, mengaudit, atau memperbarui komponen frontend, landing page,
  dashboard, form, modal, atau navigasi mobile pada sistem F&B / POS Cafe POS.
---

# UI-UX PRO MAX — PREMIUM SAAS DESIGN & ENGINEERING SPECIFICATION

Panduan resmi standar rekayasa antarmuka (UI) dan pengalaman pengguna (UX) untuk seluruh modul ekosistem **Cafe POS** (POS Kasir, Meja QR Ordering Pelanggan, KDS Dapur, Pelayan, dan Dashboard Manajemen Admin).

---

## 1. Filosofi Produk: "Bespoke Commercial SaaS"

Setiap halaman dan komponen harus terasa seperti produk komersial siap jual (setara standar **Linear, Stripe, Shopify POS, Vercel, dan Apple HIG**):
- **Bukan Template AI Generik**: Hindari layout monoton berisi kartu bersarang tanpa tujuan.
- **Konsistensi Visual Brand**: Menggunakan palet hangat kafe modern (Amber, Orange, Emerald untuk finansial/lunas, Neutral Stone untuk permukaan).
- **Zero Visual Noise**: Hindari gradasi berlebihan, border bertumpuk, atau shadow hitam pekat.

---

## 2. Token Desain & Sistem Visual (Design Tokens)

### A. Palet Warna Semantik (Semantic Colors)
- **Brand Primary**: Amber-600 (`#d97706`) ke Orange-600 (`#ea580c`) — hangat, ramah, menggugah selera.
- **Surface & Background**: `stone-50` (`#fafaf9`), `stone-100/80`, putih bersih (`#ffffff`) dengan `backdrop-blur-md` lembut.
- **Border**: Lembut dan tegas: `border-stone-200/80` atau `border-amber-200/60`.
- **Status Transaksi & F&B**:
  - 🟢 **Success / Lunas / Online**: Emerald-600 (`#059669`) dengan background `bg-emerald-50` dan border `emerald-200`.
  - 🟡 **Pending / Menunggu Pembayaran**: Amber-500 (`#f59e0b`) dengan background `bg-amber-50`.
  - 🔵 **Proses Dapur / Cooking**: Blue-600 (`#2563eb`) dengan background `bg-blue-50`.
  - 🟣 **Siap Disajikan / Ready**: Purple-600 (`#9333ea`) dengan background `bg-purple-50`.
  - 🔴 **Batal / Darurat / Mute**: Red-600 (`#dc2626`) dengan background `bg-red-50`.

### B. Tipografi & Hierarki Teks
- **Display / Heading**: Font tebal tegas (`font-extrabold` / `font-black`) dengan letter-spacing rapat (`tracking-tight`).
- **Angka Finansial & Jam**: Wajib menggunakan font monospaced angka (`tabular-nums font-mono` atau `tabular-nums font-bold`) agar tidak bergeser saat nilai berubah.
- **Micro-copy & Badge**: Huruf kapital tegas (`uppercase tracking-wider font-extrabold text-[9px]` atau `text-[10px]`).

### C. Elevasi & Bayangan (Shadows)
Gunakan bayangan modern berlapis tipis (*diffused micro-shadows*):
- Elemen interaktif normal: `shadow-2xs` atau `shadow-xs`.
- Elemen mengambang / dropdown / modal: `shadow-xl` atau `shadow-2xl` dengan border halus.
- Hindari shadow hitam pekat `shadow-2xl` tanpa border.

---

## 3. Ergonomi Mobile & Standar Layar Sentuh (Mobile-First POS)

1. **Touch Target Size**:
   - Area sentuh tombol minimal **44x44px** (atau minimal 40x40px pada micro-pill) untuk mencegah salah sentuh (*fat finger*).
2. **Thumb Zone Architecture**:
   - Letakkan aksi primer (Bayar, Konfirmasi Pesanan, Cetak) di bagian bawah layar HP agar mudah dijangkau satu tangan.
3. **Drawer vs Modal**:
   - Pada layar HP (< 640px), ubah modal popup kaku menjadi *Bottom Sheet* atau *Slide-over Drawer* dari samping/bawah.
4. **Header Anti-Overflow**:
   - Terapkan pemotongan teks otomatis (`truncate`) pada nama outlet.
   - Sembunyikan elemen utilitas sekunder di balik menu titik tiga (`•••`) atau Popover profil agar tombol Hamburger navigasi utama tidak terdorong keluar layar.

---

## 4. Matriks Status Lengkap (Complete State Matrix)

Setiap komponen data-driven wajib menangani 5 kondisi berikut tanpa kecuali:

1. **Loading State**:
   - Wajib menggunakan **Shimmer Skeleton** (`animate-pulse bg-stone-200/80 rounded-xl`) yang mempertahankan proporsi layout asli.
   - Dilarang hanya menampilkan layar putih kosong atau spinner berputar di tengah tanpa struktur.
2. **Empty State**:
   - Ikon tematik elegan (misal: `Coffee`, `ShoppingBag`, `Receipt`).
   - Judul & penjelasan singkat yang ramah.
   - Tombol Call-to-Action (CTA) primer untuk langsung membuat data baru.
3. **Error State**:
   - Pesan ramah pengguna (bukan error stack trace mentah).
   - Tombol aksi **Coba Lagi (Retry)** tanpa harus me-refresh seluruh halaman.
4. **Success State**:
   - Feedback visual instan (animasi checkmark hijau, badge lunas, confetti halus pada checkout).
5. **Disabled State**:
   - Opacity transparan (`opacity-50 cursor-not-allowed`).
   - Tooltip atau teks penjelasan kenapa tombol terkunci (misal: "Shift belum dibuka").

---

## 5. Micro-Interactions & Sensory Feedback

- **Tactile Active Press**: Setiap tombol interaktif wajib memiliki feedback tekan:
  `active:scale-95 transition-all duration-100 ease-out cursor-pointer`
- **Hover Transitions**: `hover:bg-stone-100 hover:text-stone-900 transition-colors`
- **Feedback Suara / Haptic**:
  - Panggilan waiter / pesanan masuk memicu audio chime terisolasi.
  - Cetak struk Bluetooth memicu konfirmasi dialog non-blocking.
- **Optimistic UI**:
  - Saat kasir menekan "Selesaikan Pesanan", kartu pesanan langsung bergerak seketika ke tab "Selesai", sementara sinkronisasi API berjalan di background dengan mekanisme rollback jika gagal.

---

## 6. Checklist Verifikasi UI-UX Sebelum Rilis (Pre-flight Checklist)

Sebelum menyatakan suatu halaman atau komponen selesai:
- [ ] Apakah halaman responsif di viewport HP: **320px, 360px, 375px, 390px, 430px**?
- [ ] Apakah tidak ada overflow horizontal liar (*horizontal scrollbars*)?
- [ ] Apakah tombol utama dapat dijangkau jempol dengan mudah di HP?
- [ ] Apakah format mata uang Rupiah menggunakan format rapi (contoh: `Rp 25.000`) dengan `tabular-nums`?
- [ ] Apakah state Loading, Empty, dan Error sudah tertangani dengan rapi?
- [ ] Apakah kontras warna teks dan background memenuhi standar aksesibilitas WCAG AA?
