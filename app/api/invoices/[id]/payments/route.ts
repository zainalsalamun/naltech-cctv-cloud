import { recordPayment } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { validatePaymentCreate } from "@/lib/server/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validation = validatePaymentCreate(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const result = await recordPayment(decodeURIComponent(id), validation.data);

  if (!result.data) {
    return jsonError(result.message || "Pembayaran gagal dicatat.", 400);
  }

  return jsonData(result.data, 201);
}
