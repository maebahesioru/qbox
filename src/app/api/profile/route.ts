// プロフィール更新(表示名・自己紹介)
import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, userFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ ok: false, error: "ログインが必要です" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const displayName = String(body.displayName || "").trim().slice(0, 30);
  const bio = String(body.bio || "").trim().slice(0, 300);

  if (!displayName) {
    return NextResponse.json({ ok: false, error: "表示名を入力してください" }, { status: 400 });
  }

  const users = await getUsers();
  const u = users[user.accountNumber];
  if (u) {
    u.displayName = displayName;
    u.bio = bio;
    await saveUsers(users);
  }

  return NextResponse.json({ ok: true, displayName, bio });
}
