PRD — CAFE POS & QR ORDERING SYSTEM
=====================================

Dokumen: Product Requirements Document
Nama Produk: Cafe POS
Tipe Produk: Point of Sale + QR Table Ordering
Target: Cafe, Coffee Shop, Restaurant kecil–menengah
Status: Draft / Baseline Development
Versi: 1.0
Tanggal: 2 September 2026


1. RINGKASAN PRODUK
-------------------

Cafe POS adalah sistem operasional cafe yang menggabungkan POS/Kasir, QR Table Ordering, Payment, Kitchen/Bar, dan Waiter.

Pelanggan dapat memindai QR Code yang tersedia di meja, melihat menu, membuat pesanan, melakukan pembayaran melalui QRIS/payment gateway, kemudian pesanan secara otomatis masuk ke dashboard kasir.

Setelah pesanan diproses oleh kitchen/bar dan berstatus READY, waiter menerima informasi untuk mengambil dan mengantarkan pesanan ke meja pelanggan.

Prinsip utama:

SCAN → ORDER → PAY → CONFIRM → PREPARE → READY → DELIVER → COMPLETE


2. PRODUCT VISION
-----------------

Membangun sistem POS cafe modern yang mengurangi antrean, kesalahan pencatatan, salah meja, dan komunikasi manual antara pelanggan, kasir, kitchen/bar, dan waiter.

Sistem harus memiliki satu transactional core sehingga Customer Ordering, Cashier POS, Kitchen Display, dan Waiter Dashboard menggunakan sumber data yang sama.

Produk bukan hanya aplikasi kasir, tetapi Cafe Operational Platform.


3. TUJUAN PRODUK
----------------

Tujuan utama:

1. Memungkinkan pelanggan memesan langsung dari meja melalui QR Code.
2. Menghubungkan pesanan customer secara real-time dengan kasir.
3. Menyediakan pembayaran digital melalui QRIS/payment gateway.
4. Mengurangi kebutuhan kasir mencatat order secara manual.
5. Mengurangi kesalahan nomor meja dan item pesanan.
6. Membantu kitchen/bar memproses pesanan secara terstruktur.
7. Membantu waiter mengetahui pesanan yang siap diantar.
8. Memberikan laporan penjualan dan operasional kepada owner/manager.
9. Menyediakan audit trail untuk transaksi penting.
10. Menjadi fondasi untuk pengembangan inventory, loyalty, multi-outlet, dan analytics.


4. NON-GOALS MVP
----------------

Fitur berikut tidak wajib pada MVP pertama:

- Inventory penuh
- Recipe management
- Purchasing
- Supplier management
- Loyalty
- Membership
- Advanced CRM
- Multi-outlet kompleks
- Accounting penuh
- Payroll
- Advanced marketing automation

Fitur tersebut dapat masuk roadmap fase berikutnya.


5. TARGET USER
--------------

5.1 Customer / Tamu

Karakteristik:
- Tidak wajib memiliki akun.
- Menggunakan smartphone.
- Mengakses sistem melalui browser/PWA.
- Memesan dari meja.

Kebutuhan:
- Menu mudah dipahami.
- Foto produk.
- Harga jelas.
- Checkout sederhana.
- Pembayaran mudah.
- Mengetahui status pesanan.


5.2 Cashier

Tanggung jawab:
- Monitoring order.
- Konfirmasi order.
- Monitoring pembayaran.
- Membuat manual order.
- Membatalkan order sesuai permission.
- Refund sesuai permission.
- Monitoring transaksi.


5.3 Waiter

Tanggung jawab:
- Melihat pesanan READY.
- Mengetahui nomor meja.
- Mengambil pesanan.
- Mengantarkan pesanan.
- Mengubah status menjadi DELIVERED.


5.4 Kitchen / Bar

Tanggung jawab:
- Melihat order yang harus dibuat.
- Mengubah status menjadi PREPARING.
- Menandai pesanan sebagai READY.


5.5 Admin

Tanggung jawab:
- Menu.
- Kategori.
- Produk.
- Variant.
- Modifier.
- Meja.
- QR Code.
- User.
- Role.
- Payment configuration.
- Outlet.
- System settings.


5.6 Owner / Manager

Kebutuhan:
- Dashboard bisnis.
- Omzet.
- Transaksi.
- Average order value.
- Produk terlaris.
- Laporan penjualan.
- Laporan pembayaran.
- Performa operasional.


