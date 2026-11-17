const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 20 Kafe Potensial di Bondowoso
const cafesBondowoso = [
  {
    no: 1,
    kota: "Bondowoso",
    nama: "Anaga Coffee Space",
    kawasan: "Dabasah (Dekat Alun-Alun)",
    alamat: "Jl. Letnan Sudiono No.20, Kali Nangkaan, Dabasah, Bondowoso 68211",
    telepon: "+62 821-1172-9261",
    jamBuka: "09.30 – 23.00 WIB",
    tipe: "Industrial Modern Cafe & Space Nugas",
    kapasitas: "Sedang-Besar (80 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Table Ordering, Split Bill Mahasiswa/Pelajar, QRIS Dinamis",
    alasanProspek: "Titik kumpul utama anak muda Bondowoso. Sering penuh saat sore-malam. QR ordering mencegah antrean kasir.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Anaga+Coffee+Space+Bondowoso"
  },
  {
    no: 2,
    kota: "Bondowoso",
    nama: "Container Cafe Laki-Laki",
    kawasan: "Tamansari (Tengah Kota)",
    alamat: "Jl. Pelita No.9, Tamansari Indah, Tamansari, Bondowoso 68216",
    telepon: "+62 812-3488-9911",
    jamBuka: "08.00 – 23.00 WIB (Jumat: 15.00 – 23.00)",
    tipe: "Industrial Container Cafe & Rooftop View",
    kapasitas: "Besar (100+ orang, 2 lantai rooftop)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Meja Rooftop, Cetak Struk Dapur Bluetooth, KDS",
    alasanProspek: "Konsep 2 lantai kontainer dan rooftop. Pelayan kesulitan mondar-mandir naik tangga kontainer hanya untuk mencatat pesanan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Container+Cafe+Laki+Laki+Bondowoso"
  },
  {
    no: 3,
    kota: "Bondowoso",
    nama: "DRK Cafe N Resto",
    kawasan: "Blindungan (Pusat Pemerintahan)",
    alamat: "Jl. RBA Ki Ronggo No.777b, Purbosari, Blindungan, Bondowoso 68211",
    telepon: "+62 813-3651-4777",
    jamBuka: "10.00 – 23.00 WIB (Sabtu s/d 23.45)",
    tipe: "Family Resto, Live Music & Cafe Luas",
    kapasitas: "Sangat Besar (150+ orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "POS Multi-kasir, Split Printer Kitchen & Bar, Invoicing Dinas",
    alasanProspek: "Resto kafe keluarga besar langganan dinas dan instansi. Butuh cetak nota resmi dan pemisahan antrean makanan berat vs minuman.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=DRK+Cafe+N+Resto+Bondowoso"
  },
  {
    no: 4,
    kota: "Bondowoso",
    nama: "Orilla Cafe & Resto",
    kawasan: "Nangkaan (View Persawahan)",
    alamat: "Sumbergudeg, Nangkaan, Kec. Bondowoso, Bondowoso 68215",
    telepon: "+62 812-3344-5566",
    jamBuka: "09.00 – 22.00 WIB",
    tipe: "Multi-level Garden Cafe & Nature View",
    kapasitas: "Besar (120+ orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Code Meja Outdoor Taman Belakang, Reservasi Acara",
    alasanProspek: "Area taman belakang berterasering menghadap sawah dan pegunungan. Tamu di taman belakang sulit terpantau kasir.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Orilla+Cafe+Resto+Nangkaan+Bondowoso"
  },
  {
    no: 5,
    kota: "Bondowoso",
    nama: "DOPOTA Cafe & Donuts (Donken)",
    kawasan: "Badean (Pusat Kuliner)",
    alamat: "Jl. M.T. Haryono No.44, Badean, Bondowoso 68214",
    telepon: "+62 812-3456-0133",
    jamBuka: "07.00 – 21.00 WIB",
    tipe: "Bakery, Donut Cafe & Mini Theater Space",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Real-time Donut & Pastry Stock, Fast POS Takeaway",
    alasanProspek: "Banyak pembelian donat takeaway dikombinasi dine-in kopi. Manajemen stok pastry langsung habis (auto sold-out) di sistem POS.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=DOPOTA+Cafe+Donuts+Badean+Bondowoso"
  },
  {
    no: 6,
    kota: "Bondowoso",
    nama: "Phikopi Specialty Coffee",
    kawasan: "Kotakulon (Jl. Diponegoro)",
    alamat: "Jl. Diponegoro, Pattian, Kotakulon, Bondowoso 68219",
    telepon: "+62 812-3322-1100",
    jamBuka: "09.00 – 23.00 WIB",
    tipe: "Specialty Coffee Java Ijen-Raung & Roastery",
    kapasitas: "Sedang (50 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "Inventori Biji Kopi Gramasi, Menu Artisan Single Origin",
    alasanProspek: "Barista artisan yang fokus kopi Ijen-Raung. Sistem POS yang bisa mencatat stok green bean dan roasted bean sangat membantu.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Phikopi+Specialty+Coffee+Bondowoso"
  },
  {
    no: 7,
    kota: "Bondowoso",
    nama: "PhotoKopi Coffee House",
    kawasan: "Kotakulon (Jl. Diponegoro)",
    alamat: "Jl. Diponegoro No.88, Kotakulon, Bondowoso 68219",
    telepon: "+62 822-4567-8901",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Traditional Javanese Wooden House Cafe",
    kapasitas: "Sedang-Besar (70 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Order Meja Saung Kayu, Nota WhatsApp Pelanggan",
    alasanProspek: "Nuansa rumah joglo kayu dengan sekat ruang. Tamu menyukai privasi dan memesan santai via smartphone.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=PhotoKopi+Coffee+House+Bondowoso"
  },
  {
    no: 8,
    kota: "Bondowoso",
    nama: "Cafe Tjap Daoen",
    kawasan: "Kotakulon (Jl. Diponegoro)",
    alamat: "Jl. Diponegoro No.45, Purbosari, Kotakulon, Bondowoso 68219",
    telepon: "+62 813-3611-2233",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Vintage-Modern Aesthetic Hangout Cafe",
    kapasitas: "Sedang (65 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Menu Digital Interaktif dengan Visual Foto Menarik",
    alasanProspek: "Spot nongkrong instagramable dengan menu minuman kreasi yang bervariasi. Butuh display menu digital berkualitas tinggi.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+Tjap+Daoen+Bondowoso"
  },
  {
    no: 9,
    kota: "Bondowoso",
    nama: "Conato Cafe & Bakery Bondowoso",
    kawasan: "Kotakulon (Jl. Diponegoro)",
    alamat: "Jl. Diponegoro No.12, Kotakulon, Bondowoso 68219",
    telepon: "+62 332-421111",
    jamBuka: "06.30 – 22.00 WIB",
    tipe: "Modern Bakery Cafe & Lounge Santai",
    kapasitas: "Besar (80 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Barcode Scanner Roti, POS Terintegrasi Pembayaran Cashless",
    alasanProspek: "Volume transaksi roti dan minuman tinggi sejak pagi. Butuh kasir kilat dengan struk instan dan rekap shift akurat.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Conato+Cafe+Bakery+Bondowoso"
  },
  {
    no: 10,
    kota: "Bondowoso",
    nama: "Tomoro Coffee (Alun-Alun Bondowoso)",
    kawasan: "Dabasah (Alun-Alun Ki Ronggo)",
    alamat: "Jl. Letnan Karsono, Dabasah (Area Alun-Alun), Bondowoso 68211",
    telepon: "+62 812-9988-7711",
    jamBuka: "07.00 – 22.00 WIB",
    tipe: "Modern Tech-Enabled Grab & Go Coffee",
    kapasitas: "Sedang (40 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "Display Antrean Layar TV Kasir, Integrasi Pesan Digital",
    alasanProspek: "Lokasi persis di titik sentral keramaian Alun-Alun Ki Ronggo. Benchmark sistem teknologi pesanan untuk kafe lokal sekitarnya.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Tomoro+Coffee+Alun+Alun+Bondowoso"
  },
  {
    no: 11,
    kota: "Bondowoso",
    nama: "Galeri Kopi Bondowoso (Becoff)",
    kawasan: "Badean (Lumbung)",
    alamat: "Lumbung, Badean, Kec. Bondowoso, Bondowoso 68214",
    telepon: "+62 811-356-789",
    jamBuka: "09.00 – 22.00 WIB",
    tipe: "Heritage Coffee Edu-Center & Gallery Cafe",
    kapasitas: "Sedang-Besar (75 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "Katalog Biji Kopi Asli Ijen-Raung, POS Penjualan Produk Retail",
    alasanProspek: "Pusat oleh-oleh dan edukasi kopi khas Bondowoso. Perlu sistem kasir yang mendukung penjualan minuman kafe + packaging biji kopi.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Galeri+Kopi+Bondowoso+Becoff"
  },
  {
    no: 12,
    kota: "Bondowoso",
    nama: "Sky Cafe Kabare (Ijen/Sempol)",
    kawasan: "Kecamatan Ijen (Dataran Tinggi Sempol)",
    alamat: "Kawasan Wisata Kawah Ijen, Sempol, Kec. Ijen, Bondowoso 68288",
    telepon: "+62 812-3456-7811",
    jamBuka: "06.00 – 21.00 WIB",
    tipe: "Scenic Clifftop Mountain Cafe (Atas Awan)",
    kapasitas: "Besar (90 orang, view lembah)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "Offline-first Local POS, QR Meja Spot Foto Pegunungan",
    alasanProspek: "Destinasi wisatawan mancanegara & domestik sebelum naik ke Kawah Ijen. Butuh sistem pembayaran cepat dan QR meja di area view balkon.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sky+Cafe+Kabare+Ijen+Bondowoso"
  },
  {
    no: 13,
    kota: "Bondowoso",
    nama: "Kampung Kopi Kluncing (Sumber Wringin)",
    kawasan: "Sumber Wringin (Lereng Gunung Raung)",
    alamat: "Desa Kluncing, Sukorejo, Kec. Sumber Wringin, Bondowoso 68287",
    telepon: "+62 852-3678-9911",
    jamBuka: "08.00 – 20.00 WIB",
    tipe: "Eco-Coffee Tourism & Perkebunan Rakyat",
    kapasitas: "Besar (100 orang di kebun kopi)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "POS Cloud Multi-Outlet, Tiket Reservasi Tur Kebun Kopi",
    alasanProspek: "Kawasan Ijen Geopark. Membutuhkan sistem pencatatan kunjungan turis, pembelian paket seduh kopi, dan penjualan merchandise.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kampung+Kopi+Kluncing+Bondowoso"
  },
  {
    no: 14,
    kota: "Bondowoso",
    nama: "Warkop Mbah Djie",
    kawasan: "Dabasah (Mangunsarkoro)",
    alamat: "Jl. KIS Mangunsarkoro, Kali Nangkaan, Dabasah, Bondowoso 68211",
    telepon: "+62 852-3456-7890",
    jamBuka: "07.00 – 00.00 WIB",
    tipe: "Modern Warkop & Tempat Kongkow Komunitas",
    kapasitas: "Sedang-Besar (70 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Kasir Layar HP Android Ringan, Struk Bluetooth Thermal",
    alasanProspek: "Perputaran pesanan kopi tubruk dan gorengan sangat cepat. Kasir butuh aplikasi kasir tanpa biaya sewa alat yang mahal.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Warkop+Mbah+Djie+Bondowoso"
  },
  {
    no: 15,
    kota: "Bondowoso",
    nama: "Cafe Kopi Tuan",
    kawasan: "Badean (Dr. Sutomo)",
    alamat: "Jl. Dr. Sutomo No.3, Lumbung, Badean, Bondowoso 68214",
    telepon: "+62 852-3111-2233",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Cozy Vintage Coffeehouse & Workspace",
    kapasitas: "Sedang (50 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Order Meja Tamu WFC, Laporan Shift Kasir",
    alasanProspek: "Tempat tenang favorit pekerja remote dan mahasiswa mengerjakan tugas. QR di meja sangat mendukung re-order kopi.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+Kopi+Tuan+Badean+Bondowoso"
  },
  {
    no: 16,
    kota: "Bondowoso",
    nama: "Nyok Kafe Bondowoso",
    kawasan: "Tamansari / Dabasah",
    alamat: "Jl. PB Sudirman No.30, Dabasah, Bondowoso 68211",
    telepon: "+62 823-3112-4400",
    jamBuka: "16.00 – 23.30 WIB",
    tipe: "Outdoor Night Hangout Cafe & Street View",
    kapasitas: "Besar (80 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Table Ordering Malam Hari, Cetak Struk Barista Cepat",
    alasanProspek: "Ramai dikunjungi pemuda saat malam hari. Pesanan menumpuk di meja kasir depan, butuh solusi self-order QR.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Nyok+Kafe+Bondowoso"
  },
  {
    no: 17,
    kota: "Bondowoso",
    nama: "N'joy The Cafe",
    kawasan: "Kotakulon (Purbosari)",
    alamat: "Jl. Diponegoro No.99, Kotakulon, Bondowoso 68219",
    telepon: "+62 813-5888-9900",
    jamBuka: "11.00 – 22.30 WIB",
    tipe: "Art & Mural 3D Thematic Cafe",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "Menu Digital Visual Foto, Split Bill Rombongan Keluarga",
    alasanProspek: "Spot foto keluarga dan remaja dengan mural 3D. Butuh sistem pemesanan yang estetik dan nota transparan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Njoy+The+Cafe+Bondowoso"
  },
  {
    no: 18,
    kota: "Bondowoso",
    nama: "Belikopi. Bondowoso",
    kawasan: "Kotakulon (Diponegoro)",
    alamat: "Jl. Diponegoro No.14, Purbosari, Kotakulon, Bondowoso 68219",
    telepon: "+62 812-3456-1234",
    jamBuka: "08.00 – 22.00 WIB",
    tipe: "Grab & Go Affordable Coffee & Toast Shop",
    kapasitas: "Sedang (45 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "Kasir POS Kilat (Sub-10 Detik), QRIS Terintegrasi",
    alasanProspek: "Trafik pemesanan cepat take-away dan dine-in toast. Sangat cocok dengan menu bundling combo CafePOS.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Belikopi+Diponegoro+Bondowoso"
  },
  {
    no: 19,
    kota: "Bondowoso",
    nama: "7 Sekawan Coffee Space",
    kawasan: "Blindungan",
    alamat: "Jl. Blindungan Raya No.17, Blindungan, Bondowoso 68211",
    telepon: "+62 823-3322-1155",
    jamBuka: "13.00 – 00.00 WIB",
    tipe: "Community Gathering & Acoustic Coffee Space",
    kapasitas: "Sedang-Besar (70 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Order Meja Komunitas, Laporan Tutup Shift Kasir",
    alasanProspek: "Sering menjadi tempat kumpul komunitas otomotif dan musik. Pesanan massal sering membuat kasir manual bingung.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=7+Sekawan+Blindungan+Bondowoso"
  },
  {
    no: 20,
    kota: "Bondowoso",
    nama: "Kedai BAB (Bukan Angkringan Biasa)",
    kawasan: "Badean (Jl. Katamso)",
    alamat: "Jl. Brigpol Sudarlan / Jl. Katamso, Badean, Bondowoso 68214",
    telepon: "+62 857-4567-8900",
    jamBuka: "16.00 – 01.00 WIB",
    tipe: "Modern Angkringan & Kopi Arang / Rempah",
    kapasitas: "Besar (80 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Menu Sate-Satean & Minuman Tradisional di POS, Kasir HP",
    alasanProspek: "Banyak pilihan item tusukan/satean dengan harga satuan. Menu kasir layar sentuh CafePOS mempermudah hitung total nota.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kedai+BAB+Badean+Bondowoso"
  }
];

