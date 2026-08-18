// ユーザー一覧(質問先の選択用・アカウント番号は公開しない・公開IDのみ返す)
import { NextRequest, NextResponse } from "next/server";
import { getUsers, publicUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const users = await getUsers();
  const list = Object.values(users)
    .map((u) => ({
      publicId: publicUserId(u.accountNumber), // 生番号は返さない
      displayName: u.displayName,
      bio: u.bio,
      createdAt: u.createdAt,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));

  return NextResponse.json({ ok: true, users: list });
}
