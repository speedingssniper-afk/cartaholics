import Link from "next/link";
import { formatAUD } from "@/lib/money";
import { inStock } from "@/lib/db";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const sold = !inStock(product);
  const img = product.images[0]?.path;
  const sizes = product.sizes.map((s) => s.size).join(" · ");
  return (
    <Link href={`/piece/${product.id}`} className="card">
      <div className="frame">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.title} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#110e0c" }} />
        )}
        {sold ? <span className="sold-mark">gone</span> : null}
      </div>
      <div className="card-meta">
        <h2 className="card-title">{product.title}</h2>
        <div className="card-row">
          <span>{formatAUD(product.price_cents)}</span>
          <span className={sold ? "gone" : undefined}>{sold ? "gone" : sizes}</span>
        </div>
      </div>
    </Link>
  );
}
