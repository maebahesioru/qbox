// アップロード画像の配信(Next.jsビルド後に追加されたファイルはpublic経由だと404になるためAPIで配信)
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const safe = path.basename(file); // トラバーサル防止
  if (!/^[\w.-]+$/.test(safe)) {
    return new Response("Not Found", { status: 404 });
  }
  const ext = path.extname(safe).slice(1).toLowerCase();
  const type = MIME[ext];
  if (!type) return new Response("Not Found", { status: 404 });

  const p = path.join(UPLOAD_DIR, safe);
  try {
    const buf = await fs.readFile(p);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
