# Naltech CCTV Cloud Project Status

Tanggal checkpoint: 18 Juni 2026

Dokumen ini menjelaskan kondisi aplikasi Naltech CCTV Cloud saat ini setelah API utama mulai memakai Prisma dan PostgreSQL.

## Ringkasan

Naltech CCTV Cloud saat ini sudah berbentuk aplikasi Next.js dengan landing page, dashboard admin, halaman pelanggan, halaman kamera, billing, customer portal, API internal, dan rancangan database Prisma.

Project sudah bergeser dari demo visual menjadi fondasi aplikasi operasional.

## Tech Stack Saat Ini

- Framework: Next.js 16
- UI: React 19
- Styling: CSS global custom di `app/globals.css`
- Data API utama: Prisma + PostgreSQL
- Database: PostgreSQL lokal sudah dimigrasikan dan sudah punya seed data awal
- ORM yang sudah dipasang: Prisma 7
- Target database: PostgreSQL
- Bahasa: TypeScript

## Struktur Penting

```text
app/
  page.tsx                         Landing page
  admin/page.tsx                   Dashboard admin sales & operasional
  customer/page.tsx                Kelola pelanggan
  camera/page.tsx                  Manajemen kamera
  billing/page.tsx                 Billing & tagihan
  users/page.tsx                   User management admin
  customer-portal/page.tsx         Portal pelanggan
  customer/[id]/page.tsx           Detail pelanggan
  login/page.tsx                   Pilih akses admin/customer
  api/
    leads/route.ts                 GET/POST lead
    leads/[id]/status/route.ts     PATCH status lead
    cameras/route.ts               GET/POST kamera cloud
    cameras/[id]/route.ts          PATCH/DELETE kamera cloud
    customers/route.ts             GET customer aktif
    customers/[id]/route.ts        GET detail customer
    invoices/route.ts              GET invoice
    users/route.ts                 GET/POST user
    users/[id]/route.ts            PATCH/DELETE user

components/
  Brand.tsx
  DashboardShell.tsx
  PublicHeader.tsx
  CameraPreview.tsx

data/
  operational.ts                   Seed data operasional

lib/
  api.ts                           Client API wrapper
  operational.ts                   Helper status, slug, storage key lama
  pricing.ts                       Helper harga dan format rupiah
  server/prisma.ts                 Prisma Client singleton
  server/repository.ts             Repository database Prisma
  server/store.ts                  Server memory store lama, tidak dipakai API utama

types/
  operational.ts                   Type domain utama

docs/
  api-contract.md
  database-schema.md
  project-status.md

prisma/
  schema.prisma
  seed.mjs
```

## Halaman Aplikasi

### Landing Page

Route:

```text
/
```

Status:

- Sudah punya desain landing page Naltech CCTV Cloud.
- Sudah ada form permintaan survey.
- Form sudah memakai `POST /api/leads`.
- Setelah lead tersimpan, aplikasi membuka WhatsApp dengan pesan otomatis.
- Nomor WhatsApp sementara: `0815 7355 0017`.
- Payload lead sudah divalidasi di server dengan error per field.

Catatan:

- Data lead tersimpan ke PostgreSQL melalui API Prisma.

### Admin Dashboard

Route:

```text
/admin
```

Status:

- Menampilkan ringkasan lead.
- Menampilkan daftar lead survey terbaru.
- Bisa update status lead lewat dropdown.
- Bisa aktivasi lead menjadi `Pilot aktif`.
- Update status sudah memakai `PATCH /api/leads/:id/status`.
- Follow-up WhatsApp sudah tersedia dari detail lead.

Catatan:

- Data lead diambil dari `GET /api/leads`.
- Status yang diubah tersimpan ke PostgreSQL melalui API Prisma.
- Route admin dan API operasional dilindungi session role `admin`.

### Kelola Pelanggan

Route:

```text
/customer
```

Status:

- Dipakai sebagai halaman admin untuk mengelola pelanggan.
- Mengambil pelanggan aktif dari `GET /api/customers`.
- Mengambil semua lead dari `GET /api/leads` untuk menghitung pipeline.
- Hanya lead dengan status `Pilot aktif` yang tampil sebagai pelanggan aktif.
- Menampilkan total pelanggan, kamera cloud, status aktif, dan MRR berjalan.
- Sudah ada search topbar untuk nama, area, paket, dan kamera.
- Sudah ada filter paket dan status pelanggan.

Catatan:

- Customer aktif sudah berasal dari tabel database customer.
- Lead dengan status `Pilot aktif` otomatis di-upsert menjadi customer aktif.

### Manajemen Kamera

Route:

```text
/camera
```

Status:

- Halaman Kamera sudah dibuat sendiri.
- Sidebar Kamera sudah mengarah ke `/camera`.
- Menampilkan total kamera, online, offline, retensi aktif.
- Menampilkan daftar kamera dan status koneksi.
- Sudah bisa tambah, edit, dan hapus kamera dari dashboard.
- Sudah ada search topbar untuk nama kamera, pelanggan, dan lokasi.
- Sudah ada filter status kamera online/offline.

Catatan:

- Data kamera sudah diambil dari `GET /api/cameras`.
- Mutation kamera memakai `POST /api/cameras`, `PATCH /api/cameras/:id`, dan `DELETE /api/cameras/:id`.
- Payload kamera sudah divalidasi di server untuk customer, nama, lokasi, status, retensi, dan minimal field saat update.

### Billing & Tagihan

Route:

```text
/billing
```

Status:

- Menampilkan invoice pelanggan aktif.
- Data invoice diambil dari `GET /api/invoices`.
- Menampilkan MRR aktif, paid, unpaid, dan total invoice.
- Sudah bisa buat, edit status, dan hapus invoice dari dashboard.
- Sudah ada search topbar untuk invoice, customer, area, paket, status, dan jatuh tempo.
- Sudah ada filter status invoice.
- Invoice Unpaid/Overdue sudah bisa dibuka sebagai draft reminder WhatsApp satu per satu.
- Sudah bisa mencatat pembayaran penuh maupun parsial.
- Menampilkan total dibayar, sisa tagihan, metode, referensi, dan riwayat pembayaran.
- Status Paid dihitung otomatis dari akumulasi pembayaran.
- Pembayaran yang salah input dapat dihapus dan saldo invoice dihitung ulang.

Catatan:

- Invoice diambil dari PostgreSQL melalui API Prisma.
- Mutation invoice memakai `POST /api/invoices`, `PATCH /api/invoices/:id`, dan `DELETE /api/invoices/:id`.
- Payload invoice sudah divalidasi di server untuk customer, status, tanggal, nominal, dan jumlah kamera.
- Nomor WhatsApp invoice berasal dari data customer; tombol reminder dinonaktifkan jika nomor belum tersedia.
- Payment tracking memakai tabel Payment dan endpoint invoice payments.

### Customer Portal

Route:

```text
/customer-portal
```

Status:

- Sudah ada tampilan portal pelanggan.
- Menampilkan live view, paket, tagihan terbaru, playback, storage, dan status kamera.
- Admin dapat memilih customer melalui parameter `customerId`.
- Customer login otomatis dikunci ke customer yang terhubung dengan akunnya.
- Data profil, kamera, paket, dan invoice berasal dari PostgreSQL melalui repository Prisma.
- Link portal dari halaman Kelola Pelanggan dan Customer Detail membawa customer ID yang sesuai.

Catatan:

- Playback dan persentase storage masih berupa simulasi UI berdasarkan status/retensi kamera.
- Belum ada streaming atau file rekaman CCTV asli.

### Customer Detail

Route:

```text
/customer/[id]
```

Status:

- Sudah ada halaman detail pelanggan.
- Menampilkan profil pelanggan, paket, kamera, tagihan terbaru/estimasi, dan aksi cepat.
- Mengambil data dari database melalui repository Prisma.

Catatan:

- Route memakai ID customer database.
- Jika customer tidak ditemukan, halaman menampilkan `notFound`.