6. CUSTOMER JOURNEY
-------------------

STEP 1
Customer datang ke cafe.

STEP 2
Customer memilih meja.

STEP 3
Customer scan QR Code yang terdapat di meja.

STEP 4
Sistem mengidentifikasi meja berdasarkan QR.

STEP 5
Customer melihat menu digital.

STEP 6
Customer memilih produk dan konfigurasi item.

STEP 7
Customer memasukkan order ke cart.

STEP 8
Customer checkout.

STEP 9
Customer memilih metode pembayaran.

STEP 10
Customer menyelesaikan pembayaran.

STEP 11
Payment gateway mengirim konfirmasi server-side/webhook.

STEP 12
Order berubah menjadi PAID/CONFIRMED.

STEP 13
Order muncul di dashboard kasir dan kitchen/bar.

STEP 14
Kitchen/bar memproses pesanan.

STEP 15
Order berubah menjadi READY.

STEP 16
Waiter menerima informasi pesanan READY.

STEP 17
Waiter mengambil pesanan dan mengantarkannya ke meja.

STEP 18
Waiter mengubah status menjadi DELIVERED.

STEP 19
Order menjadi COMPLETED sesuai aturan bisnis.


7. QR TABLE SYSTEM
------------------

Setiap meja memiliki QR Code unik.

Contoh:

TABLE-001
TABLE-002
TABLE-003

Contoh URL konseptual:

https://cafe.example/order/T7

QR harus mengandung identitas meja yang dapat diverifikasi server.

Ketika customer scan:

Cafe ABC
Meja 07

Menu akan langsung terbuka dengan konteks meja tersebut.

Fitur QR Management:

- Generate QR
- Download QR
- Print QR
- Regenerate QR
- Disable QR
- Assign QR ke meja
- View QR status

Security requirement:

- Jangan hanya mempercayai table ID dari URL.
- QR token harus dapat divalidasi server.
- QR yang dinonaktifkan tidak boleh membuat order.
- Sistem harus mencegah manipulasi table ID yang tidak sah.


8. CUSTOMER ORDERING
--------------------

Customer dapat melihat:

- Category
- Product
- Product image
- Description
- Price
- Availability
- Variant
- Modifier
- Topping
- Notes
- Quantity

Contoh kategori:

- Coffee
- Non Coffee
- Tea
- Food
- Snack
- Dessert


9. PRODUCT
----------

Field minimum:

- id
- sku
- name
- description
- categoryId
- image
- basePrice
- costPrice
- status
- sortOrder
- createdAt
- updatedAt

Status:

AVAILABLE
OUT_OF_STOCK
INACTIVE


10. PRODUCT VARIANT
-------------------

Variant digunakan untuk pilihan produk.

Contoh:

Iced Latte

Size:
- Regular +0
- Large +5.000

Variant tidak dibuat sebagai produk terpisah.

Struktur konseptual:

Product
  └── ProductVariant


11. MODIFIER
-----------

Modifier digunakan untuk konfigurasi tambahan.

Contoh:

Sugar:
- Normal
- Less Sugar
- No Sugar

Ice:
- Normal
- Less Ice
- No Ice

Topping:
- Extra Shot +8.000
- Whipped Cream +5.000


12. SHOPPING CART
-----------------

Cart minimal menyimpan:

- Product
- Variant
- Modifier
- Quantity
- Unit price
- Discount
- Notes
- Subtotal

Customer dapat:

- Add item
- Increase quantity
- Decrease quantity
- Remove item
- Edit modifier
- Edit note


13. CHECKOUT
------------

Customer memasukkan:

- Customer name
- Phone number (optional)
- Notes (optional)
- Table context

Checkout menampilkan:

Subtotal
Tax
Service charge
Discount
Grand total

Tax dan service charge harus configurable, bukan hardcoded.


14. PAYMENT
----------

Payment layer harus menggunakan abstraction.

Contoh:

PaymentService
  ├── Midtrans
  ├── QRIS
  └── Future Gateway

Tujuan:
Sistem tidak terkunci pada satu payment provider.

Payment status:

PENDING_PAYMENT
PROCESSING
PAID
FAILED
EXPIRED
REFUNDED

Prinsip penting:

Redirect customer bukan sumber kebenaran pembayaran.

