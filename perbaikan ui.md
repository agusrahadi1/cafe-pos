Anda bertindak sebagai:

- Senior UI/UX Designer
- Senior Frontend Architect
- Responsive Web Design Specialist
- SaaS Product Designer
- Design System Engineer

Saya memiliki aplikasi POS bernama:

MOKKA POS

Aplikasi ini adalah Point of Sale / Cafe & Restaurant Management System.

Saya telah memberikan screenshot UI aplikasi saat ini sebagai visual reference.

TUGAS UTAMA ANDA:

Perbaiki UI/UX aplikasi MOKKA POS agar terlihat:

- Professional
- Modern
- Premium
- Clean
- Elegant
- Expensive / high-end SaaS
- Consistent
- Responsive
- Comfortable digunakan dalam operasional POS sehari-hari

TARGET VISUAL:

Bayangkan kualitas UI seperti kombinasi:

- Apple
- Stripe
- Linear
- Vercel
- Square POS
- Toast POS
- Shopify Admin
- Modern Enterprise SaaS

Tetapi JANGAN meniru desain mereka secara mentah.

Buat visual identity MOKKA POS sendiri.

==================================================
ATURAN PALING PENTING
==================================================

JANGAN menghapus menu.

JANGAN menghapus fitur.

JANGAN menghilangkan functionality.

JANGAN mengubah business logic.

JANGAN mengubah API.

JANGAN mengubah database.

JANGAN mengubah endpoint.

JANGAN mengubah authentication.

JANGAN mengubah authorization.

JANGAN mengubah struktur data backend.

JANGAN menghilangkan tombol atau action yang sudah tersedia.

JANGAN mengurangi kemampuan aplikasi hanya karena alasan responsive.

JANGAN mengganti workflow existing tanpa alasan UX yang sangat kuat.

Fokus pekerjaan hanya:

UI
UX
Responsive Design
Layout
Spacing
Typography
Color
Component styling
Interaction
Accessibility
Responsive behavior
Modal/Dialog behavior
Form usability
Navigation behavior

Jika suatu elemen terlalu besar untuk mobile, REPOSITION atau RESTRUCTURE layout-nya.

JANGAN menghapus functionality.

==================================================
KONDISI UI SAAT INI
==================================================

Berdasarkan screenshot:

Aplikasi memiliki:

- Sidebar navigation
- Header/top navigation
- Point of Sale page
- Status Kasir Aktif
- Audio/sound control
- Refresh
- Theme control
- Pasang POS
- Fullscreen
- Notification
- Date selector
- Shift status
- User profile
- Menu Populer

Sidebar memiliki menu:

- Order Board
- Dapur (KDS)
- Pelayan (Waiter)
- Menu & Harga
- Meja & QR Meja
- Bahan Baku (Stok)
- Diskon & Promo
- Shift Kasir
- Laporan Penjualan
- Kelola Karyawan
- Pengaturan Kafe

JANGAN menghapus satupun menu tersebut.

Pada halaman Order Board terdapat:

- Pesanan Baru
- Total Pesanan
- Menunggu
- Selesai
- Search
- Filter order
- Dine In
- Take Away
- Drive Thru
- Hari Ini
- Kanban
- List
- Pesanan Baru
- Kanban order status
- Order cards
- Payment status
- Print receipt
- Table information

SEMUA functionality tersebut HARUS tetap tersedia.

==================================================
OBJECTIVE #1
RESPONSIVE DESIGN
==================================================

Aplikasi harus benar-benar responsive pada:

320px
360px
375px
390px
414px
430px
480px
600px
768px
820px
1024px
1280px
1366px
1440px
1600px
1920px
2560px

Jangan hanya menggunakan:

width: 100%

atau

media query sederhana.

Lakukan responsive layout secara architecture-level.

==================================================
DESKTOP
==================================================

Untuk desktop:

Pertahankan konsep:

SIDEBAR + MAIN CONTENT

Sidebar harus:

- clean
- compact
- professional
- mudah dipindai
- active state jelas
- icon konsisten
- typography rapi
- spacing presisi

Jangan membuat sidebar terlalu besar.

Jangan membuat content area terlalu sempit.

Gunakan layout yang memaksimalkan usable screen area.

==================================================
TABLET
==================================================

Pada tablet:

Sidebar dapat berubah menjadi:

- collapsed sidebar
- icon navigation
- drawer

