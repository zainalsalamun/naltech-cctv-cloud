import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, type AuthSession, verifyAuthToken } from "@/lib/auth-token";

export function authSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET belum dikonfigurasi.");
  }

  return secret;
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  return verifyAuthToken(token, authSecret());
}