Payment harus dikonfirmasi melalui server-side webhook/callback dari payment gateway.

Order tidak boleh dianggap PAID hanya karena customer kembali ke halaman success.


15. ORDER
---------

Order memiliki:

- Internal UUID
- Human-readable order number
- Table ID
- Customer session
- Customer information
- Items
- Payment
- Status
- Timestamps
- Notes

Contoh:

ORDER #A102
Table 07
2 x Iced Latte
1 x French Fries
Total Rp66.550


16. ORDER NUMBER
----------------

Database primary key harus menggunakan UUID/internal ID.

Nomor order untuk manusia harus menggunakan identifier terpisah.

Contoh:

A001
A002
A003

Format dapat disesuaikan per outlet/tanggal.


17. ORDER STATUS STATE MACHINE
-----------------------------

Core lifecycle:

DRAFT
  ↓
PENDING_PAYMENT
  ↓
PAID
  ↓
CONFIRMED
  ↓
PREPARING
  ↓
READY
  ↓
OUT_FOR_DELIVERY
  ↓
DELIVERED
  ↓
COMPLETED

Exception states:

CANCELLED
PAYMENT_FAILED
EXPIRED
REFUNDED

Setiap perubahan status penting harus dicatat dalam OrderStatusHistory.


18. ORDER STATUS RULES
----------------------

DRAFT:
Order belum final.

PENDING_PAYMENT:
Order dibuat tetapi pembayaran belum dikonfirmasi.

PAID:
Pembayaran sudah dikonfirmasi.

CONFIRMED:
Order diterima untuk diproses.

PREPARING:
Kitchen/bar sedang membuat order.

READY:
Pesanan siap diambil waiter.

OUT_FOR_DELIVERY:
Waiter telah mengambil order untuk diantar.

DELIVERED:
Pesanan sudah diterima/diletakkan di meja pelanggan.

COMPLETED:
Transaksi/order selesai.


19. CASHIER DASHBOARD
---------------------

Dashboard kasir harus menjadi pusat monitoring order.

Rekomendasi UI:

ORDER BOARD / KANBAN

Kolom:

NEW / CONFIRMED
PREPARING
READY
OUT FOR DELIVERY
COMPLETED

Setiap card menampilkan:

- Order number
- Table
- Time elapsed
- Items
- Total
- Payment status
- Current status

Kasir dapat:

- View order detail
- Confirm order
- Cancel order sesuai permission
- Monitor payment
- Search order
- Filter order
- Create manual order


20. MANUAL POS ORDER
--------------------

Kasir tetap harus dapat membuat order manual.

Contoh:

NEW ORDER
Table: 07
Customer: Walk-in
Items:
Iced Latte x2
French Fries x1

Payment:
Cash

CREATE ORDER

Alasan:
Tidak semua customer akan menggunakan QR ordering.


21. KITCHEN / BAR DISPLAY
-------------------------

KDS sederhana sebaiknya tersedia sejak awal atau fase kedua.

Contoh:

ORDER #A102
TABLE 07

Iced Latte x2
French Fries x1

Note:
Less sugar

Action:
START

Status:
PREPARING

Setelah selesai:

READY


22. WAITER DASHBOARD
--------------------

Waiter melihat:

READY TO DELIVER

ORDER #A102
TABLE 07

2 x Iced Latte
1 x French Fries

Actions:

AMBIL PESANAN
PESANAN SUDAH DIANTAR

Flow:

READY
  ↓
OUT_FOR_DELIVERY
  ↓
DELIVERED


23. TABLE MANAGEMENT
--------------------

Admin dapat membuat dan mengelola meja.

Field:

- id
- outletId
- tableNumber
- name/label
- capacity
- status
- qrToken
- active

Status meja dapat berupa:

AVAILABLE
OCCUPIED
ORDERING
PREPARING
WAITING_DELIVERY
COMPLETED
RESERVED
DISABLED

Status meja harus diturunkan dari kondisi order bila memungkinkan, bukan menjadi sumber data duplikatif yang sulit sinkron.


24. QR MANAGEMENT
-----------------

Admin dapat:

- Generate QR
- Print QR
- Download QR
- Regenerate QR
- Disable QR
- Reassign QR

QR harus dapat dicetak dalam format yang cocok untuk meja.

Contoh:

CAFE ABC
MEJA 07

