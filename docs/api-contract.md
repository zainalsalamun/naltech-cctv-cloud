# Naltech CCTV Cloud API Contract

Dokumen ini mendefinisikan kontrak API internal untuk alur operasional Naltech CCTV Cloud. Saat ini endpoint utama `leads`, `customers`, dan `invoices` sudah membaca/menulis data melalui Prisma ke PostgreSQL.

## Base URL

```text
/api
```

Untuk local development:

```text
http://localhost:3000/api
```

## Data Model

### CloudPackage

```ts
type CloudPackage = "Basic" | "Standard" | "Pro";
```

### LeadStatus

```ts
type LeadStatus =
  | "Baru"
  | "Menunggu follow-up"
  | "Follow-up"
  | "Survey dijadwalkan"
  | "Pilot aktif"
  | "Tidak lanjut";
```

### InvoiceStatus

```ts
type InvoiceStatus = "Paid" | "Unpaid" | "Overdue" | "Draft";
```

### Lead

```ts
type Lead = {
  id: string;
  name: string;
  phone?: string;
  segment: string;
  cameras: number;
  package: CloudPackage;
  status: LeadStatus;
  area: string;
  notes?: string;
  createdAt?: string;
};
```

### Invoice

```ts
type Invoice = {
  id: string;
  customerId: string;
  customer: string;
  customerPhone?: string;
  area: string;
  cameras: number;
  package: CloudPackage;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  payments: Payment[];
};

type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  method: "Transfer Bank" | "Tunai" | "E-Wallet" | "Lainnya";
  reference?: string;
  notes?: string;
  paidAt: string;
  createdAt: string;
};
```

### ManagedCamera

```ts
type ManagedCamera = {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  location: string;
  status: "Online" | "Offline";
  retention: string;
  cloudRecordingEnabled: boolean;
  lastOnlineAt?: string;
};
```

### ManagedUser

```ts
type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "sales" | "technician" | "customer";
  customerId?: string;
  customerName?: string;
  createdAt: string;
};
```

## Response Format

Response sukses memakai format:

```json
{
  "data": {}
}
```

Response error memakai format:

```json
{
  "message": "Pesan error",
  "issues": [
    {
      "field": "name",
      "message": "Nama wajib diisi."
    }
  ]
}
```

Field `issues` hanya dikirim untuk error validasi input. Error seperti `404` tetap cukup memakai `message`.

## Endpoints

### Login

Memverifikasi credentials dan membuat cookie session HTTP-only.

```http
POST /api/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "admin@naltech.id",
  "password": "password-user"
}
```

Response `200`:

```json
{
  "data": {
    "redirectTo": "/admin",
    "user": {
      "name": "Admin Naltech",
      "role": "admin"
    }
  }
}
```

### Logout

Menghapus cookie session dan kembali ke login.

```http
POST /api/auth/logout
```

Response: redirect `303` ke `/login`.

### Get Leads

Mengambil semua lead, termasuk seed data dan lead baru.

```http
GET /api/leads
```

Response `200`:

```json
{
  "data": [
    {
      "id": "seed-toko-sumber-rejeki",
      "name": "Toko Sumber Rejeki",
      "segment": "Toko",
      "cameras": 4,
      "package": "Standard",
      "status": "Survey dijadwalkan",
      "area": "Sleman"
    }
  ]
}
```

### Create Lead

Membuat lead baru dari landing page atau input admin.

```http
POST /api/leads
Content-Type: application/json
```

Request body:

```json
{
  "name": "Toko Baru",
  "phone": "081573550017",
  "segment": "Toko",
  "cameras": 4,
  "package": "Standard",
  "area": "Sleman",
  "notes": "Ingin backup kamera kasir dan gudang"
}
```

Field wajib:

- `name`
- `segment`
- `cameras`
- `package`

Default server:

- `status`: `"Baru"`
- `area`: `"Yogyakarta"` jika tidak dikirim
- `createdAt`: waktu request diterima

Response `201`:

```json
{
  "data": {
    "id": "lead-1779700000000",
    "name": "Toko Baru",
    "phone": "081573550017",
    "segment": "Toko",
    "cameras": 4,
    "package": "Standard",
    "status": "Baru",
    "area": "Sleman",
    "notes": "Ingin backup kamera kasir dan gudang",
    "createdAt": "2026-05-25T10:00:00.000Z"
  }
}
```

