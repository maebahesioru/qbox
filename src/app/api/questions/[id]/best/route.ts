// ベストアンサー選択(質問者のみ・質問を解決済みにして終了)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { getQuestion, getQuestions, saveQuestions, getAnswers } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = req.headers.get("authorization");
  const me = await userFromRequest(auth);
  if (!me) return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });

  const q = await getQuestion(id);
  if (!q) return NextResponse.json({ ok: false, error: "質問が見つかりません" }, { status: 404 });

  // 質問者のみベストアンサー選定可
  if (q.fromAccount !== me.accountNumber) {
    return NextResponse.json({ ok: false, error: "質問者だけがベストアンサーを選べます" }, { status: 403 });
  }
  if (q.status === "closed") {
    return NextResponse.json({ ok: false, error: "この質問はすでに解決済みです" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const answerId = String(body.answerId || "");
  const answers = await getAnswers();
  const answer = answers.find((a) => a.id === answerId && a.questionId === id);
  if (!answer) {
    return NextResponse.json({ ok: false, error: "回答が見つかりません" }, { status: 404 });
  }

  const qs = await getQuestions();
  const idx = qs.findIndex((x) => x.id === id);
  if (idx >= 0) {
    qs[idx].bestAnswerId = answerId;
    qs[idx].status = "closed";
    qs[idx].updatedAt = new Date().toISOString();
    await saveQuestions(qs);
  }

  return NextResponse.json({ ok: true, bestAnswerId: answerId });
}
