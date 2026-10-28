import { ProductCard } from "@/components/ProductCard";
import { listProducts } from "@/lib/db";
import type { ArchiveFilters } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const filters: ArchiveFilters = {
    size: pick("size"),
    condition: pick("condition"),
    type: pick("type"),
    availability: pick("availability"),
    price: pick("price"),
  };
  const products = listProducts(filters);

  return (
    <main>
      <div className="archive-top">
        <p className="section-label">01</p>
        <h1>
          Shirts.
        </h1>
        <p className="lede">Pieces that stayed when the body did not. Gone stays listed.</p>
        <form className="filters" method="get">
          <select name="size" defaultValue={filters.size || ""} aria-label="Size">
            <option value="">Size</option>
            {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="condition" defaultValue={filters.condition || ""} aria-label="Condition">
            <option value="">Condition</option>
            {["unworn", "excellent", "good", "worn in"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={filters.type || ""} aria-label="Type">
            <option value="">Type</option>
            <option value="archive">Archive</option>
            <option value="handmade">Handmade</option>
          </select>
          <select name="availability" defaultValue={filters.availability || ""} aria-label="Availability">
            <option value="">Availability</option>
            <option value="in-stock">In stock</option>
            <option value="sold-out">Gone</option>
          </select>
          <select name="price" defaultValue={filters.price || ""} aria-label="Price">
            <option value="">Price</option>
            <option value="under-80">Under A$80</option>
            <option value="80-150">A$80–150</option>
            <option value="over-150">Over A$150</option>
          </select>
          <button className="btn" type="submit">
            Apply
          </button>
          <Link className="reset" href="/archive">
            Clear
          </Link>
        </form>
      </div>
      {products.length === 0 ? (
        <p className="notice" style={{ padding: "1rem 0.6rem 4rem" }}>
          Nothing under those rules.
        </p>
      ) : (
        <div className="grid snap-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
