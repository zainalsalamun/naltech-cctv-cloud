import { NextResponse } from "next/server";
import { listInvoices } from "@/lib/server/repository";

export async function GET() {
  const invoices = await listInvoices();
  return NextResponse.json({ data: invoices });
}
