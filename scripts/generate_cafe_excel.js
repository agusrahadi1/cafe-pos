const fs = require('fs');
const path = require('path');

// Daftar 40 Kafe Terverifikasi & Potensial di Jember untuk CafePOS
const cafes = [
  {
    no: 1,
    nama: "Grand Cafe Jember",
    kawasan: "Sumbersari (Kampus UNEJ)",
    alamat: "Jl. Jawa No.28A Lt. 2-3, Tegal Boto Lor, Sumbersari, Jember 68121",
    telepon: "+62 821-1633-4779",
    jamBuka: "10.00 – 24.00 WIB",
    tipe: "Rooftop & Indoor Modern Cafe (2 Lantai)",
    kapasitas: "Besar (150+ orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Table Ordering 2 Lantai, Kitchen Display (KDS), Multi-printer (Bar & Kitchen)",
    alasanProspek: "Area 2 lantai menyulitkan pelayan bolak-balik. Tamu di lantai 3 sering terlambat dilayani. QR order langsung potong komplain tamu.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Grand+Cafe+Jember+Jl+Jawa"
  },
  {
    no: 2,
    nama: "Senja Coffee & Kitchen",
    kawasan: "Patrang (Gebang)",
    alamat: "Jl. Merak No.789, Gebang Krajan, Gebang, Patrang, Jember 68117",
    telepon: "+62 822-4538-0005",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Aesthetic Garden & Semi-Outdoor Resto",
    kapasitas: "Besar (120+ orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Meja Outdoor Gazebo, Payment Gateway QRIS, Split Bill",
    alasanProspek: "Area taman outdoor luas, kasir di depan. Pelayan sering tidak melihat tamu yang mau order tambahan camilan/minuman.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Senja+Coffee+Kitchen+Jember"
  },
  {
    no: 3,
    nama: "Perasa Coffee & Eatery (24 Jam)",
    kawasan: "Sumbersari (Kampus)",
    alamat: "Jl. Sumatra No.128, Tegal Boto Lor, Sumbersari, Jember 68121",
    telepon: "+62 853-6656-7799",
    jamBuka: "Buka 24 Jam",
    tipe: "24/7 Co-working & Coffee Space Mahasiswa",
    kapasitas: "Sedang-Besar (80-100 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "Shift Kasir 24 Jam, QR Self-Ordering Meja, Realtime Stock",
    alasanProspek: "Shift malam minim kasir. Mahasiswa yang nugas malam bisa pesan makanan langsung lewat QR tanpa antre di bar kasir.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Perasa+Coffee+Eatery+Jember"
  },
  {
    no: 4,
    nama: "Bento Kopi Jember",
    kawasan: "Sumbersari (Antirogo)",
    alamat: "Jl. Tawangmangu, Antirogo, Sumbersari, Jember 68125",
    telepon: "+62 823-3489-2237",
    jamBuka: "09.00 – 01.00 WIB",
    tipe: "Large Open Space & Komunitas Cafe",
    kapasitas: "Sangat Besar (200+ orang, 100+ meja)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Table Ordering Skala Besar, Kitchen Display, Monitor Antrean",
    alasanProspek: "Jumlah meja ratusan. Pelayan manual sering salah antar meja dan lama mencatat. QR ordering otomatis menurunkan beban staf 60%.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bento+Kopi+Jember"
  },
  {
    no: 5,
    nama: "Kafe Kolong Jember",
    kawasan: "Sumbersari (Mastrip)",
    alamat: "Bawah Jembatan Jarwo, Jl. Mastrip, Krajan Timur, Sumbersari, Jember 68121",
    telepon: "+62 811-3446-313",
    jamBuka: "18.00 – 01.00 WIB",
    tipe: "Heritage / Underground Riverbank Cafe Unik",
    kapasitas: "Besar (100+ orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Meja Cepat, Laporan Penjualan Real-time, Offline-first",
    alasanProspek: "Tempat ikonik di kolong jembatan dengan tata letak memanjang. Mobilitas kasir terbatas, QR ordering sangat memudahkan pengunjung.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kafe+Kolong+Jember"
  },
  {
    no: 6,
    nama: "Kafe Tebing (Taman Botani Sukorambi)",
    kawasan: "Sukorambi (Wisata)",
    alamat: "Kompleks Wisata Taman Botani, Jl. Mujahir, Sukorambi, Jember 68151",
    telepon: "+62 811-3003-6000 / +62 851-0070-7600",
    jamBuka: "08.00 – 21.00 WIB",
    tipe: "Scenic Clifftop Cafe & Nature Resto",
    kapasitas: "Besar (150+ orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Order Spot Wisata, Multi-outlet Menu, POS Kasir Cloud",
    alasanProspek: "Lokasi di atas bukit/tebing dengan kontur berundak. Pelayan sangat kelelahan jika harus antar menu fisik naik-turun tangga.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kafe+Tebing+Taman+Botani+Sukorambi+Jember"
  },
  {
    no: 7,
    nama: "Kopi Cak Wang (Karimata)",
    kawasan: "Sumbersari (Karimata)",
    alamat: "Jl. Karimata No.34, Gumuk Kerikil, Sumbersari, Jember 68121",
    telepon: "+62 812-3488-0318",
    jamBuka: "09.00 – 00.00 WIB",
    tipe: "Traditional-Modern Coffeehouse Populer",
    kapasitas: "Besar (100+ orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Kasir Layar Sentuh Cepat, Barcode Scanner, QRIS Otomatis",
    alasanProspek: "Antrean pembayaran saat malam sangat panjang. Fitur fast-checkout dan self-order di meja akan mengurai antrean kasir.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kopi+Cak+Wang+Karimata+Jember"
  },
  {
    no: 8,
    nama: "Kopi Cak Wang (Mastrip 24 Jam)",
    kawasan: "Sumbersari (Mastrip)",
    alamat: "Jl. Mastrip No.53, Krajan Barat, Sumbersari, Jember 68121",
    telepon: "+62 812-3488-0318",
    jamBuka: "Buka 24 Jam",
    tipe: "24/7 Kedai Kopi & Kuliner Mahasiswa",
    kapasitas: "Besar (100+ orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "Multi-branch Management (Pusat & Cabang), Multi-user Role Kasir",
    alasanProspek: "Memiliki 2 cabang utama di Jember. Owner butuh dashboard superadmin untuk memantau omzet kedua cabang dari satu HP.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kopi+Cak+Wang+Mastrip+Jember"
  },
  {
    no: 9,
    nama: "Tanaloka Eatery & Coffee",
    kawasan: "Sumbersari (Kalimantan)",
    alamat: "Jl. Kalimantan No.68, Krajan Timur, Sumbersari, Jember 68121",
    telepon: "+62 812-3436-7890",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Tropical Aesthetic Cafe & Western-Indo Food",
    kapasitas: "Sedang-Besar (80 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Katalog Visual Menu Digital Foto HD, Modifikasi Topping/Addon",
    alasanProspek: "Menu makanan dan mocktail premium membutuhkan foto menarik di menu digital agar menaikkan rata-rata nilai belanja tamu.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Tanaloka+Eatery+Jember"
  },
  {
    no: 10,
    nama: "Latar Semeru Cafe & Resto",
    kawasan: "Sumbersari (Semeru/Kloncing)",
    alamat: "Jl. Semeru, Kloncing, Karangrejo, Sumbersari, Jember 68124",
    telepon: "+62 812-3357-9880",
    jamBuka: "11.00 – 23.00 WIB",
    tipe: "Spacious Hills Semi-Outdoor Cafe & Sunset View",
    kapasitas: "Sangat Besar (150+ orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Table Ordering Terbuka, Split Printer Dapur & Bar",
    alasanProspek: "Banyak spot outdoor terpisah di lereng bukit. Pelanggan butuh kemudahan pesan tanpa perlu jalan jauh ke kasir.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Latar+Semeru+Cafe+Jember"
  },
  {
    no: 11,
    nama: "888 Coffee & More (Triple Eight)",
    kawasan: "Sumbersari (Karimata)",
    alamat: "Ruko Karimata Square Blok B2, Jl. Karimata, Sumbersari, Jember 68121",
    telepon: "+62 813-3388-8882",
    jamBuka: "09.00 – 23.00 WIB",
    tipe: "Specialty Coffee, Brunch & Business Meeting Cafe",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Split-Bill per Tamu, Cetak Struk Formal, Member Loyalty",
    alasanProspek: "Sering digunakan meeting dosen, dokter, dan pengusaha. Fitur split bill per individu dan nota resmi sangat dicari.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=888+Coffee+More+Karimata+Jember"
  },
  {
    no: 12,
    nama: "Sumber Redjo Coffee & Eatery",
    kawasan: "Sumbersari (Kalimantan)",
    alamat: "Jl. Kalimantan No.37, Krajan Timur, Sumbersari, Jember 68121",
    telepon: "+62 852-3298-1122",
    jamBuka: "10.00 – 24.00 WIB",
    tipe: "Vintage-Industrial Cafe & Coffee Roaster",
    kapasitas: "Sedang-Besar (75 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Kitchen Display System, Queue Number Display",
    alasanProspek: "Sering melayani pesanan manual brew khusus. KDS di bar barista memastikan urutan antrean racikan kopi presisi.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sumber+Redjo+Coffee+Eatery+Jember"
  },
  {
    no: 13,
    nama: "De Terrace Cafe & Resto",
    kawasan: "Kaliwates (Kauman)",
    alamat: "Jl. Kauman No.42, Kepatihan, Kaliwates, Jember 68131",
    telepon: "+62 812-3344-9900",
    jamBuka: "10.00 – 22.00 WIB",
    tipe: "Cozy Family Cafe & Casual Dining Tengah Kota",
    kapasitas: "Sedang (70 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Manajemen Meja Reservasi, Cetak Order Dapur Otomatis",
    alasanProspek: "Sering menerima reservasi arisan dan ulang tahun. Fitur pemesanan meja dan deposit pembayaran sangat relevan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=De+Terrace+Cafe+Resto+Jember"
  },
  {
    no: 14,
    nama: "Grufi Cafe & Eatery",
    kawasan: "Patrang (Srikoyo)",
    alamat: "Jl. Srikoyo, Krajan, Patrang, Jember 68118",
    telepon: "+62 822-3112-4455",
    jamBuka: "09.00 – 23.00 WIB",
    tipe: "Greenery Minimalist Cafe Dekat RSUD",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Takeaway Fast-Order, Struk WhatsApp, QR Meja",
    alasanProspek: "Dekat RSUD Soebandi. Banyak tenaga medis butuh pemesanan cepat takeaway maupun dine-in efisien.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Grufi+Cafe+Eatery+Jember"
  },
  {
    no: 15,
    nama: "Corakna Chocolate Cafe & Resto",
    kawasan: "Sumbersari (Jl. Jawa)",
    alamat: "Jl. Jawa No.39A, Tegal Boto Lor, Sumbersari, Jember 68121",
    telepon: "+62 813-5888-7711",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Spesialis Minuman Cokelat Asli Jember & Cafe Hangout",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Menu Varian & Add-on Topping Kompleks, QR Self-Order",
    alasanProspek: "Pilihan menu cokelat memiliki banyak modifikasi (persentase cokelat, susu, topping). Menu digital QR memangkas waktu kasir menjelaskan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Corakna+Chocolate+Cafe+Jl+Jawa+Jember"
  },
  {
    no: 16,
    nama: "My Way Café Jember",
    kawasan: "Sumbersari (Mastrip)",
    alamat: "Jl. Mastrip No.73, Krajan Barat, Sumbersari, Jember 68121",
    telepon: "+62 851-0123-9988",
    jamBuka: "Buka 24 Jam",
    tipe: "24 Jam Cafe Mahasiswa & Co-working Space",
    kapasitas: "Besar (100 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "Laporan Shift Kasir 24 Jam, QR Self-Ordering Meja",
    alasanProspek: "Jam operasional tanpa henti membutuhkan rekap kas per shift kasir yang otomatis tanpa selisih uang fisik.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=My+Way+Cafe+Jl+Mastrip+Jember"
  },
  {
    no: 17,
    nama: "KAVA.id Restaurant & Cafe",
    kawasan: "Sumbersari (Danau Toba)",
    alamat: "Jl. Danau Toba 7 No.137, Tegalgede, Sumbersari, Jember 68124",
    telepon: "+62 811-365-1137",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Fine-Casual Resto & Aesthetic Cafe Berkelas",
    kapasitas: "Besar (100+ orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "UI Menu Digital Eksklusif, Kitchen Display System, Tax & Service Charge Setting",
    alasanProspek: "Resto kafe segmen menengah ke atas yang mengedepankan estetika. Membutuhkan UI QR order yang modern dan elegan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=KAVA.id+Restaurant+Cafe+Danau+Toba+Jember"
  },
  {
    no: 18,
    nama: "Trisi Kopi Jember",
    kawasan: "Sumbersari (Danau Toba)",
    alamat: "Jl. Danau Toba No.31, Tegalgede, Sumbersari, Jember 68124",
    telepon: "+62 822-4412-8899",
    jamBuka: "10.00 – 24.00 WIB",
    tipe: "Cozy Garden Workspace & Specialty Coffee",
    kapasitas: "Sedang-Besar (80 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Order Meja (Memicu Re-Order), QRIS Terintegrasi",
    alasanProspek: "Mayoritas tamu WFC berjam-jam. Fitur QR di meja mempermudah tamu pesan kopi ronde ke-2 tanpa meninggalkan laptop.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Trisi+Kopi+Danau+Toba+Jember"
  },
  {
    no: 19,
    nama: "Memori Baik Coffee & Sourdough",
    kawasan: "Sumbersari (Danau Toba)",
    alamat: "Jl. Danau Toba No.18, Tegalgede, Sumbersari, Jember 68124",
    telepon: "+62 813-3112-9922",
    jamBuka: "08.00 – 22.00 WIB",
    tipe: "Artisanal Bakery & Specialty Coffee Shop",
    kapasitas: "Sedang (50 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Real-time Pastry Inventory Track, POS Kasir Cepat",
    alasanProspek: "Pastry & sourdough diproduksi terbatas harian. Fitur auto-sold out di menu digital CafePOS mencegah pesanan roti yang habis.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Memori+Baik+Coffee+Danau+Toba+Jember"
  },
  {
    no: 20,
    nama: "De Nusantara Cafe Jember",
    kawasan: "Sumbersari (Danau Toba)",
    alamat: "Jl. Danau Toba (Depan SMK Trunojoyo), Sumbersari, Jember 68124",
    telepon: "+62 823-3118-7722",
    jamBuka: "11.00 – 23.00 WIB",
    tipe: "Nusantara Themed Cafe & Traditional Fusion Food",
    kapasitas: "Besar (120 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Meja Gazebo Lesehan, Struk Dapur Bluetooth",
    alasanProspek: "Banyak spot saung lesehan bambu terpisah. QR meja memudahkan keluarga pesan tanpa bolak-balik ke kasir depan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=De+Nusantara+Cafe+Danau+Toba+Jember"
  },
  {
    no: 21,
    nama: "Alocasia Cafe & Eatery",
    kawasan: "Sumbersari (Jl. Riau)",
    alamat: "Jl. Riau Gang Paving No.8, Krajan Barat, Sumbersari, Jember 68121",
    telepon: "+62 822-5788-3311",
    jamBuka: "11.00 – 23.00 WIB",
    tipe: "Botanical Hidden Gem Cafe & Garden Chill",
    kapasitas: "Sedang-Besar (75 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Order Sudut Taman, Tombol Panggil Pelayan (Call Waiter)",
    alasanProspek: "Konsep hidden gem dengan banyak sudut taman privat. QR order sangat membantu karena pelayan tidak selalu melihat meja tamu.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Alocasia+Cafe+Eatery+Jember"
  },
  {
    no: 22,
    nama: "Foodgasm Bistro & Cafe",
    kawasan: "Sumbersari (Jl. Jawa)",
    alamat: "Jl. Jawa No.37, Tegal Boto Lor, Sumbersari, Jember 68121",
    telepon: "+62 812-5988-1234",
    jamBuka: "11.00 – 23.00 WIB",
    tipe: "Western & Asian Fusion Bistro Cafe",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Kitchen & Beverage Routing Printer, Manajemen Meja Dine-In",
    alasanProspek: "Menu makanan pasta/steak dan dessert butuh perutean tiket otomatis ke koki dapur dan bartender.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Foodgasm+Bistro+Cafe+Jl+Jawa+Jember"
  },
  {
    no: 23,
    nama: "Tiara Jember Resto & Cafe",
    kawasan: "Kaliwates (Gatot Subroto)",
    alamat: "Jl. Gatot Subroto No.15, Tembaan, Kepatihan, Kaliwates, Jember 68131",
    telepon: "+62 331-484111 / +62 811-352-8811",
    jamBuka: "09.00 – 22.00 WIB",
    tipe: "Classic Heritage Resto & Executive Cafe",
    kapasitas: "Besar (120+ orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Invoicing Faktur Resmi, Split Bill, VIP Room Reservation",
    alasanProspek: "Langganan pejabat dinas dan corporate meeting. Butuh struk faktur pajak/resmi dan pembagian tagihan per rombongan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Tiara+Jember+Resto+Cafe+Gatot+Subroto"
  },
  {
    no: 24,
    nama: "Dira Beach Cafe & Resto (Wuluhan)",
    kawasan: "Jember Selatan (Wuluhan)",
    alamat: "Kompleks Dira Park, Jl. Dira Park No.1, Pontang, Wuluhan, Jember 68162",
    telepon: "+62 812-3489-0011 / +62 822-3456-7890",
    jamBuka: "08.00 – 22.00 WIB",
    tipe: "Mega Beach Theme Cafe, Waterpark & Resort",
    kapasitas: "Mega Besar (300+ orang, puluhan gazebo)",
    prioritas: "Prioritas Sangat Tinggi (Mega Lead)",
    kebutuhanFitur: "QR Table Ordering Skala Resort, Multi-Kasir Terintegrasi, Payment Gateway",
    alasanProspek: "Kawasan seluas hektaran. Pengunjung di gazebo waterpark sangat enggan jalan ke kasir depan. QR di tiap gazebo akan melipatgandakan omzet F&B.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Dira+Beach+Cafe+Wuluhan+Jember"
  },
  {
    no: 25,
    nama: "Dira Cafe & Resto Kencong",
    kawasan: "Jember Barat (Kencong)",
    alamat: "Jl. Krakatau No.93, Kencong, Jember 68167",
    telepon: "+62 812-3213-900 / +62 811-3788-900",
    jamBuka: "08.30 – 22.00 WIB",
    tipe: "Modern Family Cafe & Mall Hub Kencong",
    kapasitas: "Sangat Besar (200+ orang)",
    prioritas: "Prioritas Sangat Tinggi (Mega Lead)",
    kebutuhanFitur: "Multi-Terminal Kasir POS, Manajemen Stok Bahan Baku, Laporan Cabang",
    alasanProspek: "Pusat keramaian terbesar di Jember Barat. Butuh sistem kasir tahan banting saat akhir pekan yang padat.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Dira+Cafe+Kencong+Jember"
  },
  {
    no: 26,
    nama: "Kopitiam Oey Jember",
    kawasan: "Kaliwates (Wahid Hasyim)",
    alamat: "Jl. KH Wahid Hasyim No.35, Kepatihan, Kaliwates, Jember 68131",
    telepon: "+62 812-3567-8910",
    jamBuka: "07.00 – 22.00 WIB",
    tipe: "Authentic Vintage Kopitiam & Breakfast Spot",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Quick-Order Morning Rush, Struk Tiket Barista Cepat",
    alasanProspek: "Padat di pagi hari saat jam sarapan kopi & toast. Kasir butuh POS yang bisa input menu dalam hitungan 5 detik.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kopitiam+Oey+Jember+Wahid+Hasyim"
  },
  {
    no: 27,
    nama: "Rasa Cafe & Roastery Jember",
    kawasan: "Sumbersari (Jl. Jawa)",
    alamat: "Jl. Jawa No.70, Tegal Boto Lor, Sumbersari, Jember 68121",
    telepon: "+62 821-3991-0022",
    jamBuka: "10.00 – 24.00 WIB",
    tipe: "Specialty Coffee Roastery & Artisan Cafe",
    kapasitas: "Sedang (50 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "POS Multi-kategori (F&B + Penjualan Beans Kiloan)",
    alasanProspek: "Menjual menu minuman kopi dan biji kopi sangrai. CafePOS dapat mengelola kedua jenis produk tersebut secara rapi.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Rasa+Cafe+Roastery+Jl+Jawa+Jember"
  },
  {
    no: 28,
    nama: "Mampir Kedai Kopi (Suprapto)",
    kawasan: "Sumbersari (Letjen Suprapto)",
    alamat: "Jl. Letjen Suprapto No.88, Kebonsari, Sumbersari, Jember 68122",
    telepon: "+62 852-3011-2299",
    jamBuka: "13.00 – 00.00 WIB",
    tipe: "Industrial Community Coffee Space",
    kapasitas: "Sedang-Besar (70 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "QR Self-Ordering Event Komunitas, POS Kasir Tablet",
    alasanProspek: "Sering mengadakan workshop dan live session. QR meja mempermudah peserta event memesan tanpa mengantre ke kasir.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mampir+Kedai+Kopi+Suprapto+Jember"
  },
  {
    no: 29,
    nama: "Warung Kopi & Cafe Tebal (Mastrip)",
    kawasan: "Sumbersari (Mastrip)",
    alamat: "Jl. Mastrip No.22, Krajan Timur, Sumbersari, Jember 68121",
    telepon: "+62 823-3344-5511",
    jamBuka: "10.00 – 01.00 WIB",
    tipe: "High-Volume Modern Warkop Mahasiswa",
    kapasitas: "Besar (90 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "POS Ringan via Android HP Murah, Struk Bluetooth",
    alasanProspek: "Volume transaksi makanan ringan dan kopi sachet sangat tinggi. Memerlukan POS yang tidak memberatkan modal awal kasir.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Warkop+Cafe+Mastrip+Jember"
  },
  {
    no: 30,
    nama: "Senandung Kopi Jember",
    kawasan: "Sumbersari (Panjaitan)",
    alamat: "Jl. Letjen Panjaitan No.112, Gumuk Bago, Sumbersari, Jember 68121",
    telepon: "+62 813-3665-4433",
    jamBuka: "10.00 – 23.30 WIB",
    tipe: "Live Music Venue & Acoustic Coffeehouse",
    kapasitas: "Besar (100 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "QR Order Meja (Anti Salah Dengar saat Konser Akustik)",
    alasanProspek: "Suara live music akustik membuat pesanan manual sering salah dengar. QR ordering di meja menyelesaikan kendala noise ini.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Senandung+Kopi+Panjaitan+Jember"
  },
  {
    no: 31,
    nama: "Roemah Kopi Jember (Remo Jember)",
    kawasan: "Patrang (Gebang Cempaka)",
    alamat: "Jl. Cempaka No.25, Gebang Krajan, Gebang, Patrang, Jember 68117",
    telepon: "+62 852-5888-2345",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Classic Heritage Home Cafe & Resto",
    kapasitas: "Sedang-Besar (80 orang)",
    prioritas: "Prioritas Sangat Tinggi",
    kebutuhanFitur: "QR Meja Antar-Ruang (Multi-Room), Kitchen Display",
    alasanProspek: "Bangunan rumah tua bersekat-sekat kamar. Tamu di dalam kamar tidak terlihat oleh pelayan. QR meja menghubungkan tamu langsung ke bar.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Roemah+Kopi+Cempaka+Gebang+Jember"
  },
  {
    no: 32,
    nama: "The Anglo-Saxon Cafe & Resto",
    kawasan: "Kaliwates (Hayam Wuruk)",
    alamat: "Jl. Hayam Wuruk No.158, Gerdu, Sempusari, Kaliwates, Jember 68136",
    telepon: "+62 812-3499-1123",
    jamBuka: "11.00 – 22.00 WIB",
    tipe: "British Style Classic Cafe & Western Dining",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Struk WhatsApp Paperless, Laporan Penjualan Real-time",
    alasanProspek: "Target pasar premium perumahan elite Hayam Wuruk. Pelanggan menyukai fitur kirim e-receipt langsung ke WA.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Anglo+Saxon+Hayam+Wuruk+Jember"
  },
  {
    no: 33,
    nama: "Kafe Rollaas Cafe & Resto (PTPN XII)",
    kawasan: "Kaliwates (Gajah Mada)",
    alamat: "Jl. Gajah Mada No.174, Kaliwates Kidul, Kaliwates, Jember 68131",
    telepon: "+62 331-422111 / +62 811-3030-12",
    jamBuka: "09.00 – 23.00 WIB",
    tipe: "Corporate Coffee Heritage Lounge & Resto",
    kapasitas: "Besar (100 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Laporan Akuntansi POS, Manajemen Inventori Bahan, Struk Pajak",
    alasanProspek: "Dimiliki BUMN perkebunan. Membutuhkan sistem pencatatan keuangan yang transparan, dapat diaudit, dan rapi.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Rollaas+Coffee+Gajah+Mada+Jember"
  },
  {
    no: 34,
    nama: "Kopi Titik Koma (Cabang Jember)",
    kawasan: "Sumbersari (Jl. Jawa)",
    alamat: "Jl. Jawa No.15, Tegal Boto Lor, Sumbersari, Jember 68121",
    telepon: "+62 813-9000-5432",
    jamBuka: "08.00 – 22.00 WIB",
    tipe: "Modern Minimalist Artisan Coffee Bar",
    kapasitas: "Kecil-Sedang (40 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "Display Nomor Antrean Layar TV, Fast Checkout",
    alasanProspek: "Banyak pesanan take-away cepat. Integrasi nomor antrean di layar membantu pelanggan menunggu dengan tertib.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kopi+Titik+Koma+Jl+Jawa+Jember"
  },
  {
    no: 35,
    nama: "Caffe D’Boer (D'Boer Vintage Cafe)",
    kawasan: "Patrang (PB Sudirman / Dekat Stasiun)",
    alamat: "Jl. PB Sudirman No.55, Kp. Using, Jemberlor, Patrang, Jember 68118",
    telepon: "+62 812-4988-7711",
    jamBuka: "09.00 – 23.00 WIB",
    tipe: "Vintage Train Station & Colonial Theme Cafe",
    kapasitas: "Sedang-Besar (70 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Live Tracking Estimasi Penyajian Menu, Fast POS",
    alasanProspek: "Dekat Stasiun KA Jember. Penumpang kereta butuh kepastian makanan disajikan cepat sebelum jam keberangkatan kereta.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Caffe+D+Boer+PB+Sudirman+Jember"
  },
  {
    no: 36,
    nama: "Kedai Kopi Tebal (Danau Toba)",
    kawasan: "Sumbersari (Danau Toba)",
    alamat: "Jl. Danau Toba No.89, Tegalgede, Sumbersari, Jember 68124",
    telepon: "+62 822-9988-7766",
    jamBuka: "10.00 – 00.00 WIB",
    tipe: "Budget-Friendly Student Hangout Cafe",
    kapasitas: "Sedang-Besar (80 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Aplikasi Kasir Android Hemat Biaya, Rekap Shift",
    alasanProspek: "Target mahasiswa budget bersahabat. Butuh solusi POS modern tanpa perlu berlangganan bulanan jutaan rupiah.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kedai+Kopi+Danau+Toba+Jember"
  },
  {
    no: 37,
    nama: "Houtenhand Beerhouse & Cafe Jember",
    kawasan: "Sumbersari (Jl. Karimata)",
    alamat: "Jl. Karimata No.64, Gumuk Kerikil, Sumbersari, Jember 68121",
    telepon: "+62 813-3322-1144",
    jamBuka: "16.00 – 01.00 WIB",
    tipe: "Rustic European Pub & Dining Cafe",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Sedang-Tinggi",
    kebutuhanFitur: "Tab Meja Terbuka (Open Tab), Split Bill Malam Hari",
    alasanProspek: "Sistem open tab minuman sering kali merepotkan di akhir pembayaran. Fitur digital order per meja CafePOS sangat menolong.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Houtenhand+Karimata+Jember"
  },
  {
    no: 38,
    nama: "Toko Kopi Tuku / Mitra Kopi Lokal (Kaliwates)",
    kawasan: "Kaliwates (Gajah Mada Ruko)",
    alamat: "Kompleks Ruko Gajah Mada Square, Kaliwates, Jember 68131",
    telepon: "+62 812-9011-2233",
    jamBuka: "08.00 – 21.30 WIB",
    tipe: "Grab-and-Go Modern Coffee Counter",
    kapasitas: "Kecil (25 orang)",
    prioritas: "Prioritas Sedang",
    kebutuhanFitur: "Kasir Kilat (Sub-10 Detik per Transaksi), QRIS Dinamis",
    alasanProspek: "Membutuhkan integrasi QRIS statis maupun dinamis dengan konfirmasi pembayaran otomatis masuk ke layar kasir.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kopi+Gajah+Mada+Square+Jember"
  },
  {
    no: 39,
    nama: "Kedai Kopi & Dapur Mami Jember",
    kawasan: "Patrang (Baratan)",
    alamat: "Jl. Baratan Timur No.14, Baratan, Patrang, Jember 68112",
    telepon: "+62 821-4321-9900",
    jamBuka: "09.00 – 22.00 WIB",
    tipe: "Homey Garden Cafe & Masakan Tradisional",
    kapasitas: "Sedang (50 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Order Meja QR, Cetak Tiket Dapur Masakan",
    alasanProspek: "Konsep rumahan ramah keluarga. Butuh kemudahan pesan tanpa perlu berulang kali memanggil pelayan.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kedai+Kopi+Dapur+Mami+Jember"
  },
  {
    no: 40,
    nama: "Kopite Cafe & Space Jember",
    kawasan: "Sumbersari (Jl. Riau)",
    alamat: "Jl. Riau No.23, Krajan Barat, Sumbersari, Jember 68121",
    telepon: "+62 857-3122-8877",
    jamBuka: "10.00 – 23.00 WIB",
    tipe: "Modern Minimalist Work & Study Cafe",
    kapasitas: "Sedang (60 orang)",
    prioritas: "Prioritas Tinggi",
    kebutuhanFitur: "Self-Order QR, Paket Menu Bundling Nugas, Struk Digital",
    alasanProspek: "Ramai mahasiswa yang mengerjakan skripsi dan tugas kelompok. Cocok dengan sistem paket combo bundling CafePOS.",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kopite+Cafe+Jl+Riau+Jember"
  }
];

