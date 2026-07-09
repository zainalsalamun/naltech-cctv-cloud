import { deleteCamera, updateCamera } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { validateCameraPatch } from "@/lib/server/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validation = validateCameraPatch(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const camera = await updateCamera(id, validation.data);

  if (!camera) {
    return jsonError("Kamera atau customer tidak ditemukan.", 404);
  }

  return jsonData(camera);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isDeleted = await deleteCamera(id);

  if (!isDeleted) {
    return jsonError("Kamera tidak ditemukan.", 404);
  }

  return jsonData({ id });
}
