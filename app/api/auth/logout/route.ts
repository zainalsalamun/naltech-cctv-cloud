import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-token";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/"
  });

  return response;
}
