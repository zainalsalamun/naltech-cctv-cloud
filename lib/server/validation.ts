import { leadStatusOptions } from "@/lib/operational";
import type { ApiIssue } from "@/lib/server/api-response";
import type { CameraPayload, CloudPackage, InvoicePayload, InvoiceStatus, LeadStatus, LeadWithId, PaymentMethod, PaymentPayload, UserPayload, UserRole } from "@/types/operational";

type ValidationResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
      issues: ApiIssue[];
    };

const cloudPackageOptions: CloudPackage[] = ["Basic", "Standard", "Pro"];
const invoiceStatusOptions: InvoiceStatus[] = ["Draft", "Unpaid", "Paid", "Overdue"];
const paymentMethodOptions: PaymentMethod[] = ["Transfer Bank", "Tunai", "E-Wallet", "Lainnya"];
const cameraStatusOptions: CameraPayload["status"][] = ["Online", "Offline"];
const userRoleOptions: UserRole[] = ["admin", "sales", "technician", "customer"];

function asRecord(input: unknown) {
  return input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : null;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown) {
  const text = cleanString(value);
  return text || undefined;
}

function positiveInteger(value: unknown) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return null;
  return number;
}

function positiveNumber(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

function isValidDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function issue(field: string, message: string): ApiIssue {
  return { field, message };
}

function invalid<T>(message: string, issues: ApiIssue[]): ValidationResult<T> {
  return { ok: false, message, issues };
}

function hasOwn(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

export function validateLeadCreate(input: unknown): ValidationResult<Omit<LeadWithId, "id" | "status" | "createdAt">> {
  const body = asRecord(input);
  if (!body) {
    return invalid("Payload harus berupa JSON object.", [issue("body", "Body request tidak valid.")]);
  }

  const issues: ApiIssue[] = [];
  const name = cleanString(body.name);
  const segment = cleanString(body.segment);
  const cameras = positiveInteger(body.cameras);
  const packageName = cleanString(body.package) as CloudPackage;

  if (!name) issues.push(issue("name", "Nama wajib diisi."));
  if (!segment) issues.push(issue("segment", "Jenis lokasi wajib diisi."));
  if (!cameras) issues.push(issue("cameras", "Jumlah kamera harus angka lebih dari 0."));
  if (!cloudPackageOptions.includes(packageName)) issues.push(issue("package", "Paket harus Basic, Standard, atau Pro."));

  if (issues.length) {
    return invalid("Nama, jenis lokasi, jumlah kamera, dan paket wajib diisi.", issues);
  }

  return {
    ok: true,
    data: {
      name,
      phone: optionalString(body.phone),
      segment,
      cameras: cameras || 1,
      package: packageName,
      area: optionalString(body.area) || "Yogyakarta",
      notes: optionalString(body.notes)
    }
  };
}

export function validateLeadStatusPatch(input: unknown): ValidationResult<{ status: LeadStatus }> {
  const body = asRecord(input);
  const statusInput = body ? cleanString(body.status) : "";

  if (!body || !leadStatusOptions.includes(statusInput as LeadStatus)) {
    return invalid("Status lead tidak valid.", [issue("status", "Status harus sesuai opsi lead yang tersedia.")]);
  }

  return { ok: true, data: { status: statusInput as LeadStatus } };
}

export function validateCameraCreate(input: unknown): ValidationResult<CameraPayload> {
  const body = asRecord(input);
  if (!body) {
    return invalid("Payload harus berupa JSON object.", [issue("body", "Body request tidak valid.")]);
  }

  const issues: ApiIssue[] = [];
  const customerId = cleanString(body.customerId);
  const name = cleanString(body.name);
  const location = cleanString(body.location);
  const retentionDays = positiveInteger(body.retentionDays);
  const status = cleanString(body.status) as CameraPayload["status"];

  if (!customerId) issues.push(issue("customerId", "Customer wajib dipilih."));
  if (!name) issues.push(issue("name", "Nama kamera wajib diisi."));
  if (!location) issues.push(issue("location", "Lokasi kamera wajib diisi."));
  if (!retentionDays) issues.push(issue("retentionDays", "Retensi harus angka lebih dari 0."));
  if (hasOwn(body, "status") && !cameraStatusOptions.includes(status)) {
    issues.push(issue("status", "Status kamera harus Online atau Offline."));
  }

  if (issues.length) {
    return invalid("Customer, nama kamera, lokasi, dan retensi wajib diisi.", issues);
  }

  return {
    ok: true,
    data: {
      customerId,
      name,
      location,
      status: status === "Online" ? "Online" : "Offline",
      retentionDays: retentionDays || 1,
      cloudRecordingEnabled: Boolean(body.cloudRecordingEnabled)
    }
  };
}

export function validateCameraPatch(input: unknown): ValidationResult<Partial<CameraPayload>> {
  const body = asRecord(input);
  if (!body) {
    return invalid("Payload harus berupa JSON object.", [issue("body", "Body request tidak valid.")]);
  }

  const issues: ApiIssue[] = [];
  const payload: Partial<CameraPayload> = {};

  if (hasOwn(body, "customerId")) {
    const customerId = cleanString(body.customerId);
    if (!customerId) issues.push(issue("customerId", "Customer wajib dipilih."));
    else payload.customerId = customerId;
  }

  if (hasOwn(body, "name")) {
    const name = cleanString(body.name);
    if (!name) issues.push(issue("name", "Nama kamera wajib diisi."));
    else payload.name = name;
  }

  if (hasOwn(body, "location")) {
    const location = cleanString(body.location);
    if (!location) issues.push(issue("location", "Lokasi kamera wajib diisi."));
    else payload.location = location;
  }

  if (hasOwn(body, "status")) {
    const status = cleanString(body.status) as CameraPayload["status"];
    if (!cameraStatusOptions.includes(status)) issues.push(issue("status", "Status kamera harus Online atau Offline."));
    else payload.status = status;
  }

  if (hasOwn(body, "retentionDays")) {
    const retentionDays = positiveInteger(body.retentionDays);
    if (!retentionDays) issues.push(issue("retentionDays", "Retensi harus angka lebih dari 0."));
    else payload.retentionDays = retentionDays;
  }

  if (hasOwn(body, "cloudRecordingEnabled")) {
    payload.cloudRecordingEnabled = Boolean(body.cloudRecordingEnabled);
  }

  if (!issues.length && Object.keys(payload).length === 0) {
    issues.push(issue("body", "Minimal satu field kamera harus dikirim."));
  }

  if (issues.length) {
    return invalid("Data kamera tidak valid.", issues);
  }

  return { ok: true, data: payload };
}

export function validateInvoiceCreate(input: unknown): ValidationResult<InvoicePayload> {
  const body = asRecord(input);
  if (!body) {
    return invalid("Payload harus berupa JSON object.", [issue("body", "Body request tidak valid.")]);
  }

  const issues: ApiIssue[] = [];
  const customerId = cleanString(body.customerId);
  const status = cleanString(body.status) as InvoiceStatus;
  const dueDate = cleanString(body.dueDate);
  const issuedDate = optionalString(body.issuedDate);
  const amount = hasOwn(body, "amount") && body.amount !== "" ? positiveNumber(body.amount) : undefined;
  const cameras = hasOwn(body, "cameras") && body.cameras !== "" ? positiveInteger(body.cameras) : undefined;

  if (!customerId) issues.push(issue("customerId", "Customer wajib dipilih."));
  if (!invoiceStatusOptions.includes(status)) issues.push(issue("status", "Status invoice tidak valid."));
  if (status === "Paid") issues.push(issue("status", "Status Paid hanya boleh berasal dari pencatatan pembayaran."));
  if (!dueDate || !isValidDate(dueDate)) issues.push(issue("dueDate", "Tanggal jatuh tempo tidak valid."));
  if (issuedDate && !isValidDate(issuedDate)) issues.push(issue("issuedDate", "Tanggal terbit tidak valid."));
  if (hasOwn(body, "amount") && body.amount !== "" && !amount) issues.push(issue("amount", "Nominal harus angka lebih dari 0."));
  if (hasOwn(body, "cameras") && body.cameras !== "" && !cameras) issues.push(issue("cameras", "Jumlah kamera harus angka lebih dari 0."));

  if (issues.length) {
    return invalid("Customer, status, dan jatuh tempo invoice wajib diisi.", issues);
  }

  return {
    ok: true,
    data: {
      customerId,
      status,
      dueDate,
      issuedDate,
      amount: amount ?? undefined,
      cameras: cameras ?? undefined
    }
  };
}

export function validateInvoicePatch(input: unknown): ValidationResult<Partial<InvoicePayload>> {
  const body = asRecord(input);
  if (!body) {
    return invalid("Payload harus berupa JSON object.", [issue("body", "Body request tidak valid.")]);
  }

  const issues: ApiIssue[] = [];
  const payload: Partial<InvoicePayload> = {};

  if (hasOwn(body, "customerId")) {
    const customerId = cleanString(body.customerId);
    if (!customerId) issues.push(issue("customerId", "Customer wajib dipilih."));
    else payload.customerId = customerId;
  }

  if (hasOwn(body, "status")) {
    const status = cleanString(body.status) as InvoiceStatus;
    if (!invoiceStatusOptions.includes(status)) issues.push(issue("status", "Status invoice tidak valid."));
    else if (status === "Paid") issues.push(issue("status", "Status Paid hanya boleh berasal dari pencatatan pembayaran."));
    else payload.status = status;
  }

  if (hasOwn(body, "dueDate")) {
    const dueDate = cleanString(body.dueDate);
    if (!dueDate || !isValidDate(dueDate)) issues.push(issue("dueDate", "Tanggal jatuh tempo tidak valid."));
    else payload.dueDate = dueDate;
  }

  if (hasOwn(body, "issuedDate")) {
    const issuedDate = optionalString(body.issuedDate);
    if (issuedDate && !isValidDate(issuedDate)) issues.push(issue("issuedDate", "Tanggal terbit tidak valid."));
    else payload.issuedDate = issuedDate;
  }

  if (hasOwn(body, "amount")) {
    const amount = positiveNumber(body.amount);
    if (!amount) issues.push(issue("amount", "Nominal harus angka lebih dari 0."));
    else payload.amount = amount;
  }

  if (hasOwn(body, "cameras")) {
    const cameras = positiveInteger(body.cameras);
    if (!cameras) issues.push(issue("cameras", "Jumlah kamera harus angka lebih dari 0."));
    else payload.cameras = cameras;
  }

  if (!issues.length && Object.keys(payload).length === 0) {
    issues.push(issue("body", "Minimal satu field invoice harus dikirim."));
  }

  if (issues.length) {
    return invalid("Data invoice tidak valid.", issues);
  }

  return { ok: true, data: payload };
}

export function validatePaymentCreate(input: unknown): ValidationResult<PaymentPayload> {
  const body = asRecord(input);
  if (!body) {
    return invalid("Payload harus berupa JSON object.", [issue("body", "Body request tidak valid.")]);
  }

  const issues: ApiIssue[] = [];
  const amount = positiveNumber(body.amount);
  const method = cleanString(body.method) as PaymentMethod;
  const paidAt = cleanString(body.paidAt);

  if (!amount) issues.push(issue("amount", "Nominal pembayaran harus lebih dari 0."));
  if (!paymentMethodOptions.includes(method)) issues.push(issue("method", "Metode pembayaran tidak valid."));
  if (!paidAt || !isValidDate(paidAt)) issues.push(issue("paidAt", "Tanggal pembayaran tidak valid."));

  if (issues.length) {
    return invalid("Nominal, metode, dan tanggal pembayaran wajib diisi.", issues);
  }

  return {
    ok: true,
    data: {
      amount: amount || 0,
      method,
      paidAt,
      reference: optionalString(body.reference),
      notes: optionalString(body.notes)
    }
  };
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongEnoughPassword(value: string) {
  return value.length >= 8;
}

export function validateUserCreate(input: unknown): ValidationResult<UserPayload> {
  const body = asRecord(input);
  if (!body) {
    return invalid("Payload harus berupa JSON object.", [issue("body", "Body request tidak valid.")]);
  }

  const issues: ApiIssue[] = [];
  const name = cleanString(body.name);
  const email = cleanString(body.email).toLowerCase();
  const role = cleanString(body.role) as UserRole;
  const password = cleanString(body.password);
  const customerId = optionalString(body.customerId);

  if (!name) issues.push(issue("name", "Nama user wajib diisi."));
  if (!email || !isEmail(email)) issues.push(issue("email", "Email user tidak valid."));
  if (!userRoleOptions.includes(role)) issues.push(issue("role", "Role user tidak valid."));
  if (!password || !isStrongEnoughPassword(password)) issues.push(issue("password", "Password minimal 8 karakter."));
  if (role === "customer" && !customerId) issues.push(issue("customerId", "User customer wajib dihubungkan ke pelanggan."));

  if (issues.length) {
    return invalid("Nama, email, role, dan password user wajib valid.", issues);
  }

  return { ok: true, data: { name, email, role, password, customerId } };
}

export function validateUserPatch(input: unknown): ValidationResult<Partial<UserPayload>> {
  const body = asRecord(input);
  if (!body) {
    return invalid("Payload harus berupa JSON object.", [issue("body", "Body request tidak valid.")]);
  }

  const issues: ApiIssue[] = [];
  const payload: Partial<UserPayload> = {};
  const roleInput = hasOwn(body, "role") ? (cleanString(body.role) as UserRole) : undefined;

  if (hasOwn(body, "name")) {
    const name = cleanString(body.name);
    if (!name) issues.push(issue("name", "Nama user wajib diisi."));
    else payload.name = name;
  }

  if (hasOwn(body, "email")) {
    const email = cleanString(body.email).toLowerCase();
    if (!email || !isEmail(email)) issues.push(issue("email", "Email user tidak valid."));
    else payload.email = email;
  }

  if (hasOwn(body, "role")) {
    if (!roleInput || !userRoleOptions.includes(roleInput)) issues.push(issue("role", "Role user tidak valid."));
    else payload.role = roleInput;
  }

  if (hasOwn(body, "password")) {
    const password = cleanString(body.password);
    if (password && !isStrongEnoughPassword(password)) issues.push(issue("password", "Password minimal 8 karakter."));
    if (password) payload.password = password;
  }

  if (hasOwn(body, "customerId")) {
    payload.customerId = optionalString(body.customerId);
  }

  if (payload.role === "customer" && !payload.customerId) {
    issues.push(issue("customerId", "User customer wajib dihubungkan ke pelanggan."));
  }

  if (!issues.length && Object.keys(payload).length === 0) {
    issues.push(issue("body", "Minimal satu field user harus dikirim."));
  }

  if (issues.length) {
    return invalid("Data user tidak valid.", issues);
  }

  return { ok: true, data: payload };
}