Response `400`:

```json
{
  "message": "Nama, jenis lokasi, jumlah kamera, dan paket wajib diisi.",
  "issues": [
    {
      "field": "cameras",
      "message": "Jumlah kamera harus angka lebih dari 0."
    }
  ]
}
```

### Update Lead Status

Mengubah status lead. Status `"Pilot aktif"` akan membuat lead muncul sebagai customer aktif dan masuk ke invoice.

```http
PATCH /api/leads/:id/status
Content-Type: application/json
```

Request body:

```json
{
  "status": "Pilot aktif"
}
```

Response `200`:

```json
{
  "data": {
    "id": "seed-gudang-berkah-logistik",
    "name": "Gudang Berkah Logistik",
    "segment": "Gudang",
    "cameras": 8,
    "package": "Standard",
    "status": "Pilot aktif",
    "area": "Bantul"
  }
}
```

Response `400`:

```json
{
  "message": "Status lead tidak valid.",
  "issues": [
    {
      "field": "status",
      "message": "Status harus sesuai opsi lead yang tersedia."
    }
  ]
}
```

Response `404`:

```json
{
  "message": "Lead tidak ditemukan."
}
```

### Get Customers

Mengambil pelanggan aktif dari tabel customer.

```http
GET /api/customers
```

Response `200`:

```json
{
  "data": [
    {
      "id": "seed-gudang-berkah-logistik",
      "name": "Gudang Berkah Logistik",
      "segment": "Gudang",
      "cameras": 8,
      "package": "Standard",
      "status": "Pilot aktif",
      "area": "Bantul"
    }
  ]
}
```

### Get Customer Detail

Mengambil detail satu pelanggan, termasuk ringkasan kamera dan invoice terbaru.

```http
GET /api/customers/:id
```

Response `200`:

```json
{
  "data": {
    "id": "seed-customer-gudang-berkah-logistik",
    "customerId": "seed-customer-gudang-berkah-logistik",
    "name": "Gudang Berkah Logistik",
    "segment": "Gudang",
    "cameraCount": 2,
    "onlineCameras": 1,
    "package": "Standard",
    "status": "Pilot aktif",
    "area": "Bantul",
    "monthlyAmount": 520000,
    "latestInvoice": {
      "id": "INV-2026-05-001",
      "customer": "Gudang Berkah Logistik",
      "area": "Bantul",
      "cameras": 2,
      "package": "Standard",
      "amount": 520000,
      "paidAmount": 520000,
      "remainingAmount": 0,
      "dueDate": "20 Mei 2026",
      "status": "Paid",
      "payments": []
    },
    "cameras": [
      {
        "id": "seed-camera-gudang-a",
        "customerId": "seed-customer-gudang-berkah-logistik",
        "customerName": "Gudang Berkah Logistik",
        "name": "Gudang A",
        "location": "Berkah Logistik",
        "status": "Online",
        "retention": "14 hari",
        "cloudRecordingEnabled": true
      }
    ]
  }
}
```

Response `404`:

```json
{
  "message": "Customer tidak ditemukan."
}
```

### Get Invoices

Mengambil invoice dari pelanggan aktif.

```http
GET /api/invoices
```

Response `200`:

```json
{
  "data": [
    {
      "id": "INV-2026-05-001",
      "customer": "Gudang Berkah Logistik",
      "area": "Bantul",
      "cameras": 8,
      "package": "Standard",
      "amount": 520000,
      "dueDate": "20 Mei 2026",
      "status": "Paid"
    }
  ]
}
```

### Create Invoice

Membuat invoice baru untuk customer aktif. Jika `amount` tidak dikirim, sistem menghitung nominal dari jumlah kamera dan paket customer.

```http
POST /api/invoices
Content-Type: application/json
```

Request body (status Paid tidak diterima; invoice menjadi Paid melalui endpoint pembayaran):

```json
{
  "customerId": "seed-customer-gudang-berkah-logistik",
  "status": "Unpaid",
  "dueDate": "2026-07-20",
  "cameras": 2
}
```

