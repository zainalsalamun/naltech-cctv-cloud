export type CloudPackage = "Basic" | "Standard" | "Pro";

export type LeadStatus =
  | "Baru"
  | "Menunggu follow-up"
  | "Follow-up"
  | "Survey dijadwalkan"
  | "Pilot aktif"
  | "Tidak lanjut";

export type CustomerStatus = "Aktif" | "Survey" | "Prospek";

export type InvoiceStatus = "Paid" | "Unpaid" | "Overdue" | "Draft";

export type PaymentMethod = "Transfer Bank" | "Tunai" | "E-Wallet" | "Lainnya";

export type UserRole = "admin" | "sales" | "technician" | "customer";

export type Lead = {
  id?: string;
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

export type LeadWithId = Lead & {
  id: string;
};

export type Camera = {
  name: string;
  location: string;
  status: "Online" | "Offline";
  retention: string;
};

export type ManagedCamera = Camera & {
  id: string;
  customerId: string;
  customerName: string;
  cloudRecordingEnabled: boolean;
  lastOnlineAt?: string;
};

export type CameraPayload = {
  customerId: string;
  name: string;
  location: string;
  status: "Online" | "Offline";
  retentionDays: number;
  cloudRecordingEnabled: boolean;
};

export type CustomerDetail = Omit<LeadWithId, "cameras"> & {
  customerId: string;
  cameraCount: number;
  onlineCameras: number;
  monthlyAmount: number;
  latestInvoice?: Invoice;
  cameras: ManagedCamera[];
};

export type Invoice = {
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

export type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt: string;
  createdAt: string;
};

export type PaymentPayload = {
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference?: string;
  notes?: string;
};

export type InvoicePayload = {
  customerId: string;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate?: string;
  amount?: number;
  cameras?: number;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customerId?: string;
  customerName?: string;
  createdAt: string;
};

export type UserPayload = {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  customerId?: string;
};

export type OperationalStat = {
  label: string;
  value: string;
};
