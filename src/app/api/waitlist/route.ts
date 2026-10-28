import { NextResponse } from "next/server";
import { addWaitlist, getProduct } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const product_id = Number(body.product_id);
  const size = String(body.size || "").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  if (!product_id || !size || !name || !email) {
    return NextResponse.json({ error: "Name, email, and size." }, { status: 400 });
  }
  if (!getProduct(product_id)) {
    return NextResponse.json({ error: "Gone." }, { status: 404 });
  }
  addWaitlist(product_id, size, name, email);
  return NextResponse.json({ ok: true });
}
