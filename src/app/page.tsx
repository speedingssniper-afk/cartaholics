import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { featuredProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const featured = featuredProducts(4);
  return (
    <main>
      <section className="hero">
        <p className="hero-kicker">01 / shirts</p>
        <h1>
          <span className="line-a">The body moved on.</span>
          <span className="line-b">The cloth did not.</span>
        </h1>
        <p>
          <Link className="cta" href="/archive">
            archive
          </Link>
        </p>
        <p className="hero-note">pickup meanjin</p>
      </section>
      <p className="held-label">held</p>
      <div className="grid snap-grid">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