### Login

Route:

```text
/login
```

Status:

- Login credentials admin/customer sudah tersedia.
- Password disimpan sebagai hash `scrypt`.
- Login menghasilkan cookie session HTTP-only yang ditandatangani HMAC.
- Admin diarahkan ke `/admin`.
- Customer diarahkan ke portal customer yang terhubung ke akun.
- Logout menghapus cookie session.

Catatan:

- `proxy.ts` melindungi halaman dan API operasional.
- Customer tidak dapat mengakses dashboard/API admin atau mengganti `customerId` untuk melihat customer lain.
- Session berlaku 7 hari.

### User Management

Route:

```text
/users
```

Status:

- Sudah ada halaman admin untuk melihat user sistem.
- Bisa membuat akun `admin`, `sales`, `technician`, dan `customer`.
- Bisa mengedit nama, email, role, relasi customer, dan reset password.
- Bisa menghapus user dengan proteksi agar akun yang sedang login tidak menghapus dirinya sendiri.
- Sistem menjaga minimal satu user admin aktif.
- User role `customer` wajib dihubungkan ke customer aktif.
- Sudah ada search topbar untuk nama, email, role, dan customer.
- Sudah ada filter role user.

Catatan:

- Password disimpan memakai hash `scrypt`.
- Satu customer hanya bisa terhubung ke satu user portal.

## Navigasi Saat Ini

Sidebar admin:

- Overview
- Pelanggan
- Kamera
- Billing
- User

Menu `Leads` sudah dihapus karena lead masih menjadi bagian dari Overview.

Sidebar customer:

- Overview
- Live View
- Playback
- Paket Saya
- Support

## API Internal

Dokumen kontrak:

```text
docs/api-contract.md
```

Endpoint tersedia:

```text
GET    /api/leads
POST   /api/leads
PATCH  /api/leads/:id/status
GET    /api/customers
GET    /api/customers/:id
GET    /api/cameras
POST   /api/cameras
PATCH  /api/cameras/:id
DELETE /api/cameras/:id
GET    /api/invoices
POST   /api/invoices
PATCH  /api/invoices/:id
DELETE /api/invoices/:id
GET    /api/users
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
```

Status integrasi frontend:

- Landing page sudah memakai `POST /api/leads`.
- Admin dashboard sudah memakai `GET /api/leads`.
- Update status lead sudah memakai `PATCH /api/leads/:id/status`.
- Kelola pelanggan sudah memakai `GET /api/customers`.
- Customer detail sudah memakai data customer dari database.
- Manajemen Kamera sudah memakai `GET /api/cameras`, `POST /api/cameras`, `PATCH /api/cameras/:id`, dan `DELETE /api/cameras/:id`.
- Billing sudah memakai `GET /api/invoices`, `POST /api/invoices`, `PATCH /api/invoices/:id`, dan `DELETE /api/invoices/:id`.
- User Management sudah memakai `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, dan `DELETE /api/users/:id`.

Catatan:

- API leads, customers, customer detail, cameras, dan invoices sudah memakai Prisma.
- API leads, status lead, cameras, dan invoices sudah memakai helper validasi dan format error konsisten.
- API users sudah memakai helper validasi dan format error konsisten.
- Repository database utama ada di `lib/server/repository.ts`.
- `lib/server/store.ts` adalah implementasi lama berbasis memory dan tidak dipakai API utama.

## Domain Types

File:

```text
types/operational.ts
```

Tipe utama:

- `CloudPackage`
- `LeadStatus`
- `CustomerStatus`
- `InvoiceStatus`
- `Lead`
- `LeadWithId`
- `Camera`
- `ManagedCamera`
- `CameraPayload`
- `CustomerDetail`
- `Invoice`
- `OperationalStat`

## Pricing Logic

File:

```text
lib/pricing.ts
```

Harga saat ini:

| Package | Harga per kamera/bulan |
| --- | ---: |
| Basic | Rp45.000 |
| Standard | Rp65.000 |
| Pro | Rp110.000 |

Helper tersedia:

- `formatRupiah`
- `calculateMonthlyAmount`

## Database & Prisma

Dokumen rancangan database:

```text
docs/database-schema.md
```

File Prisma:

```text
prisma/schema.prisma
prisma.config.ts
.env.example
```

Prisma status:

- Prisma sudah terinstall.
- Prisma Client sudah berhasil digenerate.
- Schema Prisma sudah valid.
- Target provider: PostgreSQL.
- Config sudah mengikuti Prisma 7 memakai `prisma.config.ts`.

Script tersedia:

```text
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Status command terakhir:

