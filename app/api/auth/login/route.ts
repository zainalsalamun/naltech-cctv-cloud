import { NextResponse } from "next/server";
import { createAuthToken, AUTH_COOKIE_NAME, type AuthSession } from "@/lib/auth-token";
import { authSecret } from "@/lib/server/session";
import { verifyPassword } from "@/lib/server/password";
import { prisma } from "@/lib/server/prisma";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ message: "Email dan password wajib diisi." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ message: "Email atau password tidak sesuai." }, { status: 401 });
  }

  if (user.role === "customer" && !user.customerId) {
    return NextResponse.json({ message: "Akun customer belum terhubung ke pelanggan." }, { status: 403 });
  }

  const session: AuthSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerId: user.customerId || undefined,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000
  };
  const token = await createAuthToken(session, authSecret());
  const redirectTo = user.role === "customer"
    ? `/customer-portal?customerId=${encodeURIComponent(user.customerId || "")}`
    : "/admin";
  const response = NextResponse.json({
    data: {
      redirectTo,
      user: {
        name: user.name,
        role: user.role
      }
    }
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/"
  });

  return response;
}