Response `201`:

```json
{
  "data": {
    "id": "INV-202607-123456",
    "customer": "Gudang Berkah Logistik",
    "area": "Bantul",
    "cameras": 2,
    "package": "Standard",
    "amount": 130000,
    "dueDate": "20 Juli 2026",
    "status": "Unpaid"
  }
}
```

Response `400`:

```json
{
  "message": "Customer, status, dan jatuh tempo invoice wajib diisi.",
  "issues": [
    {
      "field": "dueDate",
      "message": "Tanggal jatuh tempo tidak valid."
    }
  ]
}
```

### Update Invoice

Mengubah status operasional selain Paid, customer, due date, atau nominal invoice.

```http
PATCH /api/invoices/:id
Content-Type: application/json
```

Request body:

```json
{
  "status": "Overdue"
}
```

Response `200`:

```json
{
  "data": {
    "id": "INV-202607-123456",
    "status": "Overdue"
  }
}
```

Response `400`:

```json
{
  "message": "Data invoice tidak valid.",
  "issues": [
    {
      "field": "amount",
      "message": "Nominal harus angka lebih dari 0."
    }
  ]
}
```

### Delete Invoice

Menghapus invoice beserta item invoice-nya.

```http
DELETE /api/invoices/:id
```

Response `200`:

```json
{
  "data": {
    "id": "INV-202607-123456"
  }
}
```

### Record Payment

Mencatat pembayaran penuh atau parsial. Status invoice otomatis menjadi Paid ketika jumlah pembayaran mencapai total invoice.

```http
POST /api/invoices/:id/payments
Content-Type: application/json
```

```json
{
  "amount": 40000,
  "method": "Transfer Bank",
  "paidAt": "2026-06-22",
  "reference": "TRX-20260622-001",
  "notes": "Pembayaran termin pertama"
}
```

Sistem menolak nominal yang melebihi remainingAmount.

### Delete Payment

Menghapus transaksi yang salah input dan menghitung ulang saldo serta status invoice.

```http
DELETE /api/invoices/:id/payments/:paymentId
```

### Get Cameras

Mengambil kamera cloud yang sudah tersimpan di database.

```http
GET /api/cameras
```

Response `200`:

```json
{
  "data": [
    {
      "id": "seed-camera-gudang-a",
      "customerId": "seed-customer-gudang-berkah-logistik",
      "customerName": "Gudang Berkah Logistik",
      "name": "Gudang A",
      "location": "Berkah Logistik",
      "status": "Online",
      "retention": "14 hari",
      "cloudRecordingEnabled": true,
      "lastOnlineAt": "2026-05-25T12:00:00.000Z"
    }
  ]
}
```

### Create Camera

Menambahkan kamera baru untuk customer aktif.

```http
POST /api/cameras
Content-Type: application/json
```

Request body:

```json
{
  "customerId": "seed-customer-gudang-berkah-logistik",
  "name": "Kasir 01",
  "location": "Area kasir",
  "status": "Online",
  "retentionDays": 14,
  "cloudRecordingEnabled": true
}
```

Response `201`:

```json
{
  "data": {
    "id": "camera-id",
    "customerId": "seed-customer-gudang-berkah-logistik",
    "customerName": "Gudang Berkah Logistik",
    "name": "Kasir 01",
    "location": "Area kasir",
    "status": "Online",
    "retention": "14 hari",
    "cloudRecordingEnabled": true
  }
}
```

Response `400`:

```json
{
  "message": "Customer, nama kamera, lokasi, dan retensi wajib diisi.",
  "issues": [
    {
      "field": "retentionDays",
      "message": "Retensi harus angka lebih dari 0."
    }
  ]
}
```

### Update Camera

Mengubah sebagian atau seluruh data kamera.

```http
PATCH /api/cameras/:id
Content-Type: application/json
```

Request body:

```json
{
  "status": "Offline",
  "cloudRecordingEnabled": false
}
```

Response `200`:

```json
{
  "data": {
    "id": "camera-id",
    "status": "Offline",
    "cloudRecordingEnabled": false
  }
}
```

Response `400`:

