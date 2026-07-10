import { createManagedUser, listUsers } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { validateUserCreate } from "@/lib/server/validation";

export async function GET() {
  const users = await listUsers();
  return jsonData(users);
}

export async function POST(request: Request) {
  const validation = validateUserCreate(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const result = await createManagedUser(validation.data);

  if (!result.data) {
    return jsonError(result.message || "User gagal dibuat.", 400);
  }

  return jsonData(result.data, 201);
}
