// アカウント番号でログイン(番号=ID兼パスワード)
import { NextRequest, NextResponse } from "next/server";
import {
  getUsers, saveUsers, verifyAccountNumber, checkLock,
  recordFailure, createSessionToken, User,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const accountNumber = String(body.accountNumber || "").replace(/[^0-9]/g, "");
  if (!/^\d{16}$/.test(accountNumber)) {
    return NextResponse.json({ ok: false, error: "16桁のアカウント番号を入力してください" }, { status: 400 });
  }

  const users = await getUsers();
  const user = users[accountNumber];
  if (!user) {
    return NextResponse.json({ ok: false, error: "アカウント番号が正しくありません" }, { status: 401 });
  }

  const lockMsg = checkLock(user);
  if (lockMsg) {
    return NextResponse.json({ ok: false, error: lockMsg }, { status: 429 });
  }

  if (!verifyAccountNumber(accountNumber, user.salt, user.hash)) {
    recordFailure(user);
    // ロック中なら少し待ってから書く
    await saveUsers(users);
    const remain = user.lockUntil ? Math.ceil((user.lockUntil - Date.now()) / 60000) : 0;
    return NextResponse.json(
      { ok: false, error: user.failCount >= 5 ? `試行回数が多すぎます。${remain}分後に再試行してください` : "アカウント番号が正しくありません" },
      { status: 401 },
    );
  }

  user.failCount = 0;
  user.lockUntil = null;
  user.sessionToken = createSessionToken();
  await saveUsers(users);

  return NextResponse.json({
    ok: true,
    token: user.sessionToken,
    accountNumber: user.accountNumber,
    accountNumberDisplay: user.accountNumber.replace(/(\d{4})(?=\d)/g, "$1 "),
    displayName: user.displayName,
  });
}
