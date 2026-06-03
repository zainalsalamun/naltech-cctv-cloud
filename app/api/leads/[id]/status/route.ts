import { NextResponse } from "next/server";
import { updateLeadStatus } from "@/lib/server/repository";
import { leadStatusOptions } from "@/lib/operational";
import type { LeadStatus } from "@/types/operational";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const status = String(body.status || "") as LeadStatus;

  if (!leadStatusOptions.includes(status)) {
    return NextResponse.json({ message: "Status lead tidak valid." }, { status: 400 });
  }

  const lead = await updateLeadStatus(id, status);

  if (!lead) {
    return NextResponse.json({ message: "Lead tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ data: lead });
}