Scan untuk memesan


25. PAYMENT METHODS
-------------------

Minimal:

- Cash
- QRIS
- Payment Gateway

Future:

- Debit Card
- Credit Card
- E-Wallet
- Bank Transfer

Payment method harus configurable.


26. REAL-TIME NOTIFICATION
--------------------------

Sistem sebaiknya menggunakan real-time event.

Contoh:

Customer membuat order
  ↓
Backend
  ├── Cashier
  ├── Kitchen
  └── Waiter

Dashboard menerima event tanpa refresh browser.

Teknologi yang direkomendasikan:

WebSocket

Alternatif:
Server-Sent Events untuk kebutuhan satu arah.


27. CUSTOMER ORDER TRACKING
---------------------------

Customer tidak hanya melihat Payment Success.

Customer mendapatkan status:

✓ Payment
✓ Order Confirmed
✓ Preparing
● Ready
○ Delivered
○ Completed

Tracking dapat diakses dari browser/session yang sama.


28. CUSTOMER SESSION
--------------------

Customer tidak wajib login.

Flow:

QR
 ↓
Anonymous Session
 ↓
Table Context
 ↓
Cart
 ↓
Order

Session harus memiliki expiration policy.

Order tetap tersimpan walaupun session berakhir.


29. ADMIN DASHBOARD
-------------------

Menu utama:

- Dashboard
- Orders
- Tables
- Menu
- Categories
- Products
- Variants
- Modifiers
- QR Codes
- Payments
- Kitchen
- Waiters
- Users
- Reports
- Audit Logs
- Settings


30. OWNER DASHBOARD
-------------------

KPI utama:

- Revenue today
- Orders today
- Average Order Value
- Number of customers/orders
- Best selling products
- Payment breakdown
- Order completion time

Contoh:

Revenue
Rp8.450.000

Orders
127

Average Order
Rp66.535


31. REPORTING
-------------

Sales Report:
- Daily
- Weekly
- Monthly
- Custom date range

Product Report:
- Best seller
- Quantity sold
- Revenue
- Product performance

Payment Report:
- Cash
- QRIS
- Payment Gateway
- Failed payment
- Refunded

Operational Report:
- Average preparation time
- Average delivery time
- Order completion time


32. AUDIT LOG
-------------

Audit log wajib mencatat aktivitas kritis.

Contoh:

02 Sep 2026 14:02
Cashier
Cancelled Order #A103
Reason: Customer cancelled

Aktivitas yang dicatat:

- Login
- Logout
- Order cancellation
- Refund
- Price change
- Product change
- Payment adjustment
- User permission change
- Manual order
- Important status changes


33. ROLE & PERMISSION
---------------------

ADMIN:
Full system access.

OWNER:
Business dashboard, reports, operational visibility.

CASHIER:
Orders, payments, manual orders, limited cancellation.

WAITER:
Ready orders, delivery, table visibility.

KITCHEN:
Preparation queue and preparation status.

Permission harus berbasis role dan dapat dikembangkan menjadi granular permission.


34. DATABASE ENTITY MODEL
-------------------------

Entitas inti:

Company
Outlet
User
Role
Permission
Table
QRCode
Category
Product
ProductVariant
ModifierGroup
ModifierOption
Order
OrderItem
Payment
OrderStatusHistory
CustomerSession
AuditLog

Relasi konseptual:

Company
  └── Outlet
      ├── Tables
      ├── Users
      ├── Categories
      │    └── Products
      │         ├── Variants
      │         └── Modifiers
      └── Orders
           ├── OrderItems
           ├── Payments
           └── OrderStatusHistory


35. INVENTORY ROADMAP
---------------------

Inventory penuh bukan MVP, tetapi arsitektur harus memungkinkan pengembangan.

Contoh recipe:

Iced Latte
  ├── Espresso 18g
  ├── Milk 150ml
  └── Sugar 10g

Ketika order diproses, inventory dapat dikurangi berdasarkan recipe.

Fase inventory:

- Stock item
- Unit
- Recipe
- Stock movement
- Purchase
- Supplier
- Stock opname
- Food cost


36. MULTI-OUTLET
---------------

Arsitektur sebaiknya sejak awal menggunakan outletId pada data operasional.

Contoh:

Company
  ├── Outlet A
  ├── Outlet B
  └── Outlet C

