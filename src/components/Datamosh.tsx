"use client";

import { useEffect, useRef } from "react";

const VOID = "#070605";
const IVORY = "#f3ead8";
const BRASS = "#b08d57";
const OXBLOOD = "#7a1f28";

type Mode = "enter" | "nav";

type Run = { abort: () => void };

function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  return c;
}

function sizeOf(): { w: number; h: number; sx: number; sy: number } {
  const vw = Math.max(1, window.innerWidth);
  const vh = Math.max(1, window.innerHeight);
  const crush = 0.48;
  const w = Math.max(160, Math.floor(vw * crush));
  const h = Math.max(160, Math.floor(vh * crush));
  return { w, h, sx: w / vw, sy: h / vh };
}

function fillNoise(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const tile = 96;
  const id = ctx.createImageData(tile, tile);
  const d = id.data;
  let s = seed + 1;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < d.length; i += 4) {
    const n = rnd();
    const v = n > 0.92 ? 210 : n * 48;
    d[i] = v;
    d[i + 1] = v * 0.88;
    d[i + 2] = v * 0.62;
    d[i + 3] = 255;
  }
  const tmp = makeCanvas();
  tmp.width = tile;
  tmp.height = tile;
  const tctx = tmp.getContext("2d");
  if (!tctx) return;
  tctx.putImageData(id, 0, 0);
  const pat = ctx.createPattern(tmp, "repeat");
  if (!pat) return;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Draw product / gallery images with object-fit: contain into the capture. */
function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh || dw < 1 || dh < 1) return;
  const scale = Math.min(dw / nw, dh / nh);
  const tw = nw * scale;
  const th = nh * scale;
  const ox = dx + (dw - tw) / 2;
  const oy = dy + (dh - th) / 2;
  ctx.drawImage(img, ox, oy, tw, th);
}

