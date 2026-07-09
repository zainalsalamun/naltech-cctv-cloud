import { NextResponse } from "next/server";
import { getCustomerDetail } from "@/lib/server/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    return NextResponse.json({ message: "Customer tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ data: customer });
}
