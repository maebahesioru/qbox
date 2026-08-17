// アカウント番号発行(Mullvad方式: 16桁の数字・メール/パスワード不要)
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  getUsers, saveUsers, hashAccountNumber, createSessionToken,
  generateAccountNumber, formatAccountNumber, User,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const users = await getUsers();
  let accountNumber = "";
  do {
    accountNumber = generateAccountNumber();
  } while (users[accountNumber]);

  const salt = randomBytes(16).toString("hex");
  const token = createSessionToken();

  const user: User = {
    accountNumber,
    displayName: `ユーザー${accountNumber.slice(0, 4)}`,
    bio: "",
    salt,
    hash: hashAccountNumber(accountNumber, salt),
    createdAt: new Date().toISOString(),
    sessionToken: token,
    failCount: 0,
    lockUntil: null,
  };
  users[accountNumber] = user;
  await saveUsers(users);

  return NextResponse.json({
    ok: true,
    token,
    accountNumber,
    accountNumberDisplay: formatAccountNumber(accountNumber),
    displayName: user.displayName,
    warning: "この番号があなたのアカウントです。失くすと復旧できません。必ずメモしてください。",
  });
}
