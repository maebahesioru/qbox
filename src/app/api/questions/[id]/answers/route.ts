// 回答の投稿(未ログイン可・匿名)
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { userFromRequest } from "@/lib/auth";
import { genId, getQuestion, getQuestions, saveQuestions, getAnswers, saveAnswers, Answer } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = await getQuestion(id);
  if (!q) return NextResponse.json({ ok: false, error: "質問が見つかりません" }, { status: 404 });
  if (q.status === "closed") {
    return NextResponse.json({ ok: false, error: "この質問は解決済み(ベストアンサー決定済み)です" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body.body || "").trim();
  const fromName = String(body.fromName || "").trim().slice(0, 30);
  if (!text) {
    return NextResponse.json({ ok: false, error: "回答内容を入力してください" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ ok: false, error: "回答は2000文字以内で入力してください" }, { status: 400 });
  }

  const me = await userFromRequest(req.headers.get("authorization"));

  const answer: Answer = {
    id: genId("a"),
    questionId: id,
    fromAccount: me ? me.accountNumber : null,
    fromName,
    editToken: randomBytes(16).toString("hex"),
    body: text,
    image: null,
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

  return NextResponse.json({
    ok: true,
    answer: { ...answer, editToken: undefined },
    editToken: answer.editToken,
  }, { status: 201 });
}
