import { ProductCard } from "@/components/ProductCard";
import { featuredProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const featured = featuredProducts(4);
  return (
    <main>
      <div className="grid snap-grid">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