// 20 Kafe Potensial di Situbondo
const cafesSitubondo = [
  {
    no: 1,
    kota: "Situbondo",
    nama: "Békna Bakery & Cafe",
    kawasan: "Patokan (Situbondo Kota)",
    alamat: "Jl. WR. Supratman No.08, Mulyautama, Patokan, Situbondo 68312",
    telepon: "+62 852-7775-5598",
    jamBuka: "09.00 – 22.00 WIB",
    tipe: "Artisan Bakery, Dessert & Modern Cafe",
    kapasitas: "Sedang-Besar (75 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "Stok Pastry Realtime, QR Ordering Meja, Struk WhatsApp",
    alasanProspek: "Kafe bakery paling hits di pusat Situbondo. Selalu ramai pengunjung yang ingin nongkrong santai sambil makan kue & kopi.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bekna+Bakery+Cafe+Situbondo"
  },
  {
    no: 2,
    kota: "Situbondo",
    nama: "Cafe Beach Utama Raya",
    kawasan: "Banyuglugur (Jalur Pantura Utama)",
    alamat: "Kompleks Rest Area Utama Raya, Krajan, Banyuglugur, Situbondo 68359",
    telepon: "+62 338-3890888 / +62 812-321-7788",
    jamBuka: "07.00 – 22.30 WIB",
    tipe: "Mega Beachfront Rest Area Cafe, Resto & Sunset Spot",
    kapasitas: "Mega Besar (300+ orang di tepi pantai)",
    prioritas: "Prioritas Sangat Tinggi (Mega Lead)",
    kebutuhanFitur: "QR Table Ordering Tepi Pantai, Multi-Terminal POS, Fast Cashless",
    alasanProspek: "Rest area tersibuk di Pantura Jawa Timur. Pengunjung luar kota dan wisatawan Bali bersantai di pantai. Butuh QR order di meja outdoor pantai.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+Beach+Utama+Raya+Situbondo"
  },
  {
    no: 3,
    kota: "Situbondo",
    nama: "Kafe Pote Pasir Putih",
    kawasan: "Bungatan (Wisata Pantai Pasir Putih)",
    alamat: "Kawasan Wisata Pantai Pasir Putih, Desa Kali, Bungatan, Situbondo 68358",
    telepon: "+62 813-3344-9090",
    jamBuka: "08.00 – 23.00 WIB",
    tipe: "White-Sand Seaside Cafe & Biliard Lounge",
    kapasitas: "Besar (150+ orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Order Meja Pinggir Pantai, Billing Rental Meja Biliar, QRIS",
    alasanProspek: "Lokasi langsung di bibir pantai Pasir Putih. Tamu duduk santai menikmati ombak. QR ordering memudahkan mereka pesan tanpa beranjak.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kafe+Pote+Pantai+Pasir+Putih+Situbondo"
  },
  {
    no: 4,
    kota: "Situbondo",
    nama: "Lokale Coffee Concept",
    kawasan: "Panarukan (Sumber Kolak)",
    alamat: "Jl. Tembus Baru, Paerayaan Utara, Sumber Kolak, Panarukan, Situbondo 68351",
    telepon: "+62 881-9132-296",
    jamBuka: "09.00 – 23.00 WIB",
    tipe: "Unfinished Industrial Aesthetic & Specialty Coffee",
    kapasitas: "Besar (90 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Order Meja, Kitchen Display System, Laporan Omzet HP",
    alasanProspek: "Tempat favorit Gen-Z dan mahasiswa Situbondo. Desain industrial estetik sangat cocok dipadukan dengan menu digital QR modern.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Lokale+Concept+Sumber+Kolak+Situbondo"
  },
  {
    no: 5,
    kota: "Situbondo",
    nama: "Mongopi Cafe, Coffee and Food",
    kawasan: "Situbondo Kota (Permata Green Hill)",
    alamat: "Perum Permata Green Hill Blok D3-01, Dawuhan, Situbondo 68311",
    telepon: "+62 895-3771-78358",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Minimalist Modern Coffee & Food Hub (Pasta/Rice Bowl)",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Order Meja QR, Cetak Struk Dapur Makanan Berat",
    alasanProspek: "Menu makanan bervariasi (rice bowl, snack, mocktail). Membutuhkan sistem yang membagi pesanan dapur dan bar otomatis.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mongopi+Cafe+Green+Hill+Situbondo"
  },
  {
    no: 6,
    kota: "Situbondo",
    nama: "Ruang Coffee Situbondo",
    kawasan: "Patokan (Jl. Kenanga)",
    alamat: "Jl. Kenanga, Mulyautama, Patokan, Situbondo 68312",
    telepon: "+62 853-3187-8813",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Aesthetic Sunset Coffee Space & Outdoor Backyard",
    kapasitas: "Sedang-Besar (70 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Self-Order Meja Senja, QRIS Payment Gateway",
    alasanProspek: "Spot nongkrong senja favorit. Pengunjung menyebar di halaman belakang. QR di meja mempermudah pesanan kopi ronde berikutnya.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Ruang+Coffee+Situbondo+Kenanga"
  },
  {
    no: 7,
    kota: "Situbondo",
    nama: "Al Cafe Situbondo",
    kawasan: "Panarukan (Alas Malang)",
    alamat: "Jl. Anggrek No.126, Area Sawah, Alas Malang, Panarukan, Situbondo 68351",
    telepon: "+62 812-4988-3322",
    jamBuka: "08.30 – 23.00 WIB",
    tipe: "Paddy Field View Resto, Cafe & Live Music",
    kapasitas: "Besar (120+ orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Gazebo Tengah Sawah, Multi-Printer Kitchen",
    alasanProspek: "Banyak saung gazebo di tengah pemandangan sawah. Pelayan kewalahan jalan jauh ke gazebo, QR order memecahkan masalah ini.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Al+Cafe+Alas+Malang+Panarukan+Situbondo"
  },
  {
    no: 8,
    kota: "Situbondo",
    nama: "Conato Bakery & Cafe Situbondo",
    kawasan: "Panji (Jl. Basuki Rahmat)",
    alamat: "Jl. Basuki Rahmat, Mimbaan Utara, Mimbaan, Panji, Situbondo 68323",
    telepon: "+62 338-672888",
    jamBuka: "06.00 – 22.00 WIB",
    tipe: "Premium Bakery Cafe & Meeting Lounge",
    kapasitas: "Besar (80 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "POS Kasir Multi-Kategori Roti & Cafe, Struk Pajak",
    alasanProspek: "Pusat roti dan kopi berkelas di gerbang timur kota. Butuh kasir yang cepat melayani rombongan keluarga dan rapat instansi.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Conato+Bakery+Cafe+Panji+Situbondo"
  },
  {
    no: 9,
    kota: "Situbondo",
    nama: "JJ Coffee Situbondo",
    kawasan: "Dawuhan (Jl. A. Yani)",
    alamat: "Jl. Achmad Yani No.48, Palraman, Dawuhan, Situbondo 68311",
    telepon: "+62 813-3399-4455",
    jamBuka: "09.00 – 23.30 WIB",
    tipe: "Central Town Coffeehouse & WFC Co-working",
    kapasitas: "Sedang-Besar (70 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Order Meja Tamu Laptop, Split Bill Kasir",
    alasanProspek: "Lokasi tepat di jalur protokol utama Jl. A. Yani. Banyak pekerja dan pebisnis yang singgah dan bekerja dengan laptop.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=JJ+Coffee+Jl+Ahmad+Yani+Situbondo"
  },
  {
    no: 10,
    kota: "Situbondo",
    nama: "Besuki Tempo Doeloe (BTD Cafe)",
    kawasan: "Besuki (Kota Lama)",
    alamat: "Jl. Madura No.15, Besuki Kota, Besuki, Situbondo 68372",
    telepon: "+62 852-3211-7788",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Colonial Dutch Heritage Vintage Cafe & Resto",
    kapasitas: "Besar (100 orang di bangunan peninggalan Belanda)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Meja Multi-Ruang Kolonial, Struk WhatsApp",
    alasanProspek: "Bangunan bersejarah peninggalan Belanda dengan banyak ruangan dan pilar besar. QR meja memudahkan pelayan melayani tanpa tersesat.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Besuki+Tempo+Doeloe+BTD+Cafe+Situbondo"
  },
  {
    no: 11,
    kota: "Situbondo",
    nama: "Monochrome Cafe & Burger",
    kawasan: "Situbondo Kota (Mimbaan)",
    alamat: "Jl. Anggrek / Mimbaan, Kec. Panji, Situbondo 68322",
    telepon: "+62 813-3344-7788",
    jamBuka: "11.00 – 23.00 WIB",
    tipe: "Modern Monochrome Burger, Snack & Coffee Cafe",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Custom Modifikasi Burger & Minuman di Menu QR, KDS",
    alasanProspek: "Menu artisanal burger membutuhkan pemilihan tingkat kematangan, saus tambahan, dan topping. Menu QR interaktif CafePOS sangat pas.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Monochrome+Cafe+Burger+Situbondo"
  },
  {
    no: 12,
    kota: "Situbondo",
    nama: "Surya Cafe & Seafood (Pasir Putih)",
    kawasan: "Bungatan (Pantai Pasir Putih)",
    alamat: "Jl. Raya Pasir Putih No.77, Pasir Putih, Bungatan, Situbondo 68358",
    telepon: "+62 338-390111",
    jamBuka: "08.00 – 22.00 WIB",
    tipe: "Seaside Seafood Restaurant & Coffee Lounge",
    kapasitas: "Sangat Besar (150+ orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Penimbangan Ikan Segar Terkoneksi POS, Invoicing Keluarga",
    alasanProspek: "Langganan bus pariwisata dan keluarga. Butuh sistem cetak tagihan yang jelas berdasarkan berat timbangan seafood dan minuman.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Surya+Cafe+Seafood+Pasir+Putih+Situbondo"
  },
  {
    no: 13,
    kota: "Situbondo",
    nama: "Cafe Kenangan Situbondo",
    kawasan: "Dawuhan (Jl. Seroja)",
    alamat: "Jl. Seroja No.52, Parse, Dawuhan, Situbondo 68311",
    telepon: "+62 822-4512-3344",
    jamBuka: "10.00 – 00.00 WIB",
    tipe: "Cozy Late Night Hangout Cafe",
    kapasitas: "Sedang (50 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "Shift Kasir Malam, Laporan Penjualan Real-time HP Owner",
    alasanProspek: "Buka sampai tengah malam. Pemilik ingin memantau omzet harian dari rumah tanpa harus menunggu kasir tutup toko.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+Kenangan+Seroja+Dawuhan+Situbondo"
  },
  {
    no: 14,
    kota: "Situbondo",
    nama: "D'Gading Cafe & Resto",
    kawasan: "Panji (Jl. Argopuro)",
    alamat: "Jl. Argopuro No.40, Mimbaan, Panji, Situbondo 68323",
    telepon: "+62 852-3344-9988",
    jamBuka: "10.00 – 22.30 WIB",
    tipe: "Family Garden Dining & Coffee Corner",
    kapasitas: "Besar (100 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Manajemen Meja Reservasi, Cetak Tiket Dapur",
    alasanProspek: "Sering dipakai acara ulang tahun, arisan, dan reuni. Fitur reservasi meja dan paket buffet/menu CafePOS sangat cocok.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=DGading+Cafe+Resto+Panji+Situbondo"
  },
  {
    no: 15,
    kota: "Situbondo",
    nama: "Kopi Kulo Situbondo",
    kawasan: "Situbondo Kota (Jl. Pemuda)",
    alamat: "Jl. Pemuda No.66, Dawuhan, Situbondo 68311",
    telepon: "+62 813-9011-2244",
    jamBuka: "09.00 – 22.00 WIB",
    tipe: "Contemporary Grab-and-Go & Dine-in Coffee",
    kapasitas: "Kecil-Sedang (35 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "Kasir Cepat Layar Sentuh Tablet, QRIS Instan",
    alasanProspek: "Berada di jalan kuliner Jl. Pemuda yang ramai lalu lintas. Kecepatan checkout kasir di bawah 15 detik sangat dibutuhkan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kopi+Kulo+Jl+Pemuda+Situbondo"
  },
  {
    no: 16,
    kota: "Situbondo",
    nama: "Kedai Kopi Ombak Situbondo",
    kawasan: "Panarukan (Dermaga Panarukan)",
    alamat: "Kompleks Dermaga Pelabuhan Panarukan, Kilensari, Panarukan 68351",
    telepon: "+62 821-4322-1100",
    jamBuka: "15.00 – 23.00 WIB",
    tipe: "Harbor Sunset Coffee & Sea Breeze Hangout",
    kapasitas: "Besar (80 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Order Meja Tepi Dermaga, Pembayaran Cashless QRIS",
    alasanProspek: "Spot menikmati sunset di pelabuhan bersejarah Panarukan. Meja tersebar di sepanjang pembatas laut.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kedai+Kopi+Ombak+Pelabuhan+Panarukan"
  },
  {
    no: 17,
    kota: "Situbondo",
    nama: "Kafe Kuno Situbondo",
    kawasan: "Situbondo Kota (Patokan)",
    alamat: "Jl. Diponegoro No.33, Patokan, Situbondo 68312",
    telepon: "+62 852-5899-0022",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Classic Vintage Antiques & Traditional Coffee",
    kapasitas: "Sedang (50 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "Menu Digital Klasik, Nota WhatsApp Tanpa Kertas",
    alasanProspek: "Mengusung nuansa barang antik dan kopi klasik. Pelanggan menyukai nota elektronik yang modern dan ramah lingkungan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kafe+Kuno+Patokan+Situbondo"
  },
  {
    no: 18,
    kota: "Situbondo",
    nama: "Warkop & Cafe Sudirman (Pusat Kota)",
    kawasan: "Situbondo Kota (Jl. PB Sudirman)",
    alamat: "Jl. PB Sudirman No.80, Patokan, Situbondo 68312",
    telepon: "+62 823-3144-8899",
    jamBuka: "08.00 – 00.00 WIB",
    tipe: "High-Traffic City Center Warkop Cafe",
    kapasitas: "Besar (75 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Aplikasi Kasir Android Ringan, Struk Bluetooth",
    alasanProspek: "Ramai dari pagi sampai tengah malam oleh berbagai kalangan. Kasir butuh POS yang tidak ribet dan cepat saat rekap harian.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Warkop+Cafe+Sudirman+Situbondo"
  },
  {
    no: 19,
    kota: "Situbondo",
    nama: "Point Coffee Situbondo (Jl. Pemuda Hub)",
    kawasan: "Situbondo Kota (Jl. Pemuda)",
    alamat: "Jl. Pemuda No.102, Dawuhan, Situbondo 68311",
    telepon: "+62 811-1500-280",
    jamBuka: "07.00 – 23.00 WIB",
    tipe: "Modern Convenience Coffee Bar & Seating",
    kapasitas: "Sedang (40 orang)",
    prioritas: "Prioritas Sedang",
    kebutuhanFitur: "Fast Transaction POS, Display Antrean Kasir",
    alasanProspek: "Jalur singgah kendaraan antarkota di pusat Situbondo. Kecepatan penyajian dan pencatatan transaksi kasir mutlak.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Point+Coffee+Jl+Pemuda+Situbondo"
  },
  {
    no: 20,
    kota: "Situbondo",
    nama: "Kopi Kancil Cafe & Space",
    kawasan: "Panji (Curah Jeru)",
    alamat: "Jl. Raya Curah Jeru No.21, Panji, Situbondo 68321",
    telepon: "+62 853-3456-7812",
    jamBuka: "11.00 – 23.30 WIB",
    tipe: "Open Air Creative Space & Acoustic Corner",
    kapasitas: "Besar (80 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Order Meja Terbuka, Split Bill Teman Nongkrong",
    alasanProspek: "Tempat nongkrong anak muda dengan panggung mini akustik. QR ordering di meja menghindari salah input menu saat suasana bising.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kopi+Kancil+Panji+Situbondo"
  }
];