sesuai kebutuhan.

TETAPI:

Semua menu tetap tersedia.

Tidak boleh ada menu yang hilang.

User harus tetap dapat mengakses seluruh fitur.

==================================================
MOBILE
==================================================

Pada mobile:

JANGAN memaksakan desktop layout.

Sidebar desktop boleh berubah menjadi:

- drawer
- slide-over navigation
- compact navigation

Tetapi seluruh menu tetap tersedia.

Prioritaskan:

- touch usability
- readability
- fast interaction
- minimal cognitive load

Semua tombol penting harus memiliki touch target minimal sekitar:

44px

==================================================
ORDER BOARD MOBILE
==================================================

Ini sangat penting.

Order Board adalah halaman operasional POS.

Jangan sekadar mengecilkan Kanban desktop.

Pada mobile, gunakan layout yang paling nyaman untuk operator.

Pilihan dapat berupa:

1. Horizontal swipe Kanban

atau

2. Tab/status selector + satu column aktif

atau

3. Compact Kanban

Pilih pendekatan yang paling usable berdasarkan source code.

Contoh:

[ Menunggu ] [ Diproses ] [ Kitchen ] [ Siap ] [ Selesai ]

User dapat swipe atau memilih status.

SEMUA status tetap tersedia.

Jangan menghapus status hanya untuk membuat layout mobile lebih sederhana.

Order card harus tetap menampilkan informasi penting:

- Order number
- Time
- Table
- Customer/order type
- Item
- Quantity
- Total
- Payment status
- Action
- Print

Informasi sekunder boleh disusun ulang atau collapse.

==================================================
HEADER RESPONSIVE
==================================================

Header desktop saat ini cukup padat.

Audit semua item header.

Pada desktop:

Pertahankan semua functionality.

Pada tablet:

Gabungkan elemen tertentu jika diperlukan.

Pada mobile:

Gunakan responsive grouping.

JANGAN menghapus functionality.

Contoh:

Desktop:

Logo | Point of Sale | Status | Controls | Date | Shift | User

Mobile:

☰ | MOKKA POS | Shift | Notification | User

Detail controls dapat berada dalam menu/drawer.

Tetapi seluruh functionality tetap dapat diakses.

==================================================
VISUAL DESIGN
==================================================

Target:

PREMIUM SAAS POS

Gunakan:

- whitespace yang cukup
- typography hierarchy yang kuat
- subtle border
- subtle shadow
- controlled radius
- clean surface
- consistent spacing
- restrained color palette

Hindari:

- excessive gradient
- excessive shadow
- excessive rounded cards
- terlalu banyak warna
- icon random
- typography terlalu kecil
- layout terlalu padat
- efek glassmorphism berlebihan
- animasi berlebihan

UI harus terasa mahal karena:

PRECISION

bukan karena:

DECORATION

==================================================
COLOR SYSTEM
==================================================

Pertahankan identitas warna existing MOKKA POS jika sudah terdapat design token.

Jangan mengganti brand color secara sembarangan.

Buat hierarchy:

Primary
Secondary
Surface
Background
Border
Text
Muted Text
Success
Warning
Error
Info

Gunakan semantic color.

Status order harus mudah dibedakan tetapi tetap elegant.

Jangan menggunakan warna yang terlalu saturated.

==================================================
TYPOGRAPHY
==================================================

Perbaiki typography hierarchy.

Gunakan:

Page Title
Section Title
Card Title
Body
Label
Caption
Helper Text

Pastikan:

- readable
- consistent
- appropriate line-height
- proper font-weight
- proper letter-spacing

Jangan menggunakan terlalu banyak font size.

Jangan menggunakan font terlalu kecil hanya untuk menampilkan banyak data.

==================================================
SPACING SYSTEM
==================================================

Gunakan spacing system konsisten.

Contoh:

4
8
12
16
20
24
32
40
48
64

Jangan menggunakan margin/padding random tanpa alasan.

Semua component harus mengikuti spacing system yang sama.

==================================================
CARD DESIGN
==================================================

Perbaiki:

- KPI cards
- order cards
- menu cards
- employee cards
- report cards
- settings cards

Card harus:

- clean
- readable
- compact
- functional

Jangan membuat card terlalu rounded.

Jangan membuat shadow terlalu kuat.

==================================================
ORDER CARD
==================================================

Order card adalah component penting.

