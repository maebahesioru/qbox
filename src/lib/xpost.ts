// Xシェア用ヘルパー
// X投稿はbot自動投稿でなく「各自が自分のXアカウントでURLを貼る」方式。
// intent/tweet にテキスト+URLを渡したリンクを生成し、回答者/質問者が自分のアカウントで投稿する。

// サイトの絶対URL生成
export function siteUrl(path: string): string {
  const base = (process.env.SITE_URL || "http://localhost:3100").replace(/\/$/, "");
  return `${base}${path}`;
}

// Xシェア用のintentリンク生成(intent/tweetはURLを自動展開→OGP画像も表示される)
export function xShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    text: text.slice(0, 280),
    url,
  });
  return `https://x.com/intent/tweet?${params.toString()}`;
}

// 質問シェア用テキスト
export function questionShareText(q: { title: string; body: string }): string {
  const t = q.title ? `【質問】${q.title}` : "【質問】";
  return `${t}\n${q.body.slice(0, 200)}`;
}

// 回答(知恵アンサー)シェア用テキスト
export function answerShareText(a: { body: string }): string {
  return `【回答】\n${a.body.slice(0, 220)}`;
}