Data seperti berikut harus dapat dibatasi per outlet:

- Tables
- Orders
- Users
- Menu availability
- Pricing
- Payment configuration
- Reports

Jangan menambahkan multi-outlet sebagai refactor besar di akhir.


37. SECURITY REQUIREMENTS
-------------------------

Minimum:

- HTTPS
- Secure authentication
- Password hashing
- Role-based access control
- Server-side authorization
- Input validation
- Rate limiting
- Secure session/token management
- Payment webhook signature validation
- Audit logging
- Protection terhadap duplicate payment webhook
- Protection terhadap duplicate order submission
- Protection terhadap manipulated prices
- Protection terhadap manipulated table ID

Harga produk yang digunakan saat order harus disimpan sebagai snapshot pada OrderItem.

Jangan menghitung ulang transaksi lama berdasarkan harga master saat ini.


38. PAYMENT SECURITY
--------------------

Server harus:

1. Membuat payment request.
2. Menyimpan payment reference.
3. Menunggu callback/webhook.
4. Memvalidasi webhook.
5. Memastikan transaction ID tidak diproses dua kali.
6. Mengubah Payment status.
7. Mengubah Order status.
8. Mencatat audit/event.

Webhook harus idempotent.


39. ORDER IDEMPOTENCY
--------------------

Sistem harus mencegah:

- double click checkout
- duplicate order
- duplicate webhook
- duplicate payment confirmation

Gunakan idempotency key untuk operasi yang relevan.


40. NON-FUNCTIONAL REQUIREMENTS
------------------------------

Performance:

- Customer page harus cepat pada koneksi mobile.
- Dashboard harus mampu menampilkan order real-time.
- API response untuk operasi normal ditargetkan cepat dan konsisten.
- Query database harus menggunakan index yang sesuai.

Availability:

- Sistem harus mampu tetap beroperasi sepanjang jam operasional cafe.
- Payment failure tidak boleh menyebabkan kehilangan order.

Scalability:

- Multi-outlet ready.
- Realtime ready.
- Queue/event architecture ready.
- Storage terpisah dari database untuk image.


41. RECOMMENDED TECHNOLOGY STACK
--------------------------------

Frontend Customer:

Next.js
PWA
Responsive Mobile-first UI

POS:

Next.js / React
PWA
Desktop-first untuk cashier
Mobile-first untuk waiter

Backend:

NestJS
REST API
WebSocket

Database:

PostgreSQL
Prisma ORM

Cache / Realtime Support:

Redis

Storage:

S3-compatible object storage

Payment:

Midtrans atau payment provider melalui PaymentService abstraction.


42. SYSTEM ARCHITECTURE
-----------------------

CUSTOMER
   │
 QR CODE
   │
   ▼
Customer Web/PWA
   │
   ▼
REST API / Backend
   │
   ├── Order Service
   ├── Payment Service
   ├── Catalog Service
   ├── Table Service
   ├── User/Auth Service
   └── Reporting Service
   │
   ▼
PostgreSQL

Realtime Gateway
   ├── Cashier
   ├── Kitchen
   └── Waiter

Payment Service
   └── Midtrans / Other Gateway


43. FRONTEND APPLICATION STRUCTURE
-----------------------------------

Customer App:

/menu
/cart
/checkout
/payment
/order/[id]
/order/[id]/tracking

Cashier:

/dashboard
/orders
/orders/[id]
/tables
/payments
/reports

Waiter:

/waiter
/waiter/ready
/waiter/order/[id]

Kitchen:

/kitchen
/kitchen/order/[id]

Admin:

/admin
/admin/menu
/admin/products
/admin/categories
/admin/tables
/admin/qr
/admin/users
/admin/settings
/admin/reports


44. UI/UX PRINCIPLES
--------------------

Desain harus:

- Modern
- Premium
- Clean
- Intuitive
- Responsive
- Consistent
- Fast
- Touch-friendly
- Accessible

Customer UI:

Mobile-first.

Prioritas:

1. Menu discovery
2. Product selection
3. Cart
4. Checkout
5. Payment
6. Order tracking

Cashier UI:

Desktop-first.

Prioritas:

1. New orders
2. Current orders
3. Payment status
4. Table
5. Operational status

Waiter UI:

Mobile-first.

Prioritas:

1. Ready orders
2. Table number
3. Order items
4. Delivery action