Pastikan hierarchy jelas:

ORDER NUMBER
↓
TIME / TABLE
↓
ITEM
↓
QUANTITY
↓
PRICE
↓
PAYMENT
↓
ACTION

Informasi penting harus dapat dipindai dalam 1-2 detik.

Gunakan typography hierarchy.

Jangan membuat semua text memiliki visual weight yang sama.

==================================================
TABLE / DATA HEAVY PAGE
==================================================

Untuk halaman:

- Laporan Penjualan
- Kelola Karyawan
- Bahan Baku
- Menu & Harga
- Shift Kasir

Pastikan responsive.

Jika tabel terlalu lebar:

JANGAN mengecilkan font sampai tidak terbaca.

Gunakan:

- horizontal scroll
- sticky important column
- responsive card
- expandable row

sesuai konteks.

Semua data dan action tetap tersedia.

==================================================
MODAL / DIALOG
==================================================

Ini adalah PRIORITAS TINGGI.

Audit semua modal/form yang ada.

Masalah yang harus dihindari:

- modal keluar viewport
- modal terlalu tinggi
- form tidak dapat di-scroll
- footer tidak terlihat
- tombol Save tidak terlihat
- keyboard mobile menutupi input
- modal stack
- nested modal bermasalah
- dropdown keluar layar
- date picker keluar layar
- body ikut scrolling
- z-index conflict

Gunakan architecture:

Viewport
↓
Overlay
↓
Modal
↓
Header
↓
Scrollable Body
↓
Footer

Contoh:

.modal {
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
}

.modal-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

Tetapi jangan copy contoh tersebut secara membabi buta.

Cari root cause dari implementation existing.

Audit:

overflow
overflow-x
overflow-y
height
min-height
max-height
100vh
100svh
100dvh
position
fixed
absolute
sticky
z-index
transform
flex
grid

==================================================
MOBILE FORM
==================================================

Pada mobile:

- form satu kolom
- input mudah disentuh
- label jelas
- error message terlihat
- keyboard tidak menutupi input
- field terakhir tetap dapat dijangkau
- tombol Save mudah dijangkau
- Cancel/Save tidak keluar viewport

Jika form panjang:

HEADER
↓
SCROLLABLE FORM
↓
STICKY ACTION FOOTER

Gunakan pendekatan yang benar sesuai framework existing.

==================================================
SCROLL BEHAVIOR
==================================================

Ketika modal dibuka:

Background page tidak boleh ikut scrolling.

Tetapi:

Modal body HARUS dapat scrolling.

Ketika modal ditutup:

Scroll position halaman harus tetap benar.

Jangan sampai penggunaan:

overflow: hidden

pada parent menyebabkan modal tidak dapat scroll.

Perhatikan flex child:

min-height: 0

jika diperlukan.

==================================================
ACCESSIBILITY
==================================================

Perbaiki:

- keyboard navigation
- focus state
- focus management
- aria-label
- aria-expanded
- aria-controls
- dialog semantics
- contrast
- touch target
- screen reader compatibility

Modal harus menangani focus dengan benar.

==================================================
MICRO INTERACTION
==================================================

Tambahkan micro interaction secara subtle:

- hover
- active
- focus
- pressed
- loading
- modal transition
- drawer transition
- toast
- dropdown

Durasi ideal:

150ms - 250ms

Jangan menggunakan animasi berlebihan.

==================================================
DARK MODE / LIGHT MODE
==================================================

Jika aplikasi sudah mendukung theme:

JANGAN menghapus.

Pastikan seluruh component tetap konsisten.

Jika belum ada dark mode:

JANGAN membuat dark mode sebagai scope utama.

Fokus terlebih dahulu pada UI/UX dan responsive.

==================================================
DESIGN SYSTEM
==================================================

Sebelum melakukan perubahan besar, identifikasi existing design tokens.

Jika belum ada design system yang jelas, buat token yang ringan dan maintainable:

colors
spacing
radius
shadow
typography
breakpoints
z-index
transition

Jangan membuat design system yang terlalu kompleks.

==================================================
CODE QUALITY
==================================================

Jangan membuat CSS berantakan.

Jangan menambahkan:

!important

secara sembarangan.

Hindari:

duplicate CSS
duplicate component
conflicting media query
excessive z-index
fixed width yang menyebabkan overflow
fixed height yang menyebabkan clipping