```json
{
  "message": "Data kamera tidak valid.",
  "issues": [
    {
      "field": "status",
      "message": "Status kamera harus Online atau Offline."
    }
  ]
}
```

### Delete Camera

Menghapus kamera dari customer.

```http
DELETE /api/cameras/:id
```

Response `200`:

```json
{
  "data": {
    "id": "camera-id"
  }
}
```

### Get Users

Mengambil daftar user admin, sales, teknisi, dan customer portal.

```http
GET /api/users
```

Response `200`:

```json
{
  "data": [
    {
      "id": "seed-user-admin",
      "name": "Admin Naltech",
      "email": "admin@naltech.id",
      "role": "admin",
      "createdAt": "2026-05-25T12:04:54.670Z"
    }
  ]
}
```

### Create User

Membuat akun login baru. Role `customer` wajib dihubungkan ke customer aktif.

```http
POST /api/users
Content-Type: application/json
```

Request body:

```json
{
  "name": "Gudang Berkah Logistik",
  "email": "customer@naltech.id",
  "role": "customer",
  "password": "NaltechCustomer123!",
  "customerId": "seed-customer-gudang-berkah-logistik"
}
```

Response `201`:

```json
{
  "data": {
    "id": "user-id",
    "name": "Gudang Berkah Logistik",
    "email": "customer@naltech.id",
    "role": "customer",
    "customerId": "seed-customer-gudang-berkah-logistik",
    "customerName": "Gudang Berkah Logistik"
  }
}
```

### Update User

Mengubah nama, email, role, relasi customer, atau reset password user.

```http
PATCH /api/users/:id
Content-Type: application/json
```

Request body:

```json
{
  "name": "Admin Naltech",
  "password": "PasswordBaru123!"
}
```

Response `200`:

```json
{
  "data": {
    "id": "user-id",
    "name": "Admin Naltech",
    "email": "admin@naltech.id",
    "role": "admin"
  }
}
```

### Delete User

Menghapus akun user. Akun yang sedang login tidak bisa menghapus dirinya sendiri, dan sistem menjaga minimal satu admin aktif.

```http
DELETE /api/users/:id
```

Response `200`:

```json
{
  "data": {
    "id": "user-id"
  }
}
```

## Business Rules

- Lead baru selalu masuk dengan status awal `"Baru"`.
- Lead menjadi customer aktif hanya jika statusnya `"Pilot aktif"`.
- Invoice hanya dibuat untuk customer aktif.
- Kamera hanya bisa ditambahkan ke customer yang sudah ada.
- Input API lead, status lead, kamera, dan invoice divalidasi di server dengan error per field.
- User role `customer` wajib terhubung ke satu customer aktif.
- Satu customer hanya bisa terhubung ke satu user portal.
- Minimal harus ada satu user `admin`.
- Nominal invoice dihitung dari jumlah kamera dikali harga paket:
  - Basic: Rp45.000 per kamera per bulan
  - Standard: Rp65.000 per kamera per bulan
  - Pro: Rp110.000 per kamera per bulan
- Data utama tersimpan di PostgreSQL melalui Prisma.

## Frontend Integration Status

Frontend yang sudah memakai kontrak API ini:

- Landing page: `POST /api/leads`
- Admin dashboard: `GET /api/leads` dan `PATCH /api/leads/:id/status`
- Kelola Pelanggan: `GET /api/leads` dan `GET /api/customers`
- Customer detail: `GET /api/customers/:id`
- Billing: `GET /api/invoices`, `POST /api/invoices`, `PATCH /api/invoices/:id`, dan `DELETE /api/invoices/:id`
- Camera management: `GET /api/cameras`, `POST /api/cameras`, `PATCH /api/cameras/:id`, dan `DELETE /api/cameras/:id`
- User Management: `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, dan `DELETE /api/users/:id`

Frontend yang masih memakai data statis:

- Playback dan persentase storage pada Customer Portal masih berupa simulasi UI.

## Next Backend Step

Setelah kontrak ini stabil, tahap berikutnya:

1. Tambahkan search dan filter dashboard.
2. Tambahkan payment reminder billing.
3. Tambahkan endpoint playback/recording saat integrasi CCTV dimulai.
