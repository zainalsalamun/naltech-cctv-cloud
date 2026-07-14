import type { Invoice } from "@/types/operational";

export function normalizeWhatsAppNumber(phone?: string) {
  if (!phone) return undefined;

  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits.startsWith("8")
      ? `62${digits}`
      : digits;

  return /^62\d{8,13}$/.test(normalized) ? normalized : undefined;
}

export function createInvoiceReminderUrl(invoice: Invoice) {
  const phone = normalizeWhatsAppNumber(invoice.customerPhone);

  if (!phone) return undefined;

  const amount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(invoice.amount);
  const message = [
    `Halo Bapak/Ibu ${invoice.customer},`,
    "",
    "Kami dari Naltech CCTV Cloud ingin mengingatkan tagihan layanan Cloud CCTV:",
    `Invoice: ${invoice.id}`,
    `Paket: ${invoice.package} (${invoice.cameras} kamera)`,
    `Total: ${amount}`,
    `Jatuh tempo: ${invoice.dueDate}`,
    "",
    "Mohon konfirmasi apabila pembayaran sudah dilakukan. Terima kasih."
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
