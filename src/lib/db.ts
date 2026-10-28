import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { seedIfEmpty } from "./seed";
import type { ArchiveFilters, Order, OrderItem, OrderWithItems, Product } from "./types";
import { priceBucket } from "./money";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "cartaholics.db");

let instance: Database.Database | null = null;

function schema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      short_line TEXT NOT NULL DEFAULT '',
      story TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'archive',
      condition TEXT NOT NULL DEFAULT 'good',
      fabric TEXT NOT NULL DEFAULT '',
      colour TEXT NOT NULL DEFAULT '',
      price_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      path TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS product_sizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      size TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      fulfilment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'placed',
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL,
      street TEXT,
      suburb TEXT,
      state TEXT,
      postcode TEXT,
      country TEXT,
      shipping_cents INTEGER NOT NULL DEFAULT 0,
      subtotal_cents INTEGER NOT NULL,
      total_cents INTEGER NOT NULL,
      paypal_id TEXT,
      rehearsal INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      size TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      size TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function getDb(): Database.Database {
  if (instance) return instance;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  schema(db);
  seedIfEmpty(db);
  instance = db;
  return db;
}

function hydrate(row: Omit<Product, "images" | "sizes">): Product {
  const db = getDb();
  const images = db
    .prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort, id")
    .all(row.id) as Product["images"];
  const sizes = db
    .prepare("SELECT * FROM product_sizes WHERE product_id = ? ORDER BY id")
    .all(row.id) as Product["sizes"];
  return { ...row, images, sizes };
}

export function inStock(p: Product): boolean {
  return p.sizes.some((s) => s.stock > 0);
}

export function listProducts(filters: ArchiveFilters = {}): Product[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM products ORDER BY created_at DESC, id DESC")
    .all() as Omit<Product, "images" | "sizes">[];
  let products = rows.map(hydrate);

  if (filters.size) {
    const size = filters.size;
    products = products.filter((p) => p.sizes.some((s) => s.size === size));
  }
  if (filters.condition) {
    products = products.filter((p) => p.condition === filters.condition);
  }
  if (filters.type) {
    products = products.filter((p) => p.type === filters.type);
  }
  if (filters.availability === "in-stock") {
    products = products.filter(inStock);
  } else if (filters.availability === "sold-out") {
    products = products.filter((p) => !inStock(p));
  }
  if (filters.price) {
    products = products.filter((p) => priceBucket(p.price_cents) === filters.price);
  }
  return products;
}

export function featuredProducts(limit = 4): Product[] {
  // Include soft / sold-out pieces so waitlist listings still appear on home
  return listProducts().slice(0, limit);
}

export function getProduct(id: number): Product | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | Omit<Product, "images" | "sizes">
    | undefined;
  return row ? hydrate(row) : null;
}

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "piece";
  const db = getDb();
  let slug = base;
  let n = 2;
  while (db.prepare("SELECT id FROM products WHERE slug = ?").get(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export type ProductInput = {
  title: string;
  short_line: string;
  story: string;
  type: string;
  condition: string;
  fabric: string;
  colour: string;
  price_cents: number;
  sizes: { size: string; stock: number }[];
  images: string[];
};

export function createProduct(input: ProductInput): Product {
  const db = getDb();
  const now = new Date().toISOString();
  const slug = slugify(input.title);
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO products (slug, title, short_line, story, type, condition, fabric, colour, price_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        slug,
        input.title,
        input.short_line,
        input.story,
        input.type,
        input.condition,
        input.fabric,
        input.colour,
        input.price_cents,
        now,
        now
      );
    const id = Number(info.lastInsertRowid);
    const insI = db.prepare("INSERT INTO product_images (product_id, path, sort) VALUES (?, ?, ?)");
    input.images.forEach((p, i) => insI.run(id, p, i));
    const insS = db.prepare("INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)");
    input.sizes.forEach((s) => insS.run(id, s.size, s.stock));
    return id;
  });
  const id = tx();
  return getProduct(id)!;
}

