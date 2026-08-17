// ユーザー一覧(質問先の選択用・番号はマスクして表示)
import { NextRequest, NextResponse } from "next/server";
import { getUsers, userFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 認証不要で見れる(質問先の検索用)
  const users = await getUsers();
  const list = Object.values(users)
    .map((u) => ({
      accountNumber: u.accountNumber,
      displayName: u.displayName,
      bio: u.bio,
      createdAt: u.createdAt,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));

  return NextResponse.json({ ok: true, users: list });
}
