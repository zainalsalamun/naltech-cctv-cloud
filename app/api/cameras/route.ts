import { createCamera, listCameras } from "@/lib/server/repository";
import { jsonData, jsonError, readJsonBody } from "@/lib/server/api-response";
import { validateCameraCreate } from "@/lib/server/validation";

export async function GET() {
  const cameras = await listCameras();
  return jsonData(cameras);
}

export async function POST(request: Request) {
  const validation = validateCameraCreate(await readJsonBody(request));

  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.issues);
  }

  const camera = await createCamera(validation.data);

  if (!camera) {
    return jsonError("Customer tidak ditemukan.", 404);
  }

  return jsonData(camera, 201);
}
