import { notFound } from "next/navigation";
import { getOrder } from "@/lib/db";
import { formatAUD } from "@/lib/money";
import { CopyAddress } from "./CopyAddress";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(Number(id));
  if (!order) notFound();

  const addressLines =
    order.fulfilment === "pickup"
      ? ["PICKUP", order.customer_name, order.phone, order.email]
      : [
          order.customer_name,
          order.phone,
          order.street || "",
          [order.suburb, order.state, order.postcode].filter(Boolean).join(" "),
          order.country || "",
        ].filter(Boolean);

  const copyText = addressLines.join("\n");

  return (
    <main>
      <article className="slip">
        {order.rehearsal ? <p className="rehearsal-stamp">Rehearsal — no money moved</p> : null}
        <h1>Cartaholics · Packing slip · {String(order.id).padStart(4, "0")}</h1>
        <p style={{ fontFamily: "var(--sans)", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.62rem" }}>
          {new Date(order.created_at).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })} ·{" "}
          {order.fulfilment === "pickup" ? "Inner Brisbane pickup" : "Ship"}
        </p>
        <h2>{order.fulfilment === "pickup" ? "Pickup" : "Ship to"}</h2>
        <p>
          {order.customer_name}
          <br />
          {order.phone}
          {order.fulfilment === "ship" ? (
            <>
              <br />
              {order.street}
              <br />
              {order.suburb} {order.state} {order.postcode}
              <br />
              {order.country}
            </>
          ) : (
            <>
              <br />
              {order.email}
            </>
          )}
        </p>
        <h2>Contents</h2>
        <ul>
          {order.items.map((it) => (
            <li key={it.id}>
              {it.title} · {it.size} · ×{it.qty} · {formatAUD(it.price_cents)}
            </li>
          ))}
        </ul>
        <p>
          Shipping {order.shipping_cents === 0 ? "—" : formatAUD(order.shipping_cents)}
          <br />
          Total {formatAUD(order.total_cents)}
        </p>
        <div className="return-block">
          Return to
          <br />
          Cartaholics · Meanjin / Brisbane · Australia
        </div>
      </article>
      <div className="slip-actions no-print">
        <CopyAddress text={copyText} />
      </div>
    </main>
  );
}
