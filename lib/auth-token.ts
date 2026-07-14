export const AUTH_COOKIE_NAME = "naltech_session";

export type AuthRole = "admin" | "sales" | "technician" | "customer";

export type AuthSession = {
  userId: string;
  name: string;
  email: string;
  role: AuthRole;
  customerId?: string;
  expiresAt: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getSigningKey(secret: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

export async function createAuthToken(session: AuthSession, secret: string) {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(session)));
  const key = await getSigningKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAuthToken(token: string | undefined, secret: string) {
  if (!token || !secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  try {
    const key = await getSigningKey(secret, ["verify"]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      encoder.encode(payload)
    );

    if (!valid) return null;

    const session = JSON.parse(decoder.decode(base64UrlToBytes(payload))) as AuthSession;
    if (!session.userId || !session.role || session.expiresAt <= Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}
