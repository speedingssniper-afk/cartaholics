"use client";

import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { formatAUD } from "@/lib/money";
import type { Product } from "@/lib/types";

export function Gallery({ product }: { product: Product }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <div className="gallery">
        {product.images.map((img) => (
          <button key={img.id} type="button" onClick={() => setOpen(img.path)} aria-label="Enlarge photograph">
            <div className="frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.path} alt={product.title} />
            </div>
          </button>
        ))}
      </div>
      {open ? (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt={product.title} />
        </div>
      ) : null}
    </>
  );
}

export function PieceActions({ product }: { product: Product }) {
  const { add } = useCart();
  const firstLive = product.sizes.find((s) => s.stock > 0)?.size || product.sizes[0]?.size || "";
  const [size, setSize] = useState(firstLive);
  const [msg, setMsg] = useState("");
  const [waitName, setWaitName] = useState("");
  const [waitEmail, setWaitEmail] = useState("");
  const [waited, setWaited] = useState(false);

  const selected = useMemo(() => product.sizes.find((s) => s.size === size), [product.sizes, size]);
  const gone = !selected || selected.stock < 1;
  const allGone = product.sizes.every((s) => s.stock < 1);

  async function waitlist(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, size, name: waitName, email: waitEmail }),
    });
    if (res.ok) setWaited(true);
  }

  return (
    <div>
      <p className="price">{formatAUD(product.price_cents)}</p>
      <div className="sizes" role="group" aria-label="Size">
        {product.sizes.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={size === s.size}
            disabled={s.stock < 1}
            onClick={() => setSize(s.size)}
          >
            {s.size}
          </button>
        ))}
      </div>
      {allGone || gone ? (
        <>
          <p className="sold-banner">gone</p>
          {waited ? (
            <p className="notice">Noted. If it returns, you will hear.</p>
          ) : (
            <form className="waitlist" onSubmit={waitlist}>
              <p className="notice">This size is gone. Leave a name. Not a list for the house — only this piece.</p>
              <div className="field">
                <label htmlFor="w-name">Name</label>
                <input id="w-name" required value={waitName} onChange={(e) => setWaitName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="w-email">Email</label>
                <input
                  id="w-email"
                  type="email"
                  required
                  value={waitEmail}
                  onChange={(e) => setWaitEmail(e.target.value)}
                />
              </div>
              <button className="btn" type="submit">
                Wait for this size
              </button>
            </form>
          )}
        </>
      ) : (
        <button
          className="btn"
          type="button"
          onClick={() => {
            add({
              productId: product.id,
              slug: product.slug,
              title: product.title,
              size,
              qty: 1,
              priceCents: product.price_cents,
              image: product.images[0]?.path || "",
              type: product.type,
            });
            setMsg("In the bag.");
          }}
        >
          Add to bag
        </button>
      )}
      {msg ? <p className="notice">{msg}</p> : null}
    </div>
  );
}