function capture(dst: HTMLCanvasElement, w: number, h: number, sx: number, sy: number) {
  const ctx = dst.getContext("2d", { alpha: false });
  if (!ctx) return;
  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, w, h);

  // Prefer product frames so shirt ground + tee land in the capture.
  const frames = document.querySelectorAll(".card .frame, .gallery .frame");
  if (frames.length) {
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!(frame instanceof HTMLElement)) continue;
      const r = frame.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) continue;
      if (r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth) {
        continue;
      }
      const cs = getComputedStyle(frame);
      ctx.fillStyle = cs.backgroundColor || "#c4b6a0";
      ctx.fillRect(r.left * sx, r.top * sy, r.width * sx, r.height * sy);
      const img = frame.querySelector("img");
      if (img instanceof HTMLImageElement && img.naturalWidth) {
        const ir = img.getBoundingClientRect();
        try {
          drawContainedImage(
            ctx,
            img,
            ir.left * sx,
            ir.top * sy,
            ir.width * sx,
            ir.height * sy
          );
        } catch {
          ctx.fillStyle = "#1a1210";
          ctx.fillRect(ir.left * sx, ir.top * sy, ir.width * sx, ir.height * sy);
        }
      }
    }
  } else {
    const imgs = document.querySelectorAll("img");
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      if (!(img instanceof HTMLImageElement) || !img.naturalWidth) continue;
      const r = img.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) continue;
      if (r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth) {
        continue;
      }
      try {
        drawContainedImage(ctx, img, r.left * sx, r.top * sy, r.width * sx, r.height * sy);
      } catch {
        ctx.fillStyle = "#1a1210";
        ctx.fillRect(r.left * sx, r.top * sy, r.width * sx, r.height * sy);
      }
    }
  }

  ctx.save();
  const blocks = document.querySelectorAll("h1, h2, .wordmark, .card-title, .hero-kicker");
  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i];
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = i % 3 === 0 ? BRASS : IVORY;
    ctx.fillRect(r.left * sx, r.top * sy, r.width * sx, Math.max(2, r.height * sy * 0.72));
  }
  ctx.restore();
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function mosh(
  ctx: CanvasRenderingContext2D,
  live: HTMLCanvasElement,
  clean: HTMLCanvasElement,
  trail: HTMLCanvasElement,
  crush: HTMLCanvasElement,
  w: number,
  h: number,
  intensity: number,
  t: number,
  mode: Mode
) {
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;

  if (mode === "enter") {
    // Heavy noise → shirt emerges through crush → resolve.
    const reveal = easeOutCubic(Math.min(1, t / 0.55));
    fillNoise(ctx, w, h, ((t * 140) | 0) + 3);
    // Pixel-crush the clean frame harder early, softer later.
    const crushAmt = Math.max(0.04, 0.06 + (1 - reveal) * 0.72);
    const cw = Math.max(8, Math.floor(w * crushAmt));
    const ch = Math.max(8, Math.floor(h * crushAmt));
    crush.width = cw;
    crush.height = ch;
    const cctx = crush.getContext("2d", { alpha: false });
    if (cctx) {
      cctx.imageSmoothingEnabled = false;
      cctx.drawImage(clean, 0, 0, cw, ch);
      ctx.globalAlpha = 0.18 + reveal * 0.82;
      ctx.drawImage(crush, 0, 0, cw, ch, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    // Soft full-res shirt fade in the last third so it doesn't pop late.
    if (t > 0.42) {
      const soft = easeOutCubic(Math.min(1, (t - 0.42) / 0.58));
      ctx.globalAlpha = soft * 0.55;
      ctx.drawImage(clean, 0, 0);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.drawImage(clean, 0, 0);
    const crushAmt = Math.max(0.08, 0.1 + (1 - intensity) * 0.55);
    const cw = Math.max(12, Math.floor(w * crushAmt));
    const ch = Math.max(12, Math.floor(h * crushAmt));
    crush.width = cw;
    crush.height = ch;
    const cctx = crush.getContext("2d", { alpha: false });
    if (cctx) {
      cctx.imageSmoothingEnabled = false;
      cctx.drawImage(live, 0, 0, cw, ch);
      ctx.drawImage(crush, 0, 0, cw, ch, 0, 0, w, h);
    }
  }

  const strips = 7 + Math.floor(18 * intensity);
  for (let i = 0; i < strips; i++) {
    const y = Math.random() * h;
    const hh = 2 + Math.random() * (8 + 46 * intensity);
    const dx = (Math.random() - 0.5) * (30 + 110 * intensity);
    const src = Math.random() > 0.42 ? trail : live;
    try {
      ctx.drawImage(src, 0, y, w, hh, dx, y + (Math.random() - 0.5) * 6 * intensity, w, hh);
    } catch {
      /* ignore */
    }
  }

  const block = Math.max(6, Math.floor(8 + Math.random() * (10 + 28 * intensity)));
  const blocks = Math.floor(8 + 22 * intensity);
  for (let i = 0; i < blocks; i++) {
    const sx = Math.floor(Math.random() * w);
    const sy = Math.floor(Math.random() * h);
    const dx = sx + Math.floor((Math.random() - 0.5) * 90 * intensity);
    const dy = sy + Math.floor((Math.random() - 0.4) * 24 * intensity);
    const bw = block * (Math.random() > 0.7 ? 2 : 1);
    try {
      ctx.drawImage(clean, sx, sy, bw, block, dx, dy, bw, block);
    } catch {
      /* ignore */
    }
  }

  const tears = 2 + Math.floor(5 * intensity);
  for (let i = 0; i < tears; i++) {
    const x = Math.random() * w;
    const tw = 3 + Math.random() * (8 + 36 * intensity);
    const dy = (Math.random() - 0.5) * 28 * intensity;
    try {
      ctx.drawImage(live, x, 0, tw, h, x + (Math.random() - 0.5) * 16, dy, tw, h);
    } catch {
      /* ignore */
    }
  }

  const ox = (8 + 22 * intensity) * (Math.random() > 0.5 ? 1 : -1);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.22 + 0.38 * intensity;
  ctx.drawImage(clean, ox, 0);
  ctx.fillStyle = `rgba(180, 30, 40, ${0.12 + 0.22 * intensity})`;
  ctx.fillRect(ox, 0, w, h);
  ctx.globalAlpha = 0.18 + 0.28 * intensity;
  ctx.drawImage(clean, -ox * 0.7, intensity * 3);
  ctx.fillStyle = `rgba(40, 120, 140, ${0.08 + 0.16 * intensity})`;
  ctx.fillRect(-ox, 0, w, h);
  ctx.restore();

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  if (Math.random() < 0.55 * intensity) {
    ctx.fillStyle = Math.random() > 0.45 ? OXBLOOD : BRASS;
    ctx.globalAlpha = 0.28 + Math.random() * 0.35;
    ctx.fillRect(Math.random() * w, Math.random() * h, 6 + Math.random() * 90, 1 + Math.random() * 14);
    ctx.globalAlpha = 1;
  }
  if (Math.random() < 0.3 * intensity) {
    ctx.fillStyle = IVORY;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 3);
    ctx.globalAlpha = 1;
  }

  const tctx = trail.getContext("2d", { alpha: false });
  if (tctx) {
    tctx.imageSmoothingEnabled = false;
    tctx.globalAlpha = 1;
    tctx.drawImage(live, 0, 0);
  }
}

function waitForProductImages(timeoutMs = 1400): Promise<void> {
  const nodes = Array.from(
    document.querySelectorAll<HTMLImageElement>(".card img, .gallery img, main img")
  );
  if (!nodes.length) return Promise.resolve();
  const pending = nodes.filter((img) => !img.complete || !img.naturalWidth);
  if (!pending.length) return Promise.resolve();

  return new Promise((resolve) => {
    const seen = new Set<HTMLImageElement>();
    let settled = false;
    const finishOne = (img: HTMLImageElement) => {
      if (settled || seen.has(img)) return;
      seen.add(img);
      if (seen.size >= pending.length) {
        settled = true;
        window.clearTimeout(timer);
        resolve();
      }
    };
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve();
    }, timeoutMs);
    for (const img of pending) {
      const onLoad = () => finishOne(img);
      img.addEventListener("load", onLoad, { once: true });
      img.addEventListener("error", onLoad, { once: true });
      if (typeof img.decode === "function") {
        img.decode().then(() => finishOne(img)).catch(() => finishOne(img));
      }
    }
  });
}

