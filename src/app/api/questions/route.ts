// 質問の作成・一覧取得
import { NextRequest, NextResponse } from "next/server";
import { getUsers, userFromRequest } from "@/lib/auth";
import { genId, getQuestions, saveQuestions, Question, QuestionType } from "@/lib/data";
import { xPost, siteUrl } from "@/lib/xpost";

export const dynamic = "force-dynamic";

// 質問一覧
// ?type=direct|multi|all&to=<accountNumber>&mine=true
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type");
  const to = sp.get("to");
  const mine = sp.get("mine") === "true";
  const auth = req.headers.get("authorization");
  const me = await userFromRequest(auth);

  let qs = await getQuestions();
  if (type) qs = qs.filter((q) => q.type === type);
  if (to) qs = qs.filter((q) => q.toUserIds.includes(to));
  if (mine) {
    if (!me) return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });
    qs = qs.filter((q) => q.fromAccount === me.accountNumber || q.toUserIds.includes(me.accountNumber));
  }
  qs = [...qs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ ok: true, questions: qs });
}

// 質問作成
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const me = await userFromRequest(auth);
  if (!me) return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = body.type as QuestionType;
  if (!["direct", "multi", "all"].includes(type)) {
    return NextResponse.json({ ok: false, error: "質問タイプが不正です" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const text = String(body.body || "").trim();
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
    toUserIds = raw.map((x: unknown) => String(x)).filter((id: string) => users[id]);
    if (toUserIds.length === 0) {
      return NextResponse.json({ ok: false, error: type === "direct" ? "質問先のユーザーを指定してください" : "質問先のユーザーを1人以上指定してください" }, { status: 400 });
    }
    if (type === "direct" && toUserIds.length > 1) {
      toUserIds = [toUserIds[0]];
    }
  }

  const image = body.image && typeof body.image === "string" ? String(body.image).slice(0, 500) : null;
  const now = new Date().toISOString();
  const q: Question = {
    id: genId("q"),
    type,
    toUserIds,
    fromAccount: me.accountNumber,
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

  // X投稿オプション
  const postToX = body.postToX === true;
  if (postToX) {
    const qUrl = siteUrl(`/q/${q.id}`);
    const typeLabel = type === "all" ? "全体質問" : type === "multi" ? "複数人質問" : "個別質問";
    const targets = toUserIds.length
      ? ` (${toUserIds.map((id) => id.slice(0, 4)).join(", ")}...)`
      : "";
    const txt = [`【質問箱】${title || typeLabel}${targets}`, "", text, "", qUrl].join("\n");
    const r = await xPost(txt);
    if (r.ok) {
      q.xUrl = r.url || null;
      await saveQuestions(qs);
    }
  }

  return NextResponse.json({ ok: true, question: q }, { status: 201 });
}
