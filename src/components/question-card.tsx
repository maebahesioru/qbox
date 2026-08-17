import Link from "next/link";
import type { Question } from "@/lib/data";
import { QUESTION_TYPE_LABEL } from "@/lib/const";

interface UserLite {
  displayName: string;
}

// 質問カード(一覧表示用)
export function QuestionCard({ q, users, answerCount, myAccount }: {
  q: Question;
  users: Record<string, UserLite>;
  answerCount: number;
  myAccount?: string | null;
}) {
  const fromName = q.fromAccount ? (users[q.fromAccount]?.displayName || "不明") : "匿名";
  const targets = q.toUserIds.map((id) => users[id]?.displayName || "不明");
  const isMine = q.fromAccount && q.fromAccount === myAccount;
  const resolved = q.status === "closed";

  return (
    <Link
      href={`/q/${q.id}`}
      className="block rounded-2xl border border-borderline bg-panel p-4 transition hover:border-x/50"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-bold ${q.type === "all" ? "bg-x/20 text-x" : q.type === "multi" ? "bg-purple-500/20 text-purple-300" : "bg-green-500/20 text-green-300"}`}>
          {QUESTION_TYPE_LABEL[q.type]}
        </span>
        {resolved && (
          <span className="rounded-full bg-best/20 px-2 py-0.5 font-bold text-best">ベストアンサー決定 ✓</span>
        )}
        <span className="text-mut">{answerCount}件の回答</span>
        {q.xUrl && (
          <a href={q.xUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-x hover:underline">
            ✕ ポストを見る
          </a>
        )}
      </div>

      {q.title && <h3 className="mb-1 font-bold leading-snug">{q.title}</h3>}
      <p className="mb-2 line-clamp-3 whitespace-pre-wrap text-sm text-mut">{q.body}</p>

      {q.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={q.image} alt="" className="mb-2 aspect-video w-full max-w-xs rounded-lg border border-borderline object-cover" />
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-mut">
        <span>→ {q.type === "all" ? "みんなへ" : targets.join(", ")}</span>
        <span className="ml-auto">
          {isMine ? "あなたの質問" : `質問者: ${q.fromAccount ? fromName : "匿名"}`}
        </span>
      </div>
    </Link>
  );
}
