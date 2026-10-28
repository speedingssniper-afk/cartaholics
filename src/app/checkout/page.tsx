"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatAUD, shippingCents } from "@/lib/money";

const PAYPAL = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

const COUNTRIES = [
  ["AU", "Australia"],
  ["NZ", "New Zealand"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["JP", "Japan"],
  ["SG", "Singapore"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["IT", "Italy"],
  ["NL", "Netherlands"],
  ["IE", "Ireland"],
  ["OTHER", "Rest of world"],
];

type PaypalNS = {
  Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void> };
};

export default function CheckoutPage() {
  const { items, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const [fulfilment, setFulfilment] = useState<"pickup" | "ship">("pickup");
  const [country, setCountry] = useState("AU");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const paypalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const ship = useMemo(() => shippingCents(fulfilment, country), [fulfilment, country]);
  const total = subtotal + ship;
  const rehearsal = !PAYPAL;

  const payloadFromForm = () => {
    const fd = new FormData(formRef.current!);
    return {
      fulfilment,
      customer_name: String(fd.get("customer_name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      street: String(fd.get("street") || ""),
      suburb: String(fd.get("suburb") || ""),
      state: String(fd.get("state") || ""),
      postcode: String(fd.get("postcode") || ""),
      country: fulfilment === "ship" ? country : "Australia",
      items: items.map((i) => ({ product_id: i.productId, size: i.size, qty: i.qty })),
    };
  };

  async function place(paypal_id?: string) {
    setError("");
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payloadFromForm(), paypal_id }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "The order could not be kept.");
      throw new Error(data.error);
    }
    clear();
    router.push(`/order/${data.id}`);
    return data;
  }

  useEffect(() => {
    if (!PAYPAL || rehearsal || items.length === 0) return;
    let cancelled = false;
    const id = "paypal-sdk";
    function mount(paypal: PaypalNS) {
      if (!paypalRef.current || cancelled) return;
      paypalRef.current.innerHTML = "";
      paypal
        .Buttons({
          style: { color: "gold", shape: "rect", label: "paypal", layout: "vertical" },
          createOrder: (_d: unknown, actions: { order: { create: (x: unknown) => Promise<string> } }) =>
            actions.order.create({
              purchase_units: [{ amount: { value: (total / 100).toFixed(2), currency_code: "AUD" } }],
            }),
          onApprove: async (_d: unknown, actions: { order: { capture: () => Promise<{ id: string }> } }) => {
            const details = await actions.order.capture();
            await place(details.id);
          },
          onError: () => setError("PayPal declined the gesture."),
        })
        .render(paypalRef.current);
    }
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing && (window as unknown as { paypal?: PaypalNS }).paypal) {
      mount((window as unknown as { paypal: PaypalNS }).paypal);
    } else {
      const s = document.createElement("script");
      s.id = id;
      s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL}&currency=AUD`;
      s.onload = () => mount((window as unknown as { paypal: PaypalNS }).paypal);
      document.body.appendChild(s);
    }
    return () => {
      cancelled = true;
    };
    // place reads the live form at click time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rehearsal, items.length, total, fulfilment, country]);

  if (!ready) return <main className="checkout"><p className="notice">Counting.</p></main>;
  if (items.length === 0) {
    return (
      <main className="checkout">
        <h1>Nothing to keep.</h1>
        <p className="notice">The bag is empty.</p>
      </main>
    );
  }

  return (
    <main className="checkout">
      <p className="section-label">Checkout</p>
      <h1 style={{ fontStyle: "italic", fontWeight: 500, fontSize: "2.4rem", margin: 0 }}>How it leaves.</h1>
      {rehearsal ? (
        <p className="rehearsal-note">Rehearsal — no money will move.</p>
      ) : null}

      <div className="mode">
        <button className="btn" type="button" aria-pressed={fulfilment === "pickup"} onClick={() => setFulfilment("pickup")} style={{ background: fulfilment === "pickup" ? "var(--brass)" : "transparent", color: fulfilment === "pickup" ? "var(--void)" : "var(--brass)" }}>
          Inner Brisbane pickup
        </button>
        <button className="btn" type="button" aria-pressed={fulfilment === "ship"} onClick={() => setFulfilment("ship")} style={{ background: fulfilment === "ship" ? "var(--brass)" : "transparent", color: fulfilment === "ship" ? "var(--void)" : "var(--brass)" }}>
          Ship
        </button>
      </div>
      <p className="notice">
        {fulfilment === "pickup"
          ? "Free. Meet point and window sent after the order — usually within two days."
          : "Australia A$12.00 · New Zealand A$18.00 · Rest of world A$28.00"}
      </p>

      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!rehearsal) return;
          try {
            await place();
          } catch {
            /* shown */
          }
        }}
      >
        <div className="field">
          <label htmlFor="customer_name">Name</label>
          <input id="customer_name" name="customer_name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" required autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        {fulfilment === "ship" ? (
          <>
            <div className="field">
              <label htmlFor="street">Street</label>
              <input id="street" name="street" required autoComplete="street-address" />
            </div>
            <div className="field">
              <label htmlFor="suburb">Suburb</label>
              <input id="suburb" name="suburb" required autoComplete="address-level2" />
            </div>
            <div className="field">
              <label htmlFor="state">State</label>
              <input id="state" name="state" required autoComplete="address-level1" />
            </div>
            <div className="field">
              <label htmlFor="postcode">Postcode</label>
              <input id="postcode" name="postcode" required autoComplete="postal-code" />
            </div>
            <div className="field">
              <label htmlFor="country">Country</label>
              <select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} required>
                {COUNTRIES.map(([c, n]) => (
                  <option key={c} value={c}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        <div className="totals">
          <div>Pieces {formatAUD(subtotal)}</div>
          <div>Fulfilment {ship === 0 ? "Free pickup" : formatAUD(ship)}</div>
          <div>Total {formatAUD(total)}</div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        {rehearsal ? (
          <button className="btn" type="submit" disabled={busy} style={{ marginTop: "1rem" }}>
            {busy ? "Keeping…" : "Rehearsal — no money will move."}
          </button>
        ) : (
          <div ref={paypalRef} style={{ marginTop: "1rem" }} />
        )}
      </form>
    </main>
  );
}
