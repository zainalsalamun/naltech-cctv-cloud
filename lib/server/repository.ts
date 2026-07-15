import {
  CameraStatus as PrismaCameraStatus,
  InvoiceStatus as PrismaInvoiceStatus,
  LeadStatus as PrismaLeadStatus,
  PaymentMethod as PrismaPaymentMethod,
  UserRole as PrismaUserRole,
  type PackageName as PrismaPackageName,
  type CameraStatus as PrismaCameraStatusType,
  type LeadStatus as PrismaLeadStatusType,
  type InvoiceStatus as PrismaInvoiceStatusType,
  type PaymentMethod as PrismaPaymentMethodType,
  type UserRole as PrismaUserRoleType
} from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { hashPassword } from "@/lib/server/password";
import { calculateMonthlyAmount } from "@/lib/pricing";
import type { CameraPayload, CloudPackage, CustomerDetail, Invoice, InvoicePayload, InvoiceStatus, LeadStatus, LeadWithId, ManagedCamera, ManagedUser, Payment, PaymentMethod, PaymentPayload, UserPayload, UserRole } from "@/types/operational";

const leadStatusToPrisma: Record<LeadStatus, PrismaLeadStatusType> = {
  "Baru": PrismaLeadStatus.Baru,
  "Menunggu follow-up": PrismaLeadStatus.MenungguFollowUp,
  "Follow-up": PrismaLeadStatus.FollowUp,
  "Survey dijadwalkan": PrismaLeadStatus.SurveyDijadwalkan,
  "Pilot aktif": PrismaLeadStatus.PilotAktif,
  "Tidak lanjut": PrismaLeadStatus.TidakLanjut
};

const leadStatusFromPrisma: Record<PrismaLeadStatusType, LeadStatus> = {
  Baru: "Baru",
  MenungguFollowUp: "Menunggu follow-up",
  FollowUp: "Follow-up",
  SurveyDijadwalkan: "Survey dijadwalkan",
  PilotAktif: "Pilot aktif",
  TidakLanjut: "Tidak lanjut"
};

const invoiceStatusFromPrisma: Record<PrismaInvoiceStatusType, InvoiceStatus> = {
  draft: "Draft",
  unpaid: "Unpaid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Draft"
};

const invoiceStatusToPrisma: Record<InvoiceStatus, PrismaInvoiceStatusType> = {
  Draft: PrismaInvoiceStatus.draft,
  Unpaid: PrismaInvoiceStatus.unpaid,
  Paid: PrismaInvoiceStatus.paid,
  Overdue: PrismaInvoiceStatus.overdue
};

const paymentMethodFromPrisma: Record<PrismaPaymentMethodType, PaymentMethod> = {
  bank_transfer: "Transfer Bank",
  cash: "Tunai",
  e_wallet: "E-Wallet",
  other: "Lainnya"
};

const paymentMethodToPrisma: Record<PaymentMethod, PrismaPaymentMethodType> = {
  "Transfer Bank": PrismaPaymentMethod.bank_transfer,
  Tunai: PrismaPaymentMethod.cash,
  "E-Wallet": PrismaPaymentMethod.e_wallet,
  Lainnya: PrismaPaymentMethod.other
};

const cameraStatusFromPrisma: Record<PrismaCameraStatusType, ManagedCamera["status"]> = {
  [PrismaCameraStatus.online]: "Online",
  [PrismaCameraStatus.offline]: "Offline",
  [PrismaCameraStatus.maintenance]: "Offline"
};

const cameraStatusToPrisma: Record<ManagedCamera["status"], PrismaCameraStatusType> = {
  Online: PrismaCameraStatus.online,
  Offline: PrismaCameraStatus.offline
};

const userRoleFromPrisma: Record<PrismaUserRoleType, UserRole> = {
  admin: "admin",
  sales: "sales",
  technician: "technician",
  customer: "customer"
};