- `npm run db:validate`: sukses
- `npm run db:generate`: sukses
- `npm run db:migrate -- --name init`: sukses
- `npm run db:seed`: sukses
- `npm run build`: sukses

Catatan:

- API utama sudah dipindah dari server memory ke Prisma.
- Database PostgreSQL sudah menjadi sumber data untuk leads, customers, dan invoices.

Database lokal saat ini:

- Users: 2
- Leads: 3
- Customers: 1
- Invoices: 1

## Environment

File contoh:

```text
.env.example
```

Isi saat ini:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/naltech_cctv_cloud?schema=public"
```

File lokal:

```text
.env
```

Catatan:

- `.env` sudah dimasukkan ke `.gitignore`.
- Database URL masih default local development.

## Yang Sudah Selesai

- Landing page brand Naltech CCTV Cloud.
- Logo dan identitas bisnis dasar.
- Dashboard admin.
- Kelola pelanggan.
- Halaman kamera.
- Billing.
- Customer portal.
- Customer detail.
- Login access selector.
- API internal tahap awal.
- Dokumen kontrak API.
- Dokumen database schema & relationship.
- Prisma install.
- Prisma schema.
- Prisma config versi 7.
- Prisma generate berhasil.
- PostgreSQL local connection berhasil.
- Migrasi database pertama berhasil.
- Seed database awal berhasil.
- API utama sudah membaca/menulis lewat Prisma.
- Customer detail sudah membaca data customer, kamera, dan invoice terbaru dari Prisma.
- CRUD kamera sudah berjalan lewat Prisma dan UI dashboard.
- CRUD invoice sudah berjalan lewat Prisma dan UI dashboard.
- Customer portal sudah membaca customer, kamera, paket, dan invoice dari Prisma.
- Autentikasi credentials, session cookie, role protection, dan logout sudah berjalan.
- Migration relasi akun customer sudah diterapkan.
- Build Next.js berhasil.

## Yang Masih Sementara

- Belum ada fitur lupa/reset password.
- Belum ada pengelolaan akun user dari dashboard.
- Belum ada upload/stream CCTV asli.
- Belum ada storage recording asli.

## Risiko Teknis Saat Ini

- Belum ada validasi request yang kuat.
- Session masih stateless dan belum memiliki revocation list per perangkat.
- Password seed lokal wajib diganti sebelum deployment.
- Prisma 7 membutuhkan pola config baru; penggunaan Prisma Client ke database perlu mengikuti setup versi 7.
- Warning Next.js masih muncul karena ada multiple lockfile di parent folder.

## Next Step Rekomendasi

Urutan paling masuk akal:

1. Tambahkan validasi request yang lebih kuat.
2. Tambahkan pengelolaan akun dan reset password.
3. Tambahkan filtering/searching dashboard yang terhubung data.
4. Tambahkan payment reminder billing.
5. Rancang integrasi stream dan playback CCTV asli.

## Command Penting

```bash
npm run dev
npm run build
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Checkpoint Decision

Sebelum lanjut coding berikutnya, keputusan yang perlu dibuat:

1. Database mau lanjut local PostgreSQL dulu atau langsung Supabase/Neon?
2. Auth mau dibuat sendiri atau pakai NextAuth/Auth.js?
3. Customer portal mau berbasis customer login beneran atau masih pilih customer manual dulu?
4. Kamera asli akan diintegrasikan lewat RTSP/HLS langsung, NVR API, atau provider cloud recording tertentu?
