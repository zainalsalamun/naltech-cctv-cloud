import { NextResponse } from "next/server";

export type ApiIssue = {
  field: string;
  message: string;
};

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(message: string, status = 400, issues?: ApiIssue[]) {
  return NextResponse.json(
    {
      message,
      ...(issues?.length ? { issues } : {})
    },
    { status }
  );
}

export async function readJsonBody(request: Request) {
  return request.json().catch(() => null) as Promise<unknown>;
}
