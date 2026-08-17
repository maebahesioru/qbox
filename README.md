# QBOX - Xの質問箱サービス

Xで質問を集めるQ&Aサービス（マシュマロ/Peing + Yahoo知恵袋風）。

## 機能

- **アカウント**: Mullvad方式。16桁の番号がそのままID兼パスワード（メール/パスワード不要）
- **質問タイプ**
  - 個別質問（direct）: 特定の1人に質問
  - 複数人質問（multi）: 複数人に同じ質問、それぞれ回答
  - 全体質問（all）: 全員への質問（ホームのフィード）
- **Q&A（知恵袋風）**: 複数人が回答し、質問者が満足したら**ベストアンサー**を選んで解決・終了
- **X連携**: 質問/回答をXに投稿する「知恵アンサー」機能（twifork bot API）
- **OGP疑似画像**: 画像付き質問/回答は、Xでリンクを貼るとOGP画像がプレビュー表示される

## 技術スタック

- Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / pnpm
- JSONファイルストア（`data/*.json`、DB不要）
- X投稿は別プロセス（`qbox-xbot`）の Flask + twifork API を呼ぶ

## 環境変数

- `SITE_URL`: サイトの絶対URL（OGP生成用。本番は `https://...`）
- `X_API_URL`: X投稿bot APIのURL（例 `http://127.0.0.1:8768`）
- `X_API_TOKEN`: X投稿bot APIのトークン（未設定ならX投稿は無効）

## 開発

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start -p 3100
```

## デプロイ

- Coolify の `data/` ディレクトリは永続化ボリュームにマウント（アカウント・質問・画像が消えないように）
- X投稿bot（`qbox-xbot/`）も別コンテナで稼働させ、`X_API_URL`/`X_API_TOKEN` をサイト側に設定
