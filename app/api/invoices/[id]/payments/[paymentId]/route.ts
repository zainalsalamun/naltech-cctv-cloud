import { deletePayment } from "@/lib/server/repository";
import { jsonData, jsonError } from "@/lib/server/api-response";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { id, paymentId } = await params;
  const result = await deletePayment(decodeURIComponent(id), decodeURIComponent(paymentId));

  if (!result.data) {
    return jsonError(result.message || "Pembayaran gagal dihapus.", 404);
  }

  return jsonData(result.data);
}