// Gabungkan semua data
const allCafes = [
  ...cafesBondowoso.map((item, idx) => ({ ...item, noUrut: idx + 1 })),
  ...cafesSitubondo.map((item, idx) => ({ ...item, noUrut: idx + 1 }))
];

// 1. Generate SpreadsheetML XML (.xls)
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRowsXml(data) {
  let rows = `
    <Row ss:Height="28">
      <Cell ss:StyleID="Header"><Data ss:Type="String">No</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Kota / Kabupaten</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Kafe / Coffee Shop</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Kawasan / Area</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Alamat Lengkap</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Nomor Telepon / WA</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Jam Operasional</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Tipe Tempat &amp; Konsep</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Kapasitas Tempat</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Tingkat Prioritas Lead</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Fitur CafePOS Paling Dibutuhkan</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Analisis Masalah &amp; Peluang Prospek</Data></Cell>
      <Cell ss:StyleID="Header"><Data ss:Type="String">Tautan Google Maps</Data></Cell>
    </Row>`;

  data.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowStyle = isEven ? "RowEven" : "RowOdd";
    const prioStyle = item.prioritas.includes("Sangat Tinggi") ? "PrioHigh" : "PrioMed";

    rows += `
    <Row ss:Height="36">
      <Cell ss:StyleID="${rowStyle}Center"><Data ss:Type="Number">${item.noUrut || item.no}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}Center"><Data ss:Type="String">${escapeXml(item.kota)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}Bold"><Data ss:Type="String">${escapeXml(item.nama)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(item.kawasan)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(item.alamat)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(item.telepon)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}Center"><Data ss:Type="String">${escapeXml(item.jamBuka)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(item.tipe)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}Center"><Data ss:Type="String">${escapeXml(item.kapasitas)}</Data></Cell>
      <Cell ss:StyleID="${prioStyle}"><Data ss:Type="String">${escapeXml(item.prioritas)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(item.kebutuhanFitur)}</Data></Cell>
      <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(item.alasanProspek)}</Data></Cell>
      <Cell ss:StyleID="Hyperlink" ss:HRef="${escapeXml(item.googleMapsUrl)}"><Data ss:Type="String">Buka di Google Maps</Data></Cell>
    </Row>`;
  });

  return rows;
}

