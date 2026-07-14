import type { CustomerStatus, Lead, LeadStatus, LeadWithId } from "@/types/operational";

export const leadStorageKey = "naltech-cloud-cctv-leads";
export const leadStatusStorageKey = "naltech-cloud-cctv-lead-statuses";

export const leadStatusOptions: LeadStatus[] = [
  "Baru",
  "Menunggu follow-up",
  "Follow-up",
  "Survey dijadwalkan",
  "Pilot aktif",
  "Tidak lanjut"
];

export function readClientJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    return JSON.parse(window.localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

export function saveClientJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function slugify(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

export function toSeedLead(lead: Lead): LeadWithId {
  return {
    ...lead,
    id: `seed-${slugify(lead.name)}`
  };
}

export function applyLeadStatuses(leads: LeadWithId[], statusMap: Record<string, LeadStatus>) {
  return leads.map((lead) => ({
    ...lead,
    status: statusMap[lead.id] || lead.status
  }));
}

export function customerStatus(status: LeadStatus): CustomerStatus {
  if (status === "Pilot aktif") return "Aktif";
  if (status === "Survey dijadwalkan") return "Survey";
  return "Prospek";
}

export function isActiveLead(lead: LeadWithId) {
  return lead.status === "Pilot aktif";
}
