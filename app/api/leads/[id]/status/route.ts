import { updateLeadStatus } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { validateLeadStatusPatch } from "@/lib/server/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validation = validateLeadStatusPatch(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const lead = await updateLeadStatus(id, validation.data.status);

  if (!lead) {
    return jsonError("Lead tidak ditemukan.", 404);
  }

  return jsonData(lead);
}
