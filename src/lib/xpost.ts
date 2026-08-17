// X投稿APIクライアント(twifork Flask API を叩く)
// env: X_API_URL(例: http://127.0.0.1:8768) / X_API_TOKEN

export interface XPostResult {
  ok: boolean;
  text?: string;
  url?: string;
  error?: string;
}

const X_API_URL = process.env.X_API_URL || "";
const X_API_TOKEN = process.env.X_API_TOKEN || "";

export function xPostEnabled(): boolean {
  return X_API_URL !== "" && X_API_TOKEN !== "";
}

// text(質問/回答の投稿文)をXに投稿。URL付きならツイート内に含める。
export async function xPost(text: string): Promise<XPostResult> {
  if (!xPostEnabled()) {
    return { ok: false, error: "X連携が設定されていません" };
  }
  try {
    const res = await fetch(`${X_API_URL}/api/x/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${X_API_TOKEN}`,
      },
      body: JSON.stringify({ text }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true, text: data.text, url: data.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// サイトの絶対URL生成
export function siteUrl(path: string): string {
  const base = (process.env.SITE_URL || "http://localhost:3100").replace(/\/$/, "");
  return `${base}${path}`;
}
