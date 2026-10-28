import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function uploadsRoot(): string {
  const data = process.env.DATA_DIR || path.join(process.cwd(), "data");
  return path.join(data, "uploads");
}

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  if (!parts?.length) return NextResponse.json({ error: "Missing." }, { status: 404 });
  if (parts.some((p) => p.includes("..") || p.includes("\0") || p.startsWith("/"))) {
    return NextResponse.json({ error: "Bad path." }, { status: 400 });
  }
  const file = path.join(uploadsRoot(), ...parts);
  const root = path.resolve(uploadsRoot());
  const resolved = path.resolve(file);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    return NextResponse.json({ error: "Bad path." }, { status: 400 });
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return NextResponse.json({ error: "Gone." }, { status: 404 });
  }
  const ext = path.extname(resolved).slice(1).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const buf = fs.readFileSync(resolved);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
