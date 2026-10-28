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
    slug: "collar-after-midnight",
    title: "Collar After Midnight",
    short_line: "Ivory poplin. A night that did not end at the neck.",
    story: "Cut for a body that kept later hours. The collar still remembers heat. Nothing else does.",
    type: "archive",
    condition: "excellent",
    fabric: "cotton poplin",
    colour: "ivory",
    price_cents: 8900,
    sizes: [{ size: "M", stock: 1 }],
    wash: "#1a1612",
    accent: "#d9cbb0",
    captions: ["COL. 01", "IVORY", "M"],
  },
  {
    slug: "the-unbuttoned-year",
    title: "The Unbuttoned Year",
    short_line: "Black. Worn in. The posts held.",
    story: "Twelve months of the same shirt. The buttons kept their posts. The wearer did not.",
    type: "archive",
    condition: "worn in",
    fabric: "cotton twill",
    colour: "black",
    price_cents: 6400,
    sizes: [{ size: "L", stock: 0 }],
    wash: "#0e0c0b",
    accent: "#3a3530",
    captions: ["COL. 02", "BLACK", "L · GONE"],
  },
  {
    slug: "heat-kept-in-cotton",
    title: "Heat Kept in Cotton",
    short_line: "A wine-dark cloth that learned summer.",
    story: "Not a colour you choose. A colour that arrives after the wash, after the year.",
    type: "archive",
    condition: "good",
    fabric: "cotton",
    colour: "oxblood",
    price_cents: 7200,
    sizes: [{ size: "S", stock: 1 }],
    wash: "#1c0e10",
    accent: "#7a1f28",
    captions: ["COL. 03", "OXBLOOD", "S"],
  },
  {
    slug: "second-skin-first-light",
    title: "Second Skin, First Light",
    short_line: "Cream. Unworn. Folded too long.",
    story: "Bought for a season that did not come. The crease is the only history it has.",
    type: "archive",
    condition: "unworn",
    fabric: "linen-cotton",
    colour: "cream",
    price_cents: 11000,
    sizes: [{ size: "XL", stock: 1 }],
    wash: "#161410",
    accent: "#cfc3a6",
    captions: ["COL. 04", "CREAM", "XL"],
  },
  {
    slug: "a-shirt-that-waited",
    title: "A Shirt That Waited",
    short_line: "Charcoal. Excellent. Patient.",
    story: "It hung through two apartments. The cloth did not mind. The body outgrew the hanging.",
    type: "archive",
    condition: "excellent",
    fabric: "cotton",
    colour: "charcoal",
    price_cents: 8400,
    sizes: [
      { size: "S", stock: 0 },
      { size: "M", stock: 1 },
    ],
    wash: "#121110",
    accent: "#6b6560",
    captions: ["COL. 05", "CHARCOAL", "M"],
  },
  {
    slug: "the-quiet-placket",
    title: "The Quiet Placket",
    short_line: "White, almost. The front learned how to close.",
    story: "A working shirt that stopped working. The placket is the only part that still knows its job.",
    type: "archive",
    condition: "good",
    fabric: "cotton oxford",
    colour: "off-white",
    price_cents: 5800,
    sizes: [{ size: "S", stock: 1 }],
    wash: "#141210",
    accent: "#e6dcc6",
    captions: ["COL. 06", "OFF-WHITE", "S"],
  },
  {
    slug: "borrowed-from-smoke",
    title: "Borrowed from Smoke",
    short_line: "Grey that was never grey on purpose.",
    story: "Smoke, wash, sun. The original colour is a rumour. Size L still fits a former life.",
    type: "archive",
    condition: "worn in",
    fabric: "cotton",
    colour: "smoke grey",
    price_cents: 5400,
    sizes: [{ size: "L", stock: 1 }],
    wash: "#151312",
    accent: "#8a8278",
    captions: ["COL. 07", "SMOKE", "L"],
  },
  {
    slug: "sleeve-of-the-empty-room",
    title: "Sleeve of the Empty Room",
    short_line: "Ink. Excellent. Cuffs that kept a desk.",
    story: "Written on, never written about. The sleeves remember a table more than a person.",
    type: "archive",
    condition: "excellent",
    fabric: "cotton",
    colour: "ink",
    price_cents: 9600,
    sizes: [{ size: "M", stock: 1 }],
    wash: "#0c1016",
    accent: "#2a3344",
    captions: ["COL. 08", "INK", "M"],
  },
  {
    slug: "brass-at-the-cuff",
    title: "Brass at the Cuff",
    short_line: "Black. Unworn. Hardware that outlasted the occasion.",
    story: "Buttons like small coins. Never spent. The night they were bought for did not happen.",
    type: "archive",
    condition: "unworn",
    fabric: "viscose-cotton",
    colour: "black",
    price_cents: 12800,
    sizes: [{ size: "L", stock: 1 }],
    wash: "#0d0b0a",
    accent: "#b08d57",
    captions: ["COL. 09", "BRASS", "L"],
  },
  {
    slug: "what-the-iron-forgot",
    title: "What the Iron Forgot",
    short_line: "Off-white. A crease the iron declined.",
    story: "Not ruined. Not pressed. The cloth kept a map of how it was put down.",
    type: "archive",
    condition: "good",
    fabric: "cotton",
    colour: "off-white",
    price_cents: 6100,
    sizes: [{ size: "XS", stock: 1 }],
    wash: "#171410",
    accent: "#d4c9b0",
    captions: ["COL. 10", "CREASE", "XS"],
  },
  {
    slug: "the-bodys-remainder",
    title: "The Body's Remainder",
    short_line: "Umber. Excellent. Cut for a larger year.",
    story: "The measurements are honest. The body that matched them has moved on.",
    type: "archive",
    condition: "excellent",
    fabric: "cotton drill",
    colour: "umber",
    price_cents: 7800,
    sizes: [{ size: "XXL", stock: 0 }],
    wash: "#16100a",
    accent: "#6b4a2a",
    captions: ["COL. 11", "UMBER", "XXL · GONE"],
  },
  {
    slug: "hand-stitched-after-rain",
    title: "Hand-Stitched After Rain",
    short_line: "One piece. Made, not found.",
    story: "Seams done by hand after a wet week. Not a replica of anything. A shirt that exists once.",
    type: "handmade",
    condition: "good",
    fabric: "linen",
    colour: "dark olive",
    price_cents: 18600,
    sizes: [{ size: "M", stock: 1 }],
    wash: "#10140e",
    accent: "#4a5a38",
    captions: ["HND. 01", "OLIVE", "M"],
  },
  {
    slug: "no-7-still-warm",
    title: "No. 7, Still Warm",
    short_line: "Rust. Worn in. A number, not a name.",
    story: "Seventh in a drawer that is now empty. The colour is the only heat left.",
    type: "archive",
    condition: "worn in",
    fabric: "cotton",
    colour: "rust",
    price_cents: 4900,
    sizes: [{ size: "S", stock: 1 }],
    wash: "#1a100c",
    accent: "#8a3a22",
    captions: ["COL. 12", "RUST", "S"],
  },
  {
    slug: "before-the-last-wear",
    title: "Before the Last Wear",
    short_line: "Ivory. Excellent. Almost ceremonial.",
    story: "Kept for something better. Something better did not arrive. The cloth is still waiting to be ordinary.",
    type: "archive",
    condition: "excellent",
    fabric: "cotton voile",
    colour: "ivory",
    price_cents: 10200,
    sizes: [
      { size: "M", stock: 1 },
      { size: "L", stock: 1 },
    ],
    wash: "#181410",
    accent: "#f3ead8",
    captions: ["COL. 13", "IVOIRE", "M / L"],
  },
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