45. DESIGN SYSTEM
-----------------

Disarankan menggunakan design token:

- Typography scale
- Spacing scale
- Border radius
- Shadow
- Surface
- Color semantic
- Status color
- Button hierarchy
- Form controls

Status color harus konsisten:

Success
Warning
Error
Info
Neutral

Jangan menggunakan terlalu banyak warna dekoratif.


46. MVP SCOPE
------------

MVP wajib:

Authentication
Role & Permission dasar
Menu
Category
Product
Table
QR Table
Customer Ordering
Cart
Checkout
Payment
Payment webhook
Order
Cashier Dashboard
Order Status
Manual POS Order
Waiter Dashboard
Basic Kitchen/Bar queue
Basic Reporting
Audit Log dasar


47. PHASE 2
----------

- Advanced Kitchen Display
- Real-time notifications
- Customer tracking
- Product variant
- Modifier
- Topping
- Discount
- Promo
- Voucher
- Advanced reporting
- Customer database


48. PHASE 3
----------

- Inventory
- Recipe
- Stock movement
- Purchasing
- Supplier
- Stock opname
- Food cost
- Cost analysis


49. PHASE 4
----------

- Multi-outlet advanced management
- Loyalty
- Membership
- Customer CRM
- Voucher engine
- Marketing automation
- Advanced analytics
- Forecasting


50. CORE ACCEPTANCE CRITERIA
----------------------------

AC-01:
Customer dapat scan QR meja dan sistem mengetahui meja.

AC-02:
Customer dapat melihat menu aktif.

AC-03:
Customer dapat menambahkan item ke cart.

AC-04:
Customer dapat checkout.

AC-05:
Customer dapat membayar melalui payment provider.

AC-06:
Order hanya menjadi PAID setelah server menerima dan memvalidasi payment confirmation.

AC-07:
Order PAID muncul di cashier dashboard.

AC-08:
Order dapat diproses oleh kitchen/bar.

AC-09:
Order READY muncul di waiter dashboard.

AC-10:
Waiter dapat mengambil order.

AC-11:
Waiter dapat mengubah status menjadi DELIVERED.

AC-12:
Order memiliki status history.

AC-13:
Kasir dapat membuat manual order.

AC-14:
Admin dapat membuat meja dan QR.

AC-15:
Admin dapat mengelola menu.

AC-16:
Owner dapat melihat laporan dasar.

AC-17:
Operasi penting tercatat dalam audit log.

AC-18:
Duplicate payment webhook tidak boleh menghasilkan transaksi ganda.

AC-19:
Customer tidak dapat mengubah harga item melalui frontend.

AC-20:
QR yang disabled tidak dapat digunakan untuk membuat order baru.


51. EDGE CASES
-------------

Sistem harus menangani:

1. Payment timeout.
2. Payment failed.
3. Payment expired.
4. Customer menutup browser sebelum pembayaran selesai.
5. Customer refresh halaman checkout.
6. Customer double-click tombol bayar.
7. Webhook masuk lebih dari sekali.
8. Produk habis setelah customer memasukkan ke cart.
9. Harga produk berubah setelah customer membuka menu.
10. QR meja dinonaktifkan.
11. Meja berpindah status.
12. Order dibatalkan oleh kasir.
13. Refund.
14. Kitchen menolak/mengembalikan order.
15. Waiter belum mengantar order.
16. Customer kehilangan session browser.
17. Internet cafe terputus sementara.
18. Payment gateway mengalami gangguan.


52. IMPORTANT BUSINESS RULES
----------------------------

Rule 01:
Order harus menyimpan snapshot harga saat checkout.

Rule 02:
Customer tidak boleh menentukan status PAID.

Rule 03:
Frontend tidak boleh menjadi sumber kebenaran pembayaran.

Rule 04:
Payment webhook harus idempotent.

Rule 05:
Setiap order memiliki history status.

Rule 06:
Setiap QR terhubung ke satu meja aktif.

Rule 07:
Satu transaksi harus mempunyai satu sumber kebenaran di backend.

Rule 08:
Cashier, kitchen, waiter, dan customer melihat data dari transactional core yang sama.

Rule 09:
Permission harus divalidasi di backend, bukan hanya disembunyikan di UI.

Rule 10:
Harga, diskon, pajak, dan service charge harus dihitung/validasi server-side.


