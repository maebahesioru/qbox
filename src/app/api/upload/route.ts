// 画像アップロード(質問/回答に添付 → OGP疑似画像用)
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { userFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ ok: false, error: "ファイルを選択してください" }, { status: 400 });
  }
  const buf = Buffer.from(await (file as File).arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "画像は8MB以内でアップロードしてください" }, { status: 400 });
  }
  const type = (file as File).type;
  if (!ALLOWED.includes(type)) {
    return NextResponse.json({ ok: false, error: "対応形式は PNG / JPEG / GIF / WebP です" }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${EXT[type]}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);

  return NextResponse.json({ ok: true, url: `/api/uploads/${filename}` });
}