function play(canvas: HTMLCanvasElement, mode: Mode): Run {
  let alive = true;
  let raf = 0;
  const { w, h, sx, sy } = sizeOf();
  canvas.width = w;
  canvas.height = h;
  canvas.classList.add("on");
  document.documentElement.classList.add("is-moshing");

  const liveCtx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });
  const clean = makeCanvas();
  clean.width = w;
  clean.height = h;
  const trail = makeCanvas();
  trail.width = w;
  trail.height = h;
  const crush = makeCanvas();

  if (!liveCtx) {
    canvas.classList.remove("on");
    document.documentElement.classList.remove("is-moshing");
    return { abort() {} };
  }

  capture(clean, w, h, sx, sy);
  const t0 = trail.getContext("2d", { alpha: false });
  t0?.drawImage(clean, 0, 0);

  if (mode === "enter") {
    fillNoise(liveCtx, w, h, 3);
  } else {
    liveCtx.drawImage(clean, 0, 0);
  }

  const dur =
    mode === "enter" ? 780 + Math.random() * 320 : 360 + Math.random() * 220;
  const t0ms = performance.now();

  const tick = (now: number) => {
    if (!alive) return;
    const t = Math.min(1, (now - t0ms) / dur);
    const intensity =
      mode === "enter"
        ? t < 0.22
          ? 1
          : t < 0.68
            ? 0.78
            : Math.max(0, 1 - (t - 0.68) / 0.32)
        : Math.max(0.12, 1 - t * 0.92);
    mosh(liveCtx, canvas, clean, trail, crush, w, h, intensity, t, mode);
    if (t >= 1) {
      alive = false;
      canvas.classList.remove("on");
      document.documentElement.classList.remove("is-moshing");
      liveCtx.clearRect(0, 0, w, h);
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    abort() {
      alive = false;
      cancelAnimationFrame(raf);
      canvas.classList.remove("on");
      document.documentElement.classList.remove("is-moshing");
    },
  };
}

function isInternalNav(a: HTMLAnchorElement): boolean {
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  const raw = a.getAttribute("href");
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return false;
  let url: URL;
  try {
    url = new URL(raw, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  if (url.pathname.startsWith("/order/")) return false;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
  return true;
}

export function Datamosh() {
  const ref = useRef<HTMLCanvasElement>(null);
  const run = useRef<Run | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    if (reducedMotion()) {
      canvas.classList.remove("on");
      return;
    }

    let cancelled = false;
    const path = window.location.pathname;
    if (!path.startsWith("/order/") && !path.startsWith("/dispatch")) {
      // Wait for shirt imgs so enter capture includes the tee, not void.
      waitForProductImages().then(() => {
        if (cancelled || !ref.current) return;
        run.current?.abort();
        run.current = play(ref.current, "enter");
      });
    }

    const onClick = (e: MouseEvent) => {
      if (reducedMotion()) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target;
      if (!(el instanceof Element)) return;
      const a = el.closest("a");
      if (!(a instanceof HTMLAnchorElement) || !isInternalNav(a)) return;
      run.current?.abort();
      run.current = play(canvas, "nav");
    };

    document.addEventListener("click", onClick, true);
    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick, true);
      run.current?.abort();
      run.current = null;
    };
  }, []);

  return <canvas ref={ref} className="mosh" aria-hidden="true" />;
}
