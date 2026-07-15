import { leads as baseLeads } from "@/data/operational";
import { calculateMonthlyAmount } from "@/lib/pricing";
import { toSeedLead } from "@/lib/operational";
import type { Invoice, InvoiceStatus, LeadStatus, LeadWithId } from "@/types/operational";

const serverLeads = new Map<string, LeadWithId>(
  baseLeads.map((lead) => {
    const seedLead = toSeedLead(lead);
    return [seedLead.id, seedLead];
  })
);

function invoiceStatus(index: number): InvoiceStatus {
  if (index === 1) return "Unpaid";
  if (index === 2) return "Overdue";
  return "Paid";
}

export function listLeads() {
  return Array.from(serverLeads.values());
}

export function createLead(input: Omit<LeadWithId, "id" | "status" | "createdAt"> & Partial<Pick<LeadWithId, "status" | "createdAt">>) {
  const lead: LeadWithId = {
    ...input,
    id: `lead-${Date.now()}`,
    status: input.status || "Baru",
    createdAt: input.createdAt || new Date().toISOString()
  };

  serverLeads.set(lead.id, lead);
  return lead;
}

export function updateLeadStatus(leadId: string, status: LeadStatus) {
  const lead = serverLeads.get(leadId);
  if (!lead) return null;

  const updatedLead = { ...lead, status };
  serverLeads.set(leadId, updatedLead);
  return updatedLead;
}

export function listCustomers() {
  return listLeads().filter((lead) => lead.status === "Pilot aktif");
}

export function listInvoices(): Invoice[] {
  return listCustomers().map((lead, index) => ({
    id: `INV-2026-05-${String(index + 1).padStart(3, "0")}`,
    customerId: lead.id,
    customer: lead.name,
    customerPhone: lead.phone,
    area: lead.area,
    cameras: lead.cameras,
    package: lead.package,
    amount: calculateMonthlyAmount(lead.cameras, lead.package),
    paidAmount: 0,
    remainingAmount: calculateMonthlyAmount(lead.cameras, lead.package),
    dueDate: index === 2 ? "10 Mei 2026" : "20 Mei 2026",
    status: invoiceStatus(index),
    payments: []
  }));
}
