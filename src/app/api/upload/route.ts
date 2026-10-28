import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isDeskAuthed } from "@/lib/auth";

export const runtime = "nodejs";

function uploadsRoot(): string {
  const data = process.env.DATA_DIR || path.join(process.cwd(), "data");
  return path.join(data, "uploads");
}

export async function POST(req: Request) {
  if (!(await isDeskAuthed())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No photographs." }, { status: 400 });
  }
  if (files.length > 6) {
    return NextResponse.json({ error: "Six photographs at most." }, { status: 400 });
  }
  const dir = uploadsRoot();
  fs.mkdirSync(dir, { recursive: true });
  const paths: string[] = [];
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeExt = ["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext) ? ext : "jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    fs.writeFileSync(path.join(dir, name), buf);
    paths.push(`/api/media/${name}`);
  }
  return NextResponse.json({ paths });
}
