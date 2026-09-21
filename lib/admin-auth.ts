import { env } from "cloudflare:workers";

export const ADMIN_COOKIE_NAME = "admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 14;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signToken(): Promise<string> {
  const secret = env.ADMIN_SESSION_SECRET ?? "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ADMIN_COOKIE_NAME));
  return toHex(signature);
}

export async function createAdminSessionCookie(secure: boolean): Promise<string> {
  const token = await signToken();
  return `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_SESSION_MAX_AGE}${secure ? "; Secure" : ""}`;
}

export function clearAdminSessionCookie(): string {
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !env.ADMIN_SESSION_SECRET) return false;
  const expected = await signToken();
  return token === expected;
}

export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return undefined;
}
