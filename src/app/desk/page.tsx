"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { formatAUD } from "@/lib/money";

const EMPTY = {
  title: "",
  short_line: "",
  story: "",
  type: "archive",
  condition: "excellent",
  fabric: "",
  colour: "",
  price: "",
  sizes: [{ size: "M", stock: "1" }],
  images: [] as string[],
};

async function cropTo34(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const ratio = 3 / 4;
  let sx = 0,
    sy = 0,
    sw = bmp.width,
    sh = bmp.height;
  if (sw / sh > ratio) {
    sw = sh * ratio;
    sx = (bmp.width - sw) / 2;
  } else {
    sh = sw / ratio;
    sy = (bmp.height - sh) / 2;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, 900, 1200);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop"))), "image/jpeg", 0.86);
  });
}

export default function DeskPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [lockError, setLockError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/products");
    setProducts(await r.json());
  }, []);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.ok);
        if (d.ok) refresh();
      })
      .catch(() => setAuthed(false));
  }, [refresh]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const d = await r.json();
    if (!r.ok) {
      setLockError(d.error || "No.");
      return;
    }
    setAuthed(true);
    refresh();
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const fd = new FormData();
    const chosen = Array.from(files).slice(0, 6);
    for (const f of chosen) {
      try {
        const blob = await cropTo34(f);
        fd.append("files", blob, f.name.replace(/\.[^.]+$/, "") + ".jpg");
      } catch {
        fd.append("files", f);
      }
    }
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json();
    setBusy(false);
    if (r.ok) setForm((s) => ({ ...s, images: [...s.images, ...d.paths].slice(0, 6) }));
    else setStatus(d.error || "Photograph failed.");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const body = {
      title: form.title,
      short_line: form.short_line,
      story: form.story,
      type: form.type,
      condition: form.condition,
      fabric: form.fabric,
      colour: form.colour,
      price_cents: Math.round(Number(form.price) * 100),
      sizes: form.sizes.map((s) => ({ size: s.size.trim(), stock: Number(s.stock) || 0 })).filter((s) => s.size),
      images: form.images,
    };
    const url = editing ? `/api/products/${editing}` : "/api/products";
    const r = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setStatus(d.error || "Not kept.");
      return;
    }
    setStatus("For sale.");
    setForm(EMPTY);
    setEditing(null);
    refresh();
  }

  function load(p: Product) {
    setEditing(p.id);
    setForm({
      title: p.title,
      short_line: p.short_line,
      story: p.story,
      type: p.type,
      condition: p.condition,
      fabric: p.fabric,
      colour: p.colour,
      price: String(p.price_cents / 100),
      sizes: p.sizes.map((s) => ({ size: s.size, stock: String(s.stock) })),
      images: p.images.map((i) => i.path),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (authed === null) return <main className="desk"><p className="notice">…</p></main>;

  if (!authed) {
    return (
      <main className="desk">
        <form className="pin-gate" onSubmit={unlock}>
          <p className="section-label">Desk</p>
          <h1>The lock.</h1>
          <div className="field">
            <label htmlFor="pin">PIN</label>
            <input id="pin" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} />
          </div>
          {lockError ? <p className="error">{lockError}</p> : null}
          <button className="btn" type="submit">
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="desk">
      <p className="section-label">Seller desk</p>
      <h1 style={{ fontStyle: "italic", fontWeight: 500, fontSize: "2.4rem" }}>
        {editing ? "Amend." : "A new piece."}
      </h1>
      <form onSubmit={save} style={{ display: "grid", gap: "0.7rem" }}>
        <div className="field">
          <label>Photographs · 1–6 · 3:4</label>
          <input type="file" accept="image/*" multiple capture="environment" onChange={(e) => onFiles(e.target.files)} />
        </div>
        <div className="previews">
          {form.images.map((src) => (
            <div className="frame" key={src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </div>
          ))}
        </div>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="short_line">Short line</label>
          <input id="short_line" value={form.short_line} onChange={(e) => setForm({ ...form, short_line: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="story">About this piece</label>
          <textarea id="story" value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="archive">Archive</option>
            <option value="handmade">Handmade</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="condition">Condition</label>
          <select id="condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            <option value="unworn">Unworn</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="worn in">Worn in</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="fabric">Fabric</label>
          <input id="fabric" value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="colour">Colour</label>
          <input id="colour" value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="price">Price AUD</label>
          <input id="price" inputMode="decimal" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <p className="section-label">Sizes · stock</p>
        {form.sizes.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.4rem" }}>
            <input
              placeholder="Size"
              value={s.size}
              onChange={(e) => {
                const sizes = [...form.sizes];
                sizes[i] = { ...s, size: e.target.value };
                setForm({ ...form, sizes });
              }}
            />
            <input
              inputMode="numeric"
              placeholder="Stock"
              value={s.stock}
              onChange={(e) => {
                const sizes = [...form.sizes];
                sizes[i] = { ...s, stock: e.target.value };
                setForm({ ...form, sizes });
              }}
            />
            <button
              className="btn ghost"
              type="button"
              onClick={() => setForm({ ...form, sizes: form.sizes.filter((_, j) => j !== i) })}
            >
              ×
            </button>
          </div>
        ))}
        <button className="btn ghost" type="button" onClick={() => setForm({ ...form, sizes: [...form.sizes, { size: "", stock: "1" }] })}>
          Add size
        </button>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Keeping…" : "Save · for sale"}
        </button>
        {editing ? (
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(EMPTY);
            }}
          >
            Cancel amend
          </button>
        ) : null}
        {status ? <p className="notice">{status}</p> : null}
      </form>

      <div className="desk-list">
        <p className="section-label">In the archive</p>
        {products.map((p) => (
          <article className="desk-item" key={p.id}>
            {p.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0].path} alt="" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
            ) : (
              <div />
            )}
            <div>
              <h2 style={{ fontStyle: "italic", margin: 0, fontWeight: 500 }}>{p.title}</h2>
              <p className="price">
                {formatAUD(p.price_cents)} · {p.sizes.map((s) => `${s.size}:${s.stock}`).join(" ")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                <button className="btn ghost" type="button" onClick={() => load(p)}>
                  Edit
                </button>
                <button
                  className="btn danger"
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/products/${p.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ markSold: true }),
                    });
                    refresh();
                  }}
                >
                  Mark sold
                </button>
                <button
                  className="btn danger"
                  type="button"
                  onClick={async () => {
                    if (!confirm("Delete this piece?")) return;
                    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
                    refresh();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