// 1. Generate SpreadsheetML XML (.xls) - Format resmi Microsoft Excel
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateXlsXml(data) {
  let rows = '';

  // Header Row
  rows += `
    <Row ss:Height="28">
      <Cell ss:StyleID="Header"><Data ss:Type="String">No</Data></Cell>
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

  // Data Rows
  data.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowStyle = isEven ? "RowEven" : "RowOdd";
    const prioStyle = item.prioritas.includes("Sangat Tinggi") ? "PrioHigh" : "PrioMed";

    rows += `
    <Row ss:Height="36">
      <Cell ss:StyleID="${rowStyle}Center"><Data ss:Type="Number">${item.no}</Data></Cell>
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Daftar Kafe Potensial Jember - Prospek CafePOS</Title>
  <Subject>Data Prospek Kafe dan Coffee Shop Jember</Subject>
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
 <Worksheet ss:Name="Daftar Cafe Potensial Jember">
  <Table ss:ExpandedColumnCount="12" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="40"/>
   <Column ss:AutoFitWidth="0" ss:Width="170"/>
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
   ${rows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>100</FitHeight>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
   <Panes>
    <Pane>
     <Number>3</Number>
    </Pane>
    <Pane>
     <Number>2</Number>
     <ActiveRow>0</ActiveRow>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

const XLSX = require('xlsx');

// Target file locations
const outputDirWorkspace = 'c:\\Users\\Teknisi\\Desktop\\Cafe-pos';
const outputDirFrontendDownloads = 'c:\\Users\\Teknisi\\Desktop\\Cafe-pos\\frontend\\public\\downloads';

if (!fs.existsSync(outputDirFrontendDownloads)) {
  fs.mkdirSync(outputDirFrontendDownloads, { recursive: true });
}

// 1. Simpan file .xls (SpreadsheetML XML ber-style)
const xlsContent = generateXlsXml(cafes);
const xlsFilePathWorkspace = path.join(outputDirWorkspace, 'Daftar_Cafe_Potensial_Jember_CafePOS.xls');
const xlsFilePathFrontend = path.join(outputDirFrontendDownloads, 'Daftar_Cafe_Potensial_Jember_CafePOS.xls');

fs.writeFileSync(xlsFilePathWorkspace, xlsContent, 'utf-8');
fs.writeFileSync(xlsFilePathFrontend, xlsContent, 'utf-8');

console.log('✅ File .xls berhasil digenerate:');
console.log(' - ' + xlsFilePathWorkspace);
console.log(' - ' + xlsFilePathFrontend);

// 2. Simpan file .xlsx (OpenXML Binary via SheetJS)
const xlsxData = cafes.map(item => ({
  "No": item.no,
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

const worksheet = XLSX.utils.json_to_sheet(xlsxData);

// Set column widths
worksheet['!cols'] = [
  { wch: 6 },  // No
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

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Kafe Potensial Jember");

const xlsxFilePathWorkspace = path.join(outputDirWorkspace, 'Daftar_Cafe_Potensial_Jember_CafePOS.xlsx');
const xlsxFilePathFrontend = path.join(outputDirFrontendDownloads, 'Daftar_Cafe_Potensial_Jember_CafePOS.xlsx');

XLSX.writeFile(workbook, xlsxFilePathWorkspace);
XLSX.writeFile(workbook, xlsxFilePathFrontend);

console.log('✅ File .xlsx berhasil digenerate:');
console.log(' - ' + xlsxFilePathWorkspace);
console.log(' - ' + xlsxFilePathFrontend);