const userRoleToPrisma: Record<UserRole, PrismaUserRoleType> = {
  admin: PrismaUserRole.admin,
  sales: PrismaUserRole.sales,
  technician: PrismaUserRole.technician,
  customer: PrismaUserRole.customer
};

function toPackageName(value: unknown): CloudPackage {
  if (value === "Basic" || value === "Standard" || value === "Pro") return value;
  return "Standard";
}

function toLeadResponse(lead: {
  id: string;
  name: string;
  phone: string | null;
  segment: string;
  camerasCount: number;
  packageName: PrismaPackageName;
  status: PrismaLeadStatusType;
  area: string;
  notes: string | null;
  createdAt: Date;
}): LeadWithId {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone || undefined,
    segment: lead.segment,
    cameras: lead.camerasCount,
    package: toPackageName(lead.packageName),
    status: leadStatusFromPrisma[lead.status],
    area: lead.area,
    notes: lead.notes || undefined,
    createdAt: lead.createdAt.toISOString()
  };
}

function toManagedCameraResponse(camera: {
  id: string;
  customerId: string;
  customer: {
    name: string;
  };
  name: string;
  location: string;
  status: PrismaCameraStatusType;
  retentionDays: number;
  cloudRecordingEnabled: boolean;
  lastOnlineAt: Date | null;
}): ManagedCamera {
  return {
    id: camera.id,
    customerId: camera.customerId,
    customerName: camera.customer.name,
    name: camera.name,
    location: camera.location,
    status: cameraStatusFromPrisma[camera.status],
    retention: `${camera.retentionDays} hari`,
    cloudRecordingEnabled: camera.cloudRecordingEnabled,
    lastOnlineAt: camera.lastOnlineAt?.toISOString()
  };
}

function toInvoiceResponse(invoice: {
  invoiceNumber: string;
  total: number;
  dueDate: Date;
  status: PrismaInvoiceStatusType;
  payments: Array<{
    id: string;
    amount: number;
    method: PrismaPaymentMethodType;
    reference: string | null;
    notes: string | null;
    paidAt: Date;
    createdAt: Date;
  }>;
  items?: Array<{ quantity: number }>;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    area: string;
    packageName: PrismaPackageName;
    cameras?: Array<{ id: string }>;
  };
}): Invoice {
  const packageName = toPackageName(invoice.customer.packageName);
  const billedCameraCount = invoice.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cameraCount =
    billedCameraCount ||
    invoice.customer.cameras?.length ||
    Math.max(1, Math.round(invoice.total / calculateMonthlyAmount(1, packageName)));
  const payments = invoice.payments.map((payment) => toPaymentResponse(payment, invoice.invoiceNumber));
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    id: invoice.invoiceNumber,
    customerId: invoice.customer.id,
    customer: invoice.customer.name,
    customerPhone: invoice.customer.phone || undefined,
    area: invoice.customer.area,
    cameras: cameraCount,
    package: packageName,
    amount: invoice.total,
    paidAmount,
    remainingAmount: Math.max(0, invoice.total - paidAmount),
    dueDate: invoice.dueDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    status: invoiceStatusFromPrisma[invoice.status] || "Draft",
    payments
  };
}

function toPaymentResponse(payment: {
  id: string;
  amount: number;
  method: PrismaPaymentMethodType;
  reference: string | null;
  notes: string | null;
  paidAt: Date;
  createdAt: Date;
}, invoiceNumber: string): Payment {
  return {
    id: payment.id,
    invoiceId: invoiceNumber,
    amount: payment.amount,
    method: paymentMethodFromPrisma[payment.method],
    reference: payment.reference || undefined,
    notes: payment.notes || undefined,
    paidAt: payment.paidAt.toISOString(),
    createdAt: payment.createdAt.toISOString()
  };
}

function toManagedUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: PrismaUserRoleType;
  customerId: string | null;
  customer: { name: string } | null;
  createdAt: Date;
}): ManagedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: userRoleFromPrisma[user.role],
    customerId: user.customerId || undefined,
    customerName: user.customer?.name || undefined,
    createdAt: user.createdAt.toISOString()
  };
}

