import { NextResponse } from "next/server";
import { isDeskAuthed } from "@/lib/auth";
import { createOrder, listOrders } from "@/lib/db";
import { shippingCents } from "@/lib/money";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isDeskAuthed())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  return NextResponse.json(listOrders());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Empty." }, { status: 400 });

  const fulfilment = body.fulfilment === "ship" ? "ship" : "pickup";
  const name = String(body.customer_name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!name || !phone || !email) {
    return NextResponse.json({ error: "Name, phone, and email are required." }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "The bag is empty." }, { status: 400 });
  }

  let street, suburb, state, postcode, country;
  if (fulfilment === "ship") {
    street = String(body.street || "").trim();
    suburb = String(body.suburb || "").trim();
    state = String(body.state || "").trim();
    postcode = String(body.postcode || "").trim();
    country = String(body.country || "").trim();
    if (!street || !suburb || !state || !postcode || !country) {
      return NextResponse.json(
        { error: "A full address is required to ship — including phone and state." },
        { status: 400 }
      );
    }
  }

  const ship = shippingCents(fulfilment, country || "AU");
  const paypalClient = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const rehearsal = !paypalClient;
  if (!rehearsal && !body.paypal_id) {
    return NextResponse.json({ error: "PayPal did not return a capture." }, { status: 400 });
  }

  try {
    const order = createOrder({
      fulfilment,
      customer_name: name,
      phone,
      email,
      street,
      suburb,
      state,
      postcode,
      country: fulfilment === "ship" ? country : "Australia",
      shipping_cents: ship,
      paypal_id: body.paypal_id || null,
      rehearsal,
      items: items.map((i: { product_id: number; size: string; qty: number }) => ({
        product_id: Number(i.product_id),
        size: String(i.size),
        qty: Math.max(1, Number(i.qty) || 1),
      })),
    });
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "The order could not be kept.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
