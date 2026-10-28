import { notFound } from "next/navigation";
import { Gallery, PieceActions } from "@/components/PieceActions";
import { getProduct } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) notFound();
  return (
    <main className="piece">
      <Gallery product={product} />
      <div className="piece-body">
        <p className="piece-kicker">
          {product.type === "handmade" ? "Handmade" : "Archive"} · {product.condition}
        </p>
        <h1>{product.title}</h1>
        <p className="lede">{product.short_line}</p>
        <div className="facts">
          <div>
            Fabric <span>{product.fabric}</span>
          </div>
          <div>
            Colour <span>{product.colour}</span>
          </div>
          <div>
            Condition <span>{product.condition}</span>
          </div>
        </div>
        <div className="story">
          <h2>About this piece</h2>
          <p>{product.story}</p>
        </div>
        <PieceActions product={product} />
      </div>
    </main>
  );
}
