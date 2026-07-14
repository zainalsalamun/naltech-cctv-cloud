import type { CameraPayload, CustomerDetail, Invoice, InvoicePayload, LeadStatus, LeadWithId, ManagedCamera, ManagedUser, PaymentPayload, UserPayload } from "@/types/operational";

type ApiResponse<T> = {
  data: T;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: "Request gagal." }));
    throw new Error(errorBody.message || "Request gagal.");
  }

  const body = (await response.json()) as ApiResponse<T>;
  return body.data;
}

export function getLeads() {
  return requestJson<LeadWithId[]>("/api/leads");
}

export function createLead(input: Omit<LeadWithId, "id" | "status" | "createdAt">) {
  return requestJson<LeadWithId>("/api/leads", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateLeadStatus(leadId: string, status: LeadStatus) {
  return requestJson<LeadWithId>(`/api/leads/${leadId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function getCustomers() {
  return requestJson<LeadWithId[]>("/api/customers");
}

export function getCustomerDetail(customerId: string) {
  return requestJson<CustomerDetail>(`/api/customers/${customerId}`);
}

export function getInvoices() {
  return requestJson<Invoice[]>("/api/invoices");
}

export function createInvoice(input: InvoicePayload) {
  return requestJson<Invoice>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateInvoice(invoiceId: string, input: Partial<InvoicePayload>) {
  return requestJson<Invoice>(`/api/invoices/${encodeURIComponent(invoiceId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteInvoice(invoiceId: string) {
  return requestJson<{ id: string }>(`/api/invoices/${encodeURIComponent(invoiceId)}`, {
    method: "DELETE"
  });
}

export function createPayment(invoiceId: string, input: PaymentPayload) {
  return requestJson<Invoice>(`/api/invoices/${encodeURIComponent(invoiceId)}/payments`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function deletePayment(invoiceId: string, paymentId: string) {
  return requestJson<Invoice>(
    `/api/invoices/${encodeURIComponent(invoiceId)}/payments/${encodeURIComponent(paymentId)}`,
    { method: "DELETE" }
  );
}

export function getCameras() {
  return requestJson<ManagedCamera[]>("/api/cameras");
}

export function createCamera(input: CameraPayload) {
  return requestJson<ManagedCamera>("/api/cameras", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateCamera(cameraId: string, input: Partial<CameraPayload>) {
  return requestJson<ManagedCamera>(`/api/cameras/${cameraId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteCamera(cameraId: string) {
  return requestJson<{ id: string }>(`/api/cameras/${cameraId}`, {
    method: "DELETE"
  });
}

export function getUsers() {
  return requestJson<ManagedUser[]>("/api/users");
}

export function createUser(input: UserPayload) {
  return requestJson<ManagedUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateUser(userId: string, input: Partial<UserPayload>) {
  return requestJson<ManagedUser>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteUser(userId: string) {
  return requestJson<{ id: string }>(`/api/users/${userId}`, {
    method: "DELETE"
  });
}