function createInvoiceNumber(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const suffix = String(Date.now()).slice(-6);

  return `INV-${year}${month}-${suffix}`;
}

export async function listLeads() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" }
  });

  return leads.map(toLeadResponse);
}

export async function createLead(input: Omit<LeadWithId, "id" | "status" | "createdAt">) {
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      segment: input.segment,
      camerasCount: input.cameras,
      packageName: input.package,
      status: "Baru",
      area: input.area,
      notes: input.notes
    }
  });

  return toLeadResponse(lead);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) return null;

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: { status: leadStatusToPrisma[status] }
  });

  if (status === "Pilot aktif") {
    await prisma.customer.upsert({
      where: { leadId },
      update: {
        name: updatedLead.name,
        phone: updatedLead.phone,
        segment: updatedLead.segment,
        packageName: updatedLead.packageName,
        status: "active",
        area: updatedLead.area,
        activatedAt: new Date()
      },
      create: {
        leadId,
        name: updatedLead.name,
        phone: updatedLead.phone,
        segment: updatedLead.segment,
        packageName: updatedLead.packageName,
        status: "active",
        area: updatedLead.area,
        activatedAt: new Date()
      }
    });
  }

  return toLeadResponse(updatedLead);
}

export async function listCustomers() {
  const customers = await prisma.customer.findMany({
    where: { status: "active" },
    include: {
      cameras: true,
      lead: true
    },
    orderBy: { createdAt: "desc" }
  });

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone || undefined,
    segment: customer.segment,
    cameras: customer.cameras.length || customer.lead?.camerasCount || 0,
    package: toPackageName(customer.packageName),
    status: "Pilot aktif" as LeadStatus,
    area: customer.area,
    createdAt: customer.createdAt.toISOString()
  }));
}

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      cameras: {
        orderBy: { name: "asc" }
      },
      invoices: {
        orderBy: { issuedDate: "desc" },
        take: 1,
        include: {
          items: true,
          payments: {
            orderBy: { paidAt: "desc" }
          }
        }
      },
      lead: true
    }
  });

  if (!customer) return null;

  const packageName = toPackageName(customer.packageName);
  const cameras = customer.cameras.map((camera) => ({
    id: camera.id,
    customerId: camera.customerId,
    customerName: customer.name,
    name: camera.name,
    location: camera.location,
    status: cameraStatusFromPrisma[camera.status],
    retention: `${camera.retentionDays} hari`,
    cloudRecordingEnabled: camera.cloudRecordingEnabled,
    lastOnlineAt: camera.lastOnlineAt?.toISOString()
  }));
  const cameraCount = cameras.length || customer.lead?.camerasCount || 0;
  const latestInvoice = customer.invoices[0];
  const latestCameraCount = latestInvoice?.items.reduce((sum, item) => sum + item.quantity, 0) || cameraCount;
  const latestPayments = latestInvoice
    ? latestInvoice.payments.map((payment) => toPaymentResponse(payment, latestInvoice.invoiceNumber))
    : [];
  const latestPaidAmount = latestPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const latestInvoiceResponse = latestInvoice
    ? {
        id: latestInvoice.invoiceNumber,
        customerId: customer.id,
        customer: customer.name,
        customerPhone: customer.phone || undefined,
        area: customer.area,
        cameras: latestCameraCount,
        package: packageName,
        amount: latestInvoice.total,
        paidAmount: latestPaidAmount,
        remainingAmount: Math.max(0, latestInvoice.total - latestPaidAmount),
        dueDate: latestInvoice.dueDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        status: invoiceStatusFromPrisma[latestInvoice.status] || "Draft",
        payments: latestPayments
      }
    : undefined;

  return {
    id: customer.id,
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone || undefined,
    segment: customer.segment,
    cameraCount,
    package: packageName,
    status: "Pilot aktif",
    area: customer.area,
    createdAt: customer.createdAt.toISOString(),
    onlineCameras: cameras.filter((camera) => camera.status === "Online").length,
    monthlyAmount: latestInvoiceResponse?.amount || calculateMonthlyAmount(Math.max(1, cameraCount), packageName),
    latestInvoice: latestInvoiceResponse,
    cameras
  };
}