Gunakan component yang reusable.

Jika sudah ada component reusable, gunakan component tersebut.

Jangan membuat component baru jika existing component dapat diperbaiki.

==================================================
VERY IMPORTANT:
JANGAN REFACTOR BESAR
==================================================

Jangan melakukan rewrite aplikasi.

Jangan mengganti framework.

Jangan mengganti UI library.

Jangan mengganti state management.

Jangan mengganti routing.

Jangan mengganti API.

Jangan mengganti database.

Jangan mengganti architecture backend.

Jangan menghapus feature.

Jangan menghapus menu.

Lakukan:

TARGETED UI/UX IMPROVEMENT.

==================================================
WORKFLOW YANG WAJIB
==================================================

STEP 1

Baca dan pahami seluruh struktur frontend terlebih dahulu.

Identifikasi:

- framework
- component architecture
- styling system
- layout
- responsive system
- modal implementation
- navigation
- design tokens

JANGAN langsung coding.

STEP 2

Audit existing UI.

Buat:

UI/UX AUDIT

dengan format:

| Area | Problem | Severity | Recommended Fix |
|------|---------|----------|-----------------|

STEP 3

Buat:

RESPONSIVE AUDIT

| Component | Desktop | Tablet | Mobile | Solution |
|-----------|---------|---------|--------|----------|

STEP 4

Buat:

COMPONENT IMPROVEMENT PLAN

| Component | Current | Improvement |
|-----------|---------|-------------|

STEP 5

Baru implementasikan perubahan.

==================================================
PRIORITAS PERBAIKAN
==================================================

Prioritas:

P0
Functional responsive problems

P1
Modal / Form / Scroll

P2
Mobile usability

P3
Navigation

P4
Layout consistency

P5
Typography

P6
Visual polish

==================================================
VALIDATION
==================================================

Setelah implementasi lakukan pengecekan:

320px
360px
375px
390px
414px
480px
768px
820px
1024px
1280px
1440px
1920px

Pastikan:

NO HORIZONTAL OVERFLOW

NO CLIPPED CONTENT

NO BROKEN MODAL

NO BROKEN FORM

NO HIDDEN BUTTON

NO BROKEN NAVIGATION

NO MISSING MENU

NO MISSING FEATURE

NO BROKEN API

NO BROKEN ROUTING

==================================================
VISUAL QUALITY CHECK
==================================================

Bandingkan hasil dengan screenshot awal.

Jangan membuat UI menjadi terlalu berbeda secara ekstrem.

Tujuannya:

CURRENT MOKKA POS
        ↓
SAME PRODUCT
        ↓
BETTER UI
        ↓
BETTER UX
        ↓
BETTER RESPONSIVE
        ↓
PREMIUM SaaS QUALITY

User existing harus tetap merasa:

"Ini MOKKA POS yang sama."

bukan:

"Ini aplikasi yang berbeda."

==================================================
FINAL OUTPUT
==================================================

Setelah selesai, tampilkan:

1. UI/UX Audit
2. Responsive Audit
3. Modal/Form Audit
4. Files Changed
5. Reason setiap file diubah
6. Detail perubahan UI
7. Responsive strategy
8. Validation result
9. Build result
10. Remaining issues jika ada

Jika ada perubahan yang berpotensi mempengaruhi functionality:

STOP dan jelaskan terlebih dahulu.

Jangan mengambil keputusan untuk menghapus atau mengurangi functionality.

==================================================
FINAL DESIGN DIRECTION
==================================================

MOKKA POS harus terasa seperti:

"Premium Modern Cafe POS SaaS"

Bukan:

"Template Admin Dashboard"

Karakter visual:

Clean
Precise
Premium
Modern
Fast
Professional
Operational
Elegant
Minimal
Highly Responsive

Fokus utama:

USABILITY FIRST
VISUAL QUALITY SECOND
DECORATION LAST

Sekali lagi:

JANGAN MENGHAPUS MENU.

JANGAN MENGHAPUS FITUR.

JANGAN MENGUBAH BUSINESS LOGIC.

JANGAN MENGUBAH API.

JANGAN MENGUBAH DATABASE.

JANGAN REWRITE APPLICATION.

HANYA PERBAIKI UI/UX, RESPONSIVENESS, ACCESSIBILITY, LAYOUT, INTERACTION, DAN VISUAL QUALITY.