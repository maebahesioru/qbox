// 回答の投稿
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { genId, getQuestion, getQuestions, saveQuestions, getAnswers, saveAnswers, Answer } from "@/lib/data";
import { xPost, siteUrl } from "@/lib/xpost";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = req.headers.get("authorization");
  const me = await userFromRequest(auth);
  if (!me) return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });

  const q = await getQuestion(id);
  if (!q) return NextResponse.json({ ok: false, error: "質問が見つかりません" }, { status: 404 });
  if (q.status === "closed") {
    return NextResponse.json({ ok: false, error: "この質問は解決済み(ベストアンサー決定済み)です" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body.body || "").trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: "回答内容を入力してください" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ ok: false, error: "回答は2000文字以内で入力してください" }, { status: 400 });
  }

  const image = body.image && typeof body.image === "string" ? String(body.image).slice(0, 500) : null;

  const answer: Answer = {
    id: genId("a"),
    questionId: id,
    fromAccount: me.accountNumber,
    body: text,
    image,
    xUrl: null,
    createdAt: new Date().toISOString(),
  };

  const answers = await getAnswers();
  answers.push(answer);
  await saveAnswers(answers);

  // 質問のupdatedAt更新
  const qs = await getQuestions();
  const idx = qs.findIndex((x) => x.id === id);
  if (idx >= 0) {
    qs[idx].updatedAt = answer.createdAt;
    await saveQuestions(qs);
  }

  // X投稿オプション(知恵アンサーをXに投稿して帰ってくる)
  const postToX = body.postToX === true;
  if (postToX) {
    const aUrl = siteUrl(`/q/${id}`);
    const txt = [`【回答】${q.title ? `「${q.title}」への回答` : "質問への回答"}`, "", text, "", aUrl].join("\n");
    const r = await xPost(txt);
    if (r.ok) {
      answer.xUrl = r.url || null;
      await saveAnswers(await getAnswers());
    }
  }

  return NextResponse.json({ ok: true, answer }, { status: 201 });
}
