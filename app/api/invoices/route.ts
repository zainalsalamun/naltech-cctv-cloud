import { createInvoice, listInvoices } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { validateInvoiceCreate } from "@/lib/server/validation";

export async function GET() {
  const invoices = await listInvoices();
  return jsonData(invoices);
}

export async function POST(request: Request) {
  const validation = validateInvoiceCreate(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const invoice = await createInvoice(validation.data);

  if (!invoice) {
    return jsonError("Customer tidak ditemukan atau tanggal invoice tidak valid.", 404);
  }

  return jsonData(invoice, 201);
}
