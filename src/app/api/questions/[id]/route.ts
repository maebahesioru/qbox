// 質問詳細
import { NextRequest, NextResponse } from "next/server";
import { getQuestion, getAnswersForQuestion } from "@/lib/data";
import { getUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = await getQuestion(id);
  if (!q) return NextResponse.json({ ok: false, error: "質問が見つかりません" }, { status: 404 });

  const answers = await getAnswersForQuestion(id);
  const users = await getUsers();

  // ユーザー情報を付与(番号はマスク、表示名は公開)
  const mask = (n: string) => (n ? `${n.slice(0, 2)}••${n.slice(-2)}` : null);
  const toUsers = q.toUserIds.map((id) => ({
    accountNumber: id,
    displayName: users[id]?.displayName || "不明",
    masked: mask(id),
  }));

  return NextResponse.json({
    ok: true,
    question: q,
    toUsers,
    fromUser: q.fromAccount && users[q.fromAccount]
      ? { accountNumber: q.fromAccount, displayName: users[q.fromAccount].displayName, masked: mask(q.fromAccount) }
      : null,
    answers: answers.map((a) => ({
      ...a,
      user: users[a.fromAccount]
        ? { accountNumber: a.fromAccount, displayName: users[a.fromAccount].displayName, masked: mask(a.fromAccount) }
        : null,
    })),
  });
}
