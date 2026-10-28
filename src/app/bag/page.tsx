"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatAUD } from "@/lib/money";
import type { Product } from "@/lib/types";

export default function BagPage() {
  const { items, setQty, setSize, remove, subtotal, ready } = useCart();
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  if (!ready) return <main className="bag-empty"><p className="notice">Counting.</p></main>;

  if (items.length === 0) {
    return (
      <main className="bag-empty">
        <h1>The bag is empty.</h1>
        <p>Nothing held. The archive is still there.</p>
        <p style={{ marginTop: "1.4rem" }}>
          <Link className="cta" href="/archive">
            Return to the archive
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <div className="page-head">
        <p className="section-label">Bag</p>
        <h1>Held.</h1>
      </div>
      <div className="bag-list">
        {items.map((item) => {
          const product = catalog.find((p) => p.id === item.productId);
          const liveSizes = product?.sizes.filter((s) => s.stock > 0 || s.size === item.size) || [];
          return (
            <article className="bag-row" key={`${item.productId}-${item.size}`}>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="thumb" src={item.image} alt="" />
              ) : (
                <div className="thumb" />
              )}
              <div>
                <h2>{item.title}</h2>
                <p className="price">{formatAUD(item.priceCents)}</p>
                <div className="bag-controls">
                  <select
                    aria-label="Size"
                    value={item.size}
                    onChange={(e) => setSize(item.productId, item.size, e.target.value)}
                  >
                    {(liveSizes.length ? liveSizes : [{ size: item.size, stock: 0 }]).map((s) => (
                      <option key={s.size} value={s.size} disabled={"stock" in s && s.stock < 1 && s.size !== item.size}>
                        {s.size}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    aria-label="Quantity"
                    value={item.qty}
                    onChange={(e) => setQty(item.productId, item.size, Number(e.target.value))}
                  />
                  <button className="btn ghost" type="button" onClick={() => remove(item.productId, item.size)}>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        <div className="totals">
          <div>Subtotal {formatAUD(subtotal)}</div>
        </div>
        <Link className="btn" href="/checkout">
          Checkout
        </Link>
      </div>
    </main>
  );
}