function shirtSvg(opts: {
  wash: string;
  accent: string;
  caption: string;
  title: string;
  variant: number;
}): string {
  const { wash, accent, caption, title, variant } = opts;
  const tilt = variant === 0 ? 0 : variant === 1 ? -6 : 8;
  const ox = variant === 1 ? 48 : variant === 2 ? -30 : 0;
  const oy = variant === 2 ? 20 : 0;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" width="900" height="1200">
  <defs>
    <filter id="g" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="${12 + variant}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.55"/>
      </feComponentTransfer>
    </filter>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.15"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1200" fill="${wash}"/>
  <rect width="900" height="1200" fill="#070605" opacity="0.35"/>
  <g transform="translate(${450 + ox} ${520 + oy}) rotate(${tilt})">
    <path d="M -150 -210 L -40 -250 L 0 -170 L 40 -250 L 150 -210
             L 190 -40 L 145 20 L 145 310 L -145 310 L -145 20 L -190 -40 Z"
          fill="${accent}" fill-opacity="0.22" stroke="${accent}" stroke-opacity="0.55" stroke-width="1.4"/>
    <path d="M -40 -250 L 0 -170 L 40 -250" fill="none" stroke="${accent}" stroke-opacity="0.7" stroke-width="1.2"/>
    <line x1="0" y1="-80" x2="0" y2="280" stroke="${accent}" stroke-opacity="0.28" stroke-width="1"/>
    <circle cx="0" cy="-20" r="3.5" fill="${accent}" fill-opacity="0.7"/>
    <circle cx="0" cy="40" r="3.5" fill="${accent}" fill-opacity="0.55"/>
    <circle cx="0" cy="100" r="3.5" fill="${accent}" fill-opacity="0.4"/>
    <circle cx="0" cy="160" r="3.5" fill="${accent}" fill-opacity="0.28"/>
  </g>
  <rect width="900" height="1200" fill="url(#v)"/>
  <rect width="900" height="1200" filter="url(#g)" opacity="0.28"/>
  <rect x="36" y="36" width="828" height="1128" fill="none" stroke="#b08d57" stroke-opacity="0.35" stroke-width="1"/>
  <text x="60" y="80" fill="#b08d57" font-family="Georgia, serif" font-size="14" letter-spacing="6">${escapeXml(caption)}</text>
  <text x="60" y="1140" fill="#f3ead8" fill-opacity="0.72" font-family="Georgia, serif" font-style="italic" font-size="22">${escapeXml(title)}</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function writeSeedImages(): Map<string, string[]> {
  const dir = path.join(process.cwd(), "public", "uploads", "seed");
  fs.mkdirSync(dir, { recursive: true });
  const map = new Map<string, string[]>();
  for (const shirt of SEED) {
    if (shirt.image_paths && shirt.image_paths.length > 0) {
      map.set(shirt.slug, shirt.image_paths);
      continue;
    }
    const paths: string[] = [];
    shirt.captions.forEach((caption, i) => {
      const file = `${shirt.slug}-${i + 1}.svg`;
      const abs = path.join(dir, file);
      fs.writeFileSync(
        abs,
        shirtSvg({
          wash: shirt.wash,
          accent: shirt.accent,
          caption,
          title: shirt.title,
          variant: i,
        }),
        "utf8"
      );
      paths.push(`/uploads/seed/${file}`);
    });
    map.set(shirt.slug, paths);
  }
  return map;
}

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
  const tx = db.transaction(() => {
    for (const shirt of SEED) {
      if (exists.get(shirt.slug)) continue;
      const info = insertP.run({ ...shirt, now });
      const id = Number(info.lastInsertRowid);
      (images.get(shirt.slug) || []).forEach((p, i) => insertI.run(id, p, i));
      shirt.sizes.forEach((s) => insertS.run(id, s.size, s.stock));
    }
  });
  tx();
}