export function updateProduct(id: number, input: ProductInput): Product | null {
  const db = getDb();
  const existing = getProduct(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE products SET title=?, short_line=?, story=?, type=?, condition=?, fabric=?, colour=?, price_cents=?, updated_at=? WHERE id=?`
    ).run(
      input.title,
      input.short_line,
      input.story,
      input.type,
      input.condition,
      input.fabric,
      input.colour,
      input.price_cents,
      now,
      id
    );
    db.prepare("DELETE FROM product_images WHERE product_id = ?").run(id);
    const insI = db.prepare("INSERT INTO product_images (product_id, path, sort) VALUES (?, ?, ?)");
    input.images.forEach((p, i) => insI.run(id, p, i));
    db.prepare("DELETE FROM product_sizes WHERE product_id = ?").run(id);
    const insS = db.prepare("INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)");
    input.sizes.forEach((s) => insS.run(id, s.size, s.stock));
  });
  tx();
  return getProduct(id);
}

export function markSold(id: number): Product | null {
  const db = getDb();
  if (!getProduct(id)) return null;
  db.prepare("UPDATE product_sizes SET stock = 0 WHERE product_id = ?").run(id);
  db.prepare("UPDATE products SET updated_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  return getProduct(id);
}

export function deleteProduct(id: number): boolean {
  const db = getDb();
  const p = getProduct(id);
  if (!p) return false;
  for (const img of p.images) {
    if (img.path.startsWith("/uploads/") && !img.path.includes("/seed/")) {
      const abs = path.join(process.cwd(), "public", img.path);
      try {
        fs.unlinkSync(abs);
      } catch {
        /* ignore */
      }
    }
  }
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return true;
}

export type OrderInput = {
  fulfilment: "pickup" | "ship";
  customer_name: string;
  phone: string;
  email: string;
  street?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
  shipping_cents: number;
  paypal_id?: string | null;
  rehearsal: boolean;
  items: { product_id: number; size: string; qty: number }[];
};

export function createOrder(input: OrderInput): OrderWithItems {
  const db = getDb();
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    let subtotal = 0;
    const resolved: { product_id: number; title: string; size: string; qty: number; price_cents: number }[] = [];
    for (const item of input.items) {
      const product = getProduct(item.product_id);
      if (!product) throw new Error("A piece is no longer in the archive.");
      const sizeRow = product.sizes.find((s) => s.size === item.size);
      if (!sizeRow) throw new Error(`Size ${item.size} is not cut for this piece.`);
      if (sizeRow.stock < item.qty) throw new Error(`${product.title} in ${item.size} is gone.`);
      subtotal += product.price_cents * item.qty;
      resolved.push({
        product_id: product.id,
        title: product.title,
        size: item.size,
        qty: item.qty,
        price_cents: product.price_cents,
      });
    }
    const total = subtotal + input.shipping_cents;
    const info = db
      .prepare(
        `INSERT INTO orders (created_at, fulfilment, status, customer_name, phone, email, street, suburb, state, postcode, country, shipping_cents, subtotal_cents, total_cents, paypal_id, rehearsal)
         VALUES (?, ?, 'placed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        now,
        input.fulfilment,
        input.customer_name,
        input.phone,
        input.email,
        input.street || null,
        input.suburb || null,
        input.state || null,
        input.postcode || null,
        input.country || null,
        input.shipping_cents,
        subtotal,
        total,
        input.paypal_id || null,
        input.rehearsal ? 1 : 0
      );
    const orderId = Number(info.lastInsertRowid);
    const ins = db.prepare(
      "INSERT INTO order_items (order_id, product_id, title, size, qty, price_cents) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const dec = db.prepare(
      "UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND size = ?"
    );
    for (const r of resolved) {
      ins.run(orderId, r.product_id, r.title, r.size, r.qty, r.price_cents);
      dec.run(r.qty, r.product_id, r.size);
    }
    return orderId;
  });
  const id = tx();
  return getOrder(id)!;
}

export function getOrder(id: number): OrderWithItems | null {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Order | undefined;
  if (!order) return null;
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as OrderItem[];
  return { ...order, items };
}

export function listOrders(): OrderWithItems[] {
  const db = getDb();
  const orders = db.prepare("SELECT * FROM orders ORDER BY id DESC").all() as Order[];
  return orders.map((o) => {
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(o.id) as OrderItem[];
    return { ...o, items };
  });
}

export function addWaitlist(product_id: number, size: string, name: string, email: string) {
  const db = getDb();
  db.prepare(
    "INSERT INTO waitlist (product_id, size, name, email, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(product_id, size, name, email, new Date().toISOString());
}

export function listWaitlist(product_id?: number) {
  const db = getDb();
  if (product_id) {
    return db.prepare("SELECT * FROM waitlist WHERE product_id = ? ORDER BY id DESC").all(product_id);
  }
  return db.prepare("SELECT * FROM waitlist ORDER BY id DESC").all();
}
