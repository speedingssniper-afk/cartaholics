import fs from "fs";
import path from "path";
import type Database from "better-sqlite3";

type SeedShirt = {
  slug: string;
  title: string;
  short_line: string;
  story: string;
  type: "archive" | "handmade";
  condition: "unworn" | "excellent" | "good" | "worn in";
  fabric: string;
  colour: string;
  price_cents: number;
  sizes: { size: string; stock: number }[];
  wash: string;
  accent: string;
  captions: string[];
  /** Committed paths under /uploads/seed — skips SVG placeholders when set */
  image_paths?: string[];
};

export const SEED: SeedShirt[] = [
  {
    slug: "cart-city-tee-black",
    title: "Cart City Tee — Black",
    short_line: "Made to order · Brisbane",
    story: "Full-front Cart City print on a black AS Colour Staple. Gold leaf + carts + BLOCKSCAN smoke. No CARTAHOLICS wordmark. Printed to order in Brisbane (DTF) — not the gig-only metallic screen run. Soft / coming soon until the sample passes. Made to order · ships from Brisbane after print. SKU CC-TEE-5001-BLK-MTO. Waitlist open.",
    type: "handmade",
    condition: "unworn",
    fabric: "AS Colour Staple Tee 5001",
    colour: "Black",
    price_cents: 7000,
    sizes: [{ size: "S", stock: 0 }],
    wash: "#0a0a0a",
    accent: "#DAB437",
    captions: ["MTO", "BLACK", "S · SOON"],
    image_paths: [
      "/uploads/seed/cart-city-tee-black-1.png",
      "/uploads/seed/cart-city-tee-black-2.png",
      "/uploads/seed/cart-city-tee-black-3.png",
    ],
  },
];

export function writeSeedImages(): Map<string, string[]> {
  const dir = path.join(process.cwd(), "public", "uploads", "seed");
  fs.mkdirSync(dir, { recursive: true });
  const map = new Map<string, string[]>();
  for (const shirt of SEED) {
    if (shirt.image_paths && shirt.image_paths.length > 0) {
      map.set(shirt.slug, shirt.image_paths);
      continue;
    }
  }
  return map;
}

/** Insert any SEED products that are missing, then delete everything else. */
export function seedIfEmpty(db: Database.Database) {
  const images = writeSeedImages();
  const insertP = db.prepare(`
    INSERT INTO products (slug, title, short_line, story, type, condition, fabric, colour, price_cents, created_at, updated_at)
    VALUES (@slug, @title, @short_line, @story, @type, @condition, @fabric, @colour, @price_cents, @now, @now)
  `);
  const insertI = db.prepare(`INSERT INTO product_images (product_id, path, sort) VALUES (?, ?, ?)`);
  const insertS = db.prepare(`INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)`);
  const exists = db.prepare("SELECT id FROM products WHERE slug = ?");
  const now = new Date().toISOString();
  const keepSlugs = SEED.map((s) => s.slug);

  const tx = db.transaction(() => {
    for (const shirt of SEED) {
      if (exists.get(shirt.slug)) continue;
      const info = insertP.run({ ...shirt, now });
      const id = Number(info.lastInsertRowid);
      (images.get(shirt.slug) || []).forEach((p, i) => insertI.run(id, p, i));
      shirt.sizes.forEach((s) => insertS.run(id, s.size, s.stock));
    }

    // Prune demo/placeholder products not in the current SEED list
    if (keepSlugs.length === 0) {
      db.prepare("DELETE FROM product_images").run();
      db.prepare("DELETE FROM product_sizes").run();
      db.prepare("DELETE FROM products").run();
    } else {
      const placeholders = keepSlugs.map(() => "?").join(",");
      const stale = db
        .prepare(`SELECT id FROM products WHERE slug NOT IN (${placeholders})`)
        .all(...keepSlugs) as { id: number }[];
      const delImg = db.prepare("DELETE FROM product_images WHERE product_id = ?");
      const delSz = db.prepare("DELETE FROM product_sizes WHERE product_id = ?");
      const delP = db.prepare("DELETE FROM products WHERE id = ?");
      for (const row of stale) {
        delImg.run(row.id);
        delSz.run(row.id);
        delP.run(row.id);
      }
    }
  });
  tx();
}
