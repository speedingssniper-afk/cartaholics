import { NextResponse } from "next/server";
import { cookieHeader, deskToken, isDeskAuthed, pinMatches } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: await isDeskAuthed() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pin = String(body.pin || "");
  if (!pinMatches(pin)) {
    return NextResponse.json({ ok: false, error: "The lock does not know that number." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", cookieHeader(deskToken(), 60 * 60 * 24 * 30));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", cookieHeader("", 0));
  return res;
}
