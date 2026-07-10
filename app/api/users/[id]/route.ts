import { deleteManagedUser, updateManagedUser } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/session";
import { validateUserPatch } from "@/lib/server/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validation = validateUserPatch(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const result = await updateManagedUser(id, validation.data);

  if (!result.data) {
    return jsonError(result.message || "User tidak ditemukan.", result.message === "User tidak ditemukan." ? 404 : 400);
  }

  return jsonData(result.data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    return jsonError("Sesi login diperlukan.", 401);
  }

  const result = await deleteManagedUser(id, session.userId);

  if (!result.deleted) {
    return jsonError(result.message || "User tidak ditemukan.", result.message === "User tidak ditemukan." ? 404 : 400);
  }

  return jsonData({ id });
}
