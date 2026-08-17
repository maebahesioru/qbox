// ログアウト(セッショントークン無効化)
import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (token) {
    const users = await getUsers();
    for (const u of Object.values(users)) {
      if (u.sessionToken === token) {
        u.sessionToken = null;
        break;
      }
    }
    await saveUsers(users);
  }
  return NextResponse.json({ ok: true });
}
