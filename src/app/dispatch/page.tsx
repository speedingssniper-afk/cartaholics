"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OrderWithItems } from "@/lib/types";
import { formatAUD } from "@/lib/money";

export default function DispatchPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/orders");
    if (r.status === 401) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    setOrders(await r.json());
  }

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) load();
        else setAuthed(false);
      });
  }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!r.ok) {
      setError("The lock does not know that number.");
      return;
    }
    load();
  }

  if (authed === null) return <main className="desk"><p className="notice">…</p></main>;
  if (!authed) {
    return (
      <main className="desk">
        <form className="pin-gate" onSubmit={unlock}>
          <p className="section-label">Dispatch</p>
          <h1>The lock.</h1>
          <div className="field">
            <label htmlFor="pin">PIN</label>
            <input id="pin" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit">
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="desk">
      <p className="section-label">Dispatch</p>
      <h1 style={{ fontStyle: "italic", fontWeight: 500, fontSize: "2.4rem" }}>Orders.</h1>
      {orders.length === 0 ? <p className="notice">None yet.</p> : null}
      <div className="desk-list">
        {orders.map((o) => (
          <article key={o.id} style={{ borderTop: "1px solid var(--hair)", paddingTop: "0.9rem" }}>
            <p className="price">
              #{String(o.id).padStart(4, "0")} · {o.fulfilment} · {o.rehearsal ? "rehearsal" : "paid"}
            </p>
            <h2 style={{ fontStyle: "italic", margin: "0.2rem 0", fontWeight: 500 }}>{o.customer_name}</h2>
            <p className="notice">
              {o.phone} · {o.email}
              {o.fulfilment === "ship" ? (
                <>
                  <br />
                  {o.street}, {o.suburb} {o.state} {o.postcode} {o.country}
                </>
              ) : (
                <> · pickup</>
              )}
            </p>
            <ul>
              {o.items.map((it) => (
                <li key={it.id}>
                  {it.title} · {it.size} ×{it.qty} · {formatAUD(it.price_cents)}
                </li>
              ))}
            </ul>
            <p className="price">Total {formatAUD(o.total_cents)}</p>
            <p style={{ marginTop: "0.6rem" }}>
              <Link className="cta" href={`/order/${o.id}`}>
                Reprint packing slip
              </Link>
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
