import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "cartaholics_desk";

export function sellerPin(): string {
  return process.env.SELLER_PIN || "1947";
}

export function deskToken(): string {
  return createHmac("sha256", "cartaholics-desk-hmac")
    .update(sellerPin())
    .digest("hex");
}

export function pinMatches(pin: string): boolean {
  const a = Buffer.from(String(pin || ""));
  const b = Buffer.from(sellerPin());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isDeskAuthed(): Promise<boolean> {
  const jar = await cookies();
  const val = jar.get(COOKIE)?.value;
  if (!val) return false;
  const expected = deskToken();
  const a = Buffer.from(val);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function cookieHeader(token: string, maxAge: number): string {
  const parts = [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  return parts.join("; ");
}
