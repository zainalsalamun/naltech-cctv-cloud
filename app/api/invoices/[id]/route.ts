import { deleteInvoice, updateInvoice } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { validateInvoicePatch } from "@/lib/server/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validation = validateInvoicePatch(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const invoice = await updateInvoice(decodeURIComponent(id), validation.data);

  if (!invoice) {
    return jsonError("Invoice atau customer tidak ditemukan.", 404);
  }

  return jsonData(invoice);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = decodeURIComponent(id);
  const isDeleted = await deleteInvoice(invoiceId);

  if (!isDeleted) {
    return jsonError("Invoice tidak ditemukan.", 404);
  }

  return jsonData({ id: invoiceId });
}
