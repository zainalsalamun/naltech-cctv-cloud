import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/server/repository";

export async function GET() {
  const customers = await listCustomers();
  return NextResponse.json({ data: customers });
}