export async function listInvoices(): Promise<Invoice[]> {
  const invoices = await prisma.invoice.findMany({
    include: {
      customer: {
        include: {
          cameras: true
        }
      },
      payments: {
        orderBy: { paidAt: "desc" }
      },
      items: true
    },
    orderBy: { issuedDate: "desc" }
  });

  return invoices.map(toInvoiceResponse);
}

export async function createInvoice(input: InvoicePayload): Promise<Invoice | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    include: {
      cameras: true,
      lead: true
    }
  });

  if (!customer) return null;

  const packageName = toPackageName(customer.packageName);
  const cameraCount = Math.max(1, input.cameras || customer.cameras.length || customer.lead?.camerasCount || 1);
  const amount = input.amount && input.amount > 0 ? input.amount : calculateMonthlyAmount(cameraCount, packageName);
  const issuedDate = input.issuedDate ? new Date(input.issuedDate) : new Date();
  const dueDate = new Date(input.dueDate);

  if (Number.isNaN(dueDate.getTime())) return null;

  const invoice = await prisma.invoice.create({
    data: {
      customerId: customer.id,
      invoiceNumber: createInvoiceNumber(issuedDate),
      status: invoiceStatusToPrisma[input.status],
      subtotal: amount,
      total: amount,
      issuedDate,
      dueDate,
      paidAt: null,
      items: {
        create: [
          {
            description: `Cloud CCTV ${packageName} - ${cameraCount} kamera`,
            quantity: cameraCount,
            unitPrice: Math.round(amount / cameraCount),
            total: amount
          }
        ]
      }
    },
    include: {
      customer: {
        include: {
          cameras: true
        }
      },
      payments: {
        orderBy: { paidAt: "desc" }
      },
      items: true
    }
  });

  return toInvoiceResponse(invoice);
}

export async function updateInvoice(invoiceNumber: string, input: Partial<InvoicePayload>): Promise<Invoice | null> {
  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber }
  });

  if (!existingInvoice) return null;

  if (input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId }
    });

    if (!customer) return null;
  }

  const dueDate = input.dueDate ? new Date(input.dueDate) : undefined;

  if (dueDate && Number.isNaN(dueDate.getTime())) return null;

  const invoice = await prisma.invoice.update({
    where: { invoiceNumber },
    data: {
      customerId: input.customerId,
      status: input.status ? invoiceStatusToPrisma[input.status] : undefined,
      dueDate,
      subtotal: input.amount && input.amount > 0 ? input.amount : undefined,
      total: input.amount && input.amount > 0 ? input.amount : undefined,
      paidAt: input.status === "Unpaid" || input.status === "Overdue" || input.status === "Draft" ? null : undefined
    },
    include: {
      customer: {
        include: {
          cameras: true
        }
      },
      payments: {
        orderBy: { paidAt: "desc" }
      },
      items: true
    }
  });

  return toInvoiceResponse(invoice);
}

export async function deleteInvoice(invoiceNumber: string) {
  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber }
  });

  if (!existingInvoice) return false;

  await prisma.$transaction([
    prisma.invoiceItem.deleteMany({
      where: { invoiceId: existingInvoice.id }
    }),
    prisma.invoice.delete({
      where: { invoiceNumber }
    })
  ]);

  return true;
}

function statusAfterPayment(total: number, paidAmount: number, dueDate: Date): PrismaInvoiceStatusType {
  if (paidAmount >= total) return PrismaInvoiceStatus.paid;
  return dueDate.getTime() < Date.now() ? PrismaInvoiceStatus.overdue : PrismaInvoiceStatus.unpaid;
}

