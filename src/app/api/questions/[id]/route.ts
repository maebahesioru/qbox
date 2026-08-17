// 質問詳細(誰でも閲覧可)
import { NextRequest, NextResponse } from "next/server";
import { getQuestion, getAnswersForQuestion } from "@/lib/data";
import { userFromRequest, getUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = await getQuestion(id);
  if (!q) return NextResponse.json({ ok: false, error: "質問が見つかりません" }, { status: 404 });

  const answers = await getAnswersForQuestion(id);
  const users = await getUsers();

  const mask = (n: string) => (n ? `${n.slice(0, 2)}••${n.slice(-2)}` : "");
  // 表示名解決: アカウント紐付け→ニックネーム→匿名
  const resolveName = (account: string | null, name: string): { display: string; masked: string; anonymous: boolean } => {
    if (account && users[account]) {
      return { display: users[account].displayName, masked: mask(account), anonymous: false };
    }
    if (name) return { display: name, masked: "", anonymous: false };
    return { display: "匿名", masked: "", anonymous: true };
  };

  const fromUser = resolveName(q.fromAccount, q.fromName);
  const toUsers = q.toUserIds.map((tid) => ({
    accountNumber: tid,
    displayName: users[tid]?.displayName || "不明",
    masked: mask(tid),
  }));

  return NextResponse.json({
    ok: true,
    question: { ...q, editToken: undefined },
    toUsers,
    fromUser,
    answers: answers.map((a) => ({
      ...a, editToken: undefined,
      user: resolveName(a.fromAccount, a.fromName),
    })),
  });
}