function generateFullXlsXml() {
  const rowsBondowoso = buildRowsXml(cafesBondowoso);
  const rowsSitubondo = buildRowsXml(cafesSitubondo);

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Daftar Kafe Potensial Bondowoso &amp; Situbondo - CafePOS</Title>
  <Subject>Prospek Cafe Bondowoso Republik Kopi dan Jalur Wisata Situbondo</Subject>
  <Author>CafePOS Business Development</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowEven">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowEvenBold">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#0F172A" ss:Bold="1"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowEvenCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowOdd">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowOddBold">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#0F172A" ss:Bold="1"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowOddCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="PrioHigh">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#15803D" ss:Bold="1"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="PrioMed">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#B45309" ss:Bold="1"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Hyperlink">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#2563EB" ss:Underline="Single"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <!-- Worksheet 1: Bondowoso -->
 <Worksheet ss:Name="Kafe Bondowoso">
  <Table ss:ExpandedColumnCount="13" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="35"/>
   <Column ss:AutoFitWidth="0" ss:Width="95"/>
   <Column ss:AutoFitWidth="0" ss:Width="180"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="280"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="180"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="220"/>
   <Column ss:AutoFitWidth="0" ss:Width="280"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   ${rowsBondowoso}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>

 <!-- Worksheet 2: Situbondo -->
 <Worksheet ss:Name="Kafe Situbondo">
  <Table ss:ExpandedColumnCount="13" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="35"/>
   <Column ss:AutoFitWidth="0" ss:Width="95"/>
   <Column ss:AutoFitWidth="0" ss:Width="180"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="280"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="180"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="220"/>
   <Column ss:AutoFitWidth="0" ss:Width="280"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   ${rowsSitubondo}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>

</Workbook>`;
}

// Generate File
const outputDirWorkspace = 'c:\\Users\\Teknisi\\Desktop\\Cafe-pos';
const outputDirFrontendDownloads = 'c:\\Users\\Teknisi\\Desktop\\Cafe-pos\\frontend\\public\\downloads';

// 1. XLS File
const xlsContent = generateFullXlsXml();
const xlsFilePathWorkspace = path.join(outputDirWorkspace, 'Daftar_Cafe_Potensial_Bondowoso_Situbondo_CafePOS.xls');
const xlsFilePathFrontend = path.join(outputDirFrontendDownloads, 'Daftar_Cafe_Potensial_Bondowoso_Situbondo_CafePOS.xls');

fs.writeFileSync(xlsFilePathWorkspace, xlsContent, 'utf-8');
fs.writeFileSync(xlsFilePathFrontend, xlsContent, 'utf-8');

console.log('✅ File .xls berhasil digenerate:');
console.log(' - ' + xlsFilePathWorkspace);
console.log(' - ' + xlsFilePathFrontend);

// 2. XLSX File (Multi-Sheet via SheetJS)
function mapToSheetData(arr) {
  return arr.map(item => ({
    "No": item.noUrut || item.no,
    "Kota": item.kota,
    "Nama Kafe / Coffee Shop": item.nama,
    "Kawasan / Area": item.kawasan,
    "Alamat Lengkap": item.alamat,
    "Nomor Telepon / WA": item.telepon,
    "Jam Operasional": item.jamBuka,
    "Tipe Tempat & Konsep": item.tipe,
    "Kapasitas Tempat": item.kapasitas,
    "Tingkat Prioritas Lead": item.prioritas,
    "Fitur CafePOS Paling Dibutuhkan": item.kebutuhanFitur,
    "Analisis Masalah & Peluang Prospek": item.alasanProspek,
    "Tautan Google Maps": item.googleMapsUrl
  }));
}

const colsConfig = [
  { wch: 5 },  // No
  { wch: 12 }, // Kota
  { wch: 30 }, // Nama
  { wch: 25 }, // Kawasan
  { wch: 45 }, // Alamat
  { wch: 22 }, // Telepon
  { wch: 18 }, // Jam Operasional
  { wch: 35 }, // Tipe
  { wch: 22 }, // Kapasitas
  { wch: 25 }, // Prioritas
  { wch: 40 }, // Fitur Dibutuhkan
  { wch: 55 }, // Analisis Masalah
  { wch: 50 }  // Tautan Google Maps
];

const wb = XLSX.utils.book_new();

const wsBondowoso = XLSX.utils.json_to_sheet(mapToSheetData(cafesBondowoso));
wsBondowoso['!cols'] = colsConfig;
XLSX.utils.book_append_sheet(wb, wsBondowoso, "Kafe Bondowoso");

const wsSitubondo = XLSX.utils.json_to_sheet(mapToSheetData(cafesSitubondo));
wsSitubondo['!cols'] = colsConfig;
XLSX.utils.book_append_sheet(wb, wsSitubondo, "Kafe Situbondo");

const wsAll = XLSX.utils.json_to_sheet(mapToSheetData(allCafes));
wsAll['!cols'] = colsConfig;
XLSX.utils.book_append_sheet(wb, wsAll, "Semua Data (40 Kafe)");

const xlsxFilePathWorkspace = path.join(outputDirWorkspace, 'Daftar_Cafe_Potensial_Bondowoso_Situbondo_CafePOS.xlsx');
const xlsxFilePathFrontend = path.join(outputDirFrontendDownloads, 'Daftar_Cafe_Potensial_Bondowoso_Situbondo_CafePOS.xlsx');

XLSX.writeFile(wb, xlsxFilePathWorkspace);
XLSX.writeFile(wb, xlsxFilePathFrontend);

console.log('✅ File .xlsx berhasil digenerate:');
console.log(' - ' + xlsxFilePathWorkspace);
console.log(' - ' + xlsxFilePathFrontend);
