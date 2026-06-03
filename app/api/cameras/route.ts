import { NextResponse } from "next/server";
import { listCameras } from "@/lib/server/repository";

export async function GET() {
  const cameras = await listCameras();
  return NextResponse.json({ data: cameras });
}