export async function recordPayment(
  invoiceNumber: string,
  input: PaymentPayload
): Promise<{ data?: Invoice; message?: string }> {
  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: { payments: true }
  });

  if (!existingInvoice) return { message: "Invoice tidak ditemukan." };

  const paidAmount = existingInvoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = Math.max(0, existingInvoice.total - paidAmount);

  if (remainingAmount === 0) return { message: "Invoice sudah lunas." };
  if (input.amount > remainingAmount) {
    return { message: `Nominal pembayaran melebihi sisa tagihan Rp ${remainingAmount.toLocaleString("id-ID")}.` };
  }

  const paymentDate = new Date(input.paidAt);
  const nextPaidAmount = paidAmount + input.amount;
  const nextStatus = statusAfterPayment(existingInvoice.total, nextPaidAmount, existingInvoice.dueDate);

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId: existingInvoice.id,
        amount: input.amount,
        method: paymentMethodToPrisma[input.method],
        reference: input.reference,
        notes: input.notes,
        paidAt: paymentDate
      }
    }),
    prisma.invoice.update({
      where: { id: existingInvoice.id },
      data: {
        status: nextStatus,
        paidAt: nextStatus === PrismaInvoiceStatus.paid ? paymentDate : null
      }
    })
  ]);

  const invoice = await prisma.invoice.findUnique({
    where: { id: existingInvoice.id },
    include: {
      customer: { include: { cameras: true } },
      payments: { orderBy: { paidAt: "desc" } },
      items: true
    }
  });

  return invoice ? { data: toInvoiceResponse(invoice) } : { message: "Invoice tidak ditemukan." };
}

export async function deletePayment(
  invoiceNumber: string,
  paymentId: string
): Promise<{ data?: Invoice; message?: string }> {
  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: { payments: true }
  });

  if (!existingInvoice) return { message: "Invoice tidak ditemukan." };

  const payment = existingInvoice.payments.find((item) => item.id === paymentId);
  if (!payment) return { message: "Pembayaran tidak ditemukan pada invoice ini." };

  const paidAmountAfterDelete = existingInvoice.payments
    .filter((item) => item.id !== paymentId)
    .reduce((sum, item) => sum + item.amount, 0);
  const nextStatus = statusAfterPayment(existingInvoice.total, paidAmountAfterDelete, existingInvoice.dueDate);

  await prisma.$transaction([
    prisma.payment.delete({ where: { id: paymentId } }),
    prisma.invoice.update({
      where: { id: existingInvoice.id },
      data: {
        status: nextStatus,
        paidAt: nextStatus === PrismaInvoiceStatus.paid ? existingInvoice.paidAt : null
      }
    })
  ]);

  const invoice = await prisma.invoice.findUnique({
    where: { id: existingInvoice.id },
    include: {
      customer: { include: { cameras: true } },
      payments: { orderBy: { paidAt: "desc" } },
      items: true
    }
  });

  return invoice ? { data: toInvoiceResponse(invoice) } : { message: "Invoice tidak ditemukan." };
}

export async function listCameras(): Promise<ManagedCamera[]> {
  const cameras = await prisma.camera.findMany({
    include: {
      customer: true
    },
    orderBy: [
      { customer: { name: "asc" } },
      { name: "asc" }
    ]
  });

  return cameras.map(toManagedCameraResponse);
}

export async function createCamera(input: CameraPayload): Promise<ManagedCamera | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId }
  });

  if (!customer) return null;

  const camera = await prisma.camera.create({
    data: {
      customerId: input.customerId,
      name: input.name,
      location: input.location,
      status: cameraStatusToPrisma[input.status],
      retentionDays: input.retentionDays,
      cloudRecordingEnabled: input.cloudRecordingEnabled,
      lastOnlineAt: input.status === "Online" ? new Date() : null
    },
    include: {
      customer: true
    }
  });

  return toManagedCameraResponse(camera);
}

