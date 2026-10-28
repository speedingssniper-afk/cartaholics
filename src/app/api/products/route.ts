import { NextResponse } from "next/server";
import { isDeskAuthed } from "@/lib/auth";
import { createProduct, listProducts } from "@/lib/db";
import type { ArchiveFilters } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters: ArchiveFilters = {
    size: url.searchParams.get("size") || undefined,
    condition: url.searchParams.get("condition") || undefined,
    type: url.searchParams.get("type") || undefined,
    availability: url.searchParams.get("availability") || undefined,
    price: url.searchParams.get("price") || undefined,
  };
  return NextResponse.json(listProducts(filters));
}

export async function POST(req: Request) {
  if (!(await isDeskAuthed())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const body = await req.json();
  const title = String(body.title || "").trim();
  const price_cents = Math.round(Number(body.price_cents) || 0);
  if (!title || price_cents <= 0) {
    return NextResponse.json({ error: "Title and price are required." }, { status: 400 });
  }
  const product = createProduct({
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
  return NextResponse.json(product);
}
