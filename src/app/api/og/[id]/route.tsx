// OGP画像生成API: 質問の本文(テキスト)をそのまま画像化して返す
// XでURLを貼ると、この画像がカードとして表示される(実質画像の貼り付け)
import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";
import { getQuestion } from "@/lib/data";
import { getUsers } from "@/lib/auth";
import { QUESTION_TYPE_LABEL } from "@/lib/const";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 日本語フォント(モジュールスコープで一度だけ読む・静的Regular/Bold)
const fontRegular = readFileSync(path.join(process.cwd(), "assets", "fonts", "NotoSansJP-Regular.ttf"));
const fontBold = readFileSync(path.join(process.cwd(), "assets", "fonts", "NotoSansJP-Bold.ttf"));

const MAX_BODY = 160; // 本文の画像内最大文字数

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = await getQuestion(id);
  if (!q) return new Response("Not Found", { status: 404 });
  if (![...q.title, q.body].join("").trim()) return new Response("Empty", { status: 404 });

  const users = await getUsers();
  let asker = "匿名";
  if (q.fromAccount && users[q.fromAccount]) asker = users[q.fromAccount].displayName;
  else if (q.fromName) asker = q.fromName;

  const body = q.body.length > MAX_BODY ? q.body.slice(0, MAX_BODY) + "…" : q.body;
  const typeLabel = QUESTION_TYPE_LABEL[q.type];
  const isSolved = q.status === "closed";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0a0c 0%, #101418 60%, #0c1116 100%)",
          color: "#ededed",
          fontFamily: "NotoSansJP",
          padding: "56px 64px",
        }}
      >
        {/* ヘッダー: ロゴ + タイプバッジ */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: 36 }}>📮</span>
          <span style={{ fontSize: 34, fontWeight: 700, color: "#1d9bf0", letterSpacing: 2 }}>QBOX</span>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              background: "rgba(29,155,240,0.15)",
              color: typeLabel === "全体質問" ? "#1d9bf0" : typeLabel === "複数人質問" ? "#c084fc" : "#4ade80",
              borderRadius: 999,
              padding: "8px 22px",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {typeLabel}
          </div>
          {isSolved && (
            <div style={{ display: "flex", background: "rgba(255,212,0,0.15)", color: "#ffd400", borderRadius: 999, padding: "8px 22px", fontSize: 26, fontWeight: 700 }}>
              解決済み ✓
            </div>
          )}
        </div>

        {/* 本文(実質画像のメイン) */}
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
            {q.title && (
              <div style={{ display: "flex", fontSize: 52, fontWeight: 700, lineHeight: 1.3, color: "#ffffff" }}>
                {q.title}
              </div>
            )}
            <div style={{ display: "flex", fontSize: 40, lineHeight: 1.55, color: "#d6dde3", whiteSpace: "pre-wrap" }}>
              {body}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div style={{ display: "flex", alignItems: "center", borderTop: "2px solid rgba(255,255,255,0.08)", paddingTop: "28px" }}>
          <span style={{ fontSize: 28, color: "#8b98a5" }}>この質問に回答する →</span>
          <span style={{ display: "flex", marginLeft: "auto", fontSize: 28, color: "#8b98a5" }}>
            質問者: <span style={{ color: "#ffffff", fontWeight: 700, marginLeft: 6 }}>{asker}</span>
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "NotoSansJP", data: fontRegular, weight: 400 },
        { name: "NotoSansJP", data: fontBold, weight: 700 },
      ],
    },
  );
}
