import { NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/server/repository";
import type { CloudPackage } from "@/types/operational";

const packageOptions: CloudPackage[] = ["Basic", "Standard", "Pro"];

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json({ data: leads });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || !body.segment || !body.cameras || !packageOptions.includes(body.package)) {
    return NextResponse.json(
      { message: "Nama, jenis lokasi, jumlah kamera, dan paket wajib diisi." },
      { status: 400 }
    );
  }

  const lead = await createLead({
    name: String(body.name),
    phone: body.phone ? String(body.phone) : undefined,
    segment: String(body.segment),
    cameras: Math.max(1, Number.parseInt(String(body.cameras), 10) || 1),
    package: body.package,
    area: body.area ? String(body.area) : "Yogyakarta",
    notes: body.notes ? String(body.notes) : undefined
  });

  return NextResponse.json({ data: lead }, { status: 201 });
}