export async function updateCamera(cameraId: string, input: Partial<CameraPayload>): Promise<ManagedCamera | null> {
  const existingCamera = await prisma.camera.findUnique({
    where: { id: cameraId }
  });

  if (!existingCamera) return null;

  if (input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId }
    });

    if (!customer) return null;
  }

  const camera = await prisma.camera.update({
    where: { id: cameraId },
    data: {
      customerId: input.customerId,
      name: input.name,
      location: input.location,
      status: input.status ? cameraStatusToPrisma[input.status] : undefined,
      retentionDays: input.retentionDays,
      cloudRecordingEnabled: input.cloudRecordingEnabled,
      lastOnlineAt: input.status === "Online" ? new Date() : input.status === "Offline" ? null : undefined
    },
    include: {
      customer: true
    }
  });

  return toManagedCameraResponse(camera);
}

export async function deleteCamera(cameraId: string) {
  const existingCamera = await prisma.camera.findUnique({
    where: { id: cameraId }
  });

  if (!existingCamera) return false;

  await prisma.camera.delete({
    where: { id: cameraId }
  });

  return true;
}

export async function listUsers(): Promise<ManagedUser[]> {
  const users = await prisma.user.findMany({
    include: {
      customer: true
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "desc" }
    ]
  });

  return users.map(toManagedUserResponse);
}

async function hasUserConflict(email: string, currentUserId?: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  return Boolean(existingUser && existingUser.id !== currentUserId);
}

async function hasCustomerUserConflict(customerId: string | undefined, currentUserId?: string) {
  if (!customerId) return false;

  const existingUser = await prisma.user.findUnique({
    where: { customerId }
  });

  return Boolean(existingUser && existingUser.id !== currentUserId);
}

export async function createManagedUser(input: UserPayload): Promise<{ data?: ManagedUser; message?: string }> {
  const email = input.email.toLowerCase();

  if (await hasUserConflict(email)) {
    return { message: "Email user sudah digunakan." };
  }

  if (await hasCustomerUserConflict(input.customerId)) {
    return { message: "Customer tersebut sudah terhubung ke user lain." };
  }

  if (input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId }
    });

    if (!customer) return { message: "Customer tidak ditemukan." };
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash: hashPassword(input.password || "NaltechUser123!"),
      role: userRoleToPrisma[input.role],
      customerId: input.role === "customer" ? input.customerId : null
    },
    include: {
      customer: true
    }
  });

  return { data: toManagedUserResponse(user) };
}

export async function updateManagedUser(userId: string, input: Partial<UserPayload>): Promise<{ data?: ManagedUser; message?: string }> {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) return { message: "User tidak ditemukan." };

  const email = input.email?.toLowerCase();

  if (email && (await hasUserConflict(email, userId))) {
    return { message: "Email user sudah digunakan." };
  }

  if (input.customerId && (await hasCustomerUserConflict(input.customerId, userId))) {
    return { message: "Customer tersebut sudah terhubung ke user lain." };
  }

  if (input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId }
    });

    if (!customer) return { message: "Customer tidak ditemukan." };
  }

  if (existingUser.role === PrismaUserRole.admin && input.role && input.role !== "admin") {
    const adminCount = await prisma.user.count({
      where: { role: PrismaUserRole.admin }
    });

    if (adminCount <= 1) return { message: "Minimal harus ada satu admin aktif." };
  }

  const nextRole = input.role || userRoleFromPrisma[existingUser.role];
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      email,
      role: input.role ? userRoleToPrisma[input.role] : undefined,
      passwordHash: input.password ? hashPassword(input.password) : undefined,
      customerId: nextRole === "customer" ? input.customerId : null
    },
    include: {
      customer: true
    }
  });

  return { data: toManagedUserResponse(user) };
}

export async function deleteManagedUser(userId: string, currentUserId: string): Promise<{ deleted?: true; message?: string }> {
  if (userId === currentUserId) {
    return { message: "Akun yang sedang login tidak bisa dihapus." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) return { message: "User tidak ditemukan." };

  if (existingUser.role === PrismaUserRole.admin) {
    const adminCount = await prisma.user.count({
      where: { role: PrismaUserRole.admin }
    });

    if (adminCount <= 1) return { message: "Minimal harus ada satu admin aktif." };
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  return { deleted: true };
}