53. SUCCESS METRICS
-------------------

Metrik utama:

- Persentase order melalui QR
- Average Order Value
- Average preparation time
- Average delivery time
- Order completion time
- Payment success rate
- Payment failure rate
- Cancellation rate
- Duplicate order rate
- Best selling products
- Revenue per outlet
- Orders per hour

Target KPI dapat ditentukan setelah baseline operasional cafe tersedia.


54. DEVELOPMENT PRIORITY
------------------------

Urutan implementasi:

1. Database / ERD
2. Authentication
3. Role & Permission
4. Catalog/Menu
5. Table
6. QR
7. Customer Session
8. Cart
9. Order Engine
10. Payment abstraction
11. Payment webhook
12. Cashier Dashboard
13. Kitchen/Bar
14. Waiter Dashboard
15. Real-time
16. Reports
17. Audit
18. Hardening/Security
19. Testing
20. Production deployment


55. TESTING STRATEGY
-------------------

Unit Test:

- Price calculation
- Discount
- Tax
- Service charge
- Order state transition
- Payment state transition
- Permission

Integration Test:

- Create order
- Payment webhook
- Duplicate webhook
- Order status update
- QR validation

E2E Test:

Customer:
Scan → Order → Pay → Track

Cashier:
Receive → Confirm → Monitor

Kitchen:
Receive → Preparing → Ready

Waiter:
Ready → Pick up → Deliver


56. PRODUCTION READINESS CHECKLIST
-----------------------------------

Security:
- HTTPS
- Authentication
- Authorization
- Webhook validation
- Rate limiting
- Input validation
- Audit logging

Database:
- Migration strategy
- Backup
- Index
- Transaction handling
- Foreign key integrity

Payment:
- Webhook
- Idempotency
- Failure handling
- Refund handling

Application:
- Error logging
- Monitoring
- Health check
- Graceful failure
- Environment separation

Deployment:
- Development
- Staging
- Production
- Environment variables
- Secret management
- Automated deployment


57. FINAL PRODUCT FLOW
----------------------

                  CUSTOMER
                     │
                  SCAN QR
                     │
                     ▼
              DIGITAL MENU
                     │
                   ORDER
                     │
                     ▼
                 CHECKOUT
                     │
                     ▼
              QRIS / PAYMENT
                     │
              PAYMENT SUCCESS
                     │
                     ▼
              ORDER CONFIRMED
                     │
                     ▼
               CASHIER / KDS
                     │
                     ▼
                PREPARING
                     │
                     ▼
                  READY
                     │
                     ▼
                  WAITER
                     │
                     ▼
                TABLE 07
                     │
                 DELIVERED
                     │
                     ▼
                COMPLETED


58. PRODUCT POSITIONING
-----------------------

Jangan memposisikan produk hanya sebagai:

"Aplikasi Kasir Cafe."

Positioning yang lebih kuat:

"Digital Cafe Ordering System — pelanggan scan QR, pesan dan bayar dari meja, sementara seluruh operasional pesanan terhubung langsung ke kasir, kitchen, dan waiter."


59. ARCHITECTURAL DECISION
--------------------------

Customer Ordering, Cashier POS, Kitchen Display, dan Waiter App tidak boleh memiliki backend/transaksi yang terpisah.

Gunakan satu transactional core.

Order menjadi central domain entity.

Semua interface mengakses sumber data yang sama melalui backend.

Dengan pendekatan ini:

- status order konsisten
- payment konsisten
- audit konsisten
- reporting konsisten
- realtime lebih mudah
- multi-outlet lebih mudah
- pengembangan fitur lebih scalable


60. KESIMPULAN
--------------

Cafe POS dirancang sebagai platform operasional cafe dengan alur utama:

SCAN
→ ORDER
→ PAY
→ CONFIRM
→ PREPARE
→ READY
→ DELIVER
→ COMPLETE

MVP harus fokus pada transaksi end-to-end yang stabil.

Prioritas utama bukan jumlah fitur, tetapi correctness dari:

1. Table identification
2. Order creation
3. Price calculation
4. Payment confirmation
5. Order state machine
6. Kitchen processing
7. Waiter delivery
8. Audit trail

Setelah core transaction stabil, sistem dapat diperluas ke inventory, loyalty, CRM, multi-outlet, analytics, dan fitur enterprise.


END OF PRD
========== 
