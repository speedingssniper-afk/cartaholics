import { NextResponse } from "next/server";
import { isDeskAuthed } from "@/lib/auth";
import { deleteProduct, getProduct, markSold, updateProduct } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const product = getProduct(Number(id));
  if (!product) return NextResponse.json({ error: "Gone." }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isDeskAuthed())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  if (body.markSold) {
    const product = markSold(Number(id));
    if (!product) return NextResponse.json({ error: "Gone." }, { status: 404 });
    return NextResponse.json(product);
  }
  const title = String(body.title || "").trim();
  const price_cents = Math.round(Number(body.price_cents) || 0);
  if (!title || price_cents <= 0) {
    return NextResponse.json({ error: "Title and price are required." }, { status: 400 });
  }
  const product = updateProduct(Number(id), {
    title,
    short_line: String(body.short_line || "").trim(),
    story: String(body.story || "").trim(),
    type: body.type === "handmade" ? "handmade" : "archive",
    condition: ["unworn", "excellent", "good", "worn in"].includes(body.condition)
      ? body.condition
      : "good",
    fabric: String(body.fabric || "").trim(),
    colour: String(body.colour || "").trim(),
    price_cents,
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    images: Array.isArray(body.images) ? body.images : [],
  });
  if (!product) return NextResponse.json({ error: "Gone." }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isDeskAuthed())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = deleteProduct(Number(id));
  if (!ok) return NextResponse.json({ error: "Gone." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
