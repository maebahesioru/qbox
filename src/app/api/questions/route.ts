// 質問の作成・一覧取得
// 質問はログイン不要・匿名で投稿できる(質問箱の本質)
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUsers, userFromRequest, resolvePublicUserId } from "@/lib/auth";
import { genId, getQuestions, saveQuestions, Question, QuestionType } from "@/lib/data";

export const dynamic = "force-dynamic";

// 質問一覧
// ?type=direct|multi|all&to=<公開ID or 番号>&mine=true(ログイン中・自分の質問)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type");
  const to = sp.get("to");
  const mine = sp.get("mine") === "true";

  let qs = await getQuestions();
  if (type) qs = qs.filter((q) => q.type === type);
  if (to) {
    const users = await getUsers();
    const resolved = resolvePublicUserId(to, users);
    if (resolved) qs = qs.filter((q) => q.toUserIds.includes(resolved));
  }
  if (mine) {
    const me = await userFromRequest(req.headers.get("authorization"));
    if (!me) return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });
    qs = qs.filter((q) => q.fromAccount === me.accountNumber || q.toUserIds.includes(me.accountNumber));
  }
  qs = [...qs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ ok: true, questions: qs });
}

// 質問作成(未ログイン可・匿名)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type = body.type as QuestionType;
  if (!["direct", "multi", "all"].includes(type)) {
    return NextResponse.json({ ok: false, error: "質問タイプが不正です" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const text = String(body.body || "").trim();
  const fromName = String(body.fromName || "").trim().slice(0, 30);
  if (!text) {
    return NextResponse.json({ ok: false, error: "質問内容を入力してください" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ ok: false, error: "質問は2000文字以内で入力してください" }, { status: 400 });
  }
  if (title.length > 100) {
    return NextResponse.json({ ok: false, error: "タイトルは100文字以内で入力してください" }, { status: 400 });
  }

  const users = await getUsers();
  let toUserIds: string[] = [];
  if (type === "direct" || type === "multi") {
    const raw = Array.isArray(body.toUserIds) ? body.toUserIds : [body.toUserIds].filter(Boolean);
    // 公開ID(u_xxx) or 生番号(質問箱URL由来) を生番号に解決
    toUserIds = raw
      .map((x: unknown) => String(x))
      .map((id: string) => resolvePublicUserId(id, users) || "")
      .filter((id: string) => id && users[id]);
    if (toUserIds.length === 0) {
      return NextResponse.json({ ok: false, error: type === "direct" ? "質問先のユーザーを指定してください" : "質問先のユーザーを1人以上指定してください" }, { status: 400 });
    }
    if (type === "direct" && toUserIds.length > 1) {
      toUserIds = [toUserIds[0]];
    }
  }

  // ログイン済みならアカウント紐付け(未ログインはnull=完全匿名)
  const me = await userFromRequest(req.headers.get("authorization"));

  const image = body.image && typeof body.image === "string" ? String(body.image).slice(0, 500) : null;
  const now = new Date().toISOString();
  const q: Question = {
    id: genId("q"),
    type,
    toUserIds,
    fromAccount: me ? me.accountNumber : null,
    fromName,
    editToken: randomBytes(16).toString("hex"),
    title,
    body: text,
    image,
    xUrl: null,
    status: "open",
    bestAnswerId: null,
    createdAt: now,
    updatedAt: now,
  };

  const qs = await getQuestions();
  qs.push(q);
  await saveQuestions(qs);

  // 編集トークンはレスポンスでのみ返す(ブラウザのlocalStorageに保存・再取得不可)
  return NextResponse.json({
    ok: true,
    question: { ...q, editToken: undefined },
    editToken: q.editToken,
  }, { status: 201 });
}
