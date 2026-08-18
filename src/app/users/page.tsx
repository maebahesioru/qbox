import Link from "next/link";
import { getUsers } from "@/lib/auth";
import { getQuestions, getAnswers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, qs, answers] = await Promise.all([getUsers(), getQuestions(), getAnswers()]);
  const list = Object.values(users).sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));

  // ユーザーごとの質問数/回答数
  const qCount = new Map<string, number>();
  const aCount = new Map<string, number>();
  for (const q of qs) {
    const k = q.fromAccount || "";
    qCount.set(k, (qCount.get(k) || 0) + 1);
  }
  for (const a of answers) {
    const k = a.fromAccount || "";
    aCount.set(k, (aCount.get(k) || 0) + 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">ユーザー一覧</h1>
        <p className="mt-1 text-sm text-mut">質問したい相手を選んで質問箱へ。個別・複数人質問はここから。</p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-borderline bg-panel p-8 text-center text-sm text-mut">
          まだユーザーがいません
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((u) => (
            <Link
              key={u.accountNumber}
              href={`/u/${u.accountNumber}`}
              className="rounded-2xl border border-borderline bg-panel p-4 transition hover:border-x/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-x/20">📮</div>
                <div className="min-w-0">
                  <p className="truncate font-bold">{u.displayName}</p>
                  <p className="text-xs text-mut">ID非公開</p>
                </div>
              </div>
              {u.bio && <p className="mt-2 line-clamp-2 text-sm text-mut">{u.bio}</p>}
              <p className="mt-2 text-xs text-mut">
                質問 {qCount.get(u.accountNumber) || 0}件 / 回答 {aCount.get(u.accountNumber) || 0}件
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
