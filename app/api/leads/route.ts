import { createLead, listLeads } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { validateLeadCreate } from "@/lib/server/validation";

export async function GET() {
  const leads = await listLeads();
  return jsonData(leads);
}

export async function POST(request: Request) {
  const validation = validateLeadCreate(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const lead = await createLead(validation.data);

  return jsonData(lead, 201);
}
