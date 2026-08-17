// 現在のユーザー情報
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    accountNumber: user.accountNumber,
    accountNumberDisplay: user.accountNumber.replace(/(\d{4})(?=\d)/g, "$1 "),
    displayName: user.displayName,
    bio: user.bio,
    createdAt: user.createdAt,
  });
}
