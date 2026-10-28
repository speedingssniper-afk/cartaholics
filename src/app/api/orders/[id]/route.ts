import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const order = getOrder(Number(id));
  if (!order) return NextResponse.json({ error: "No such slip." }, { status: 404 });
  return NextResponse.json(order);
}
