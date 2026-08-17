// ユーザーページ(その人の質問箱)
import { notFound } from "next/navigation";
import Link from "next/link";
import { getUsers } from "@/lib/auth";
import { getQuestions, getAnswers } from "@/lib/data";
import { QuestionForm } from "@/components/question-form";
import { QuestionCard } from "@/components/question-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const users = await getUsers();
  const u = users[id];
  if (!u) return { title: "ユーザーが見つかりません - QBOX" };
  return { title: `${u.displayName}の質問箱 - QBOX` };
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [users, qs, answers] = await Promise.all([getUsers(), getQuestions(), getAnswers()]);
  const u = users[id];
  if (!u) notFound();

  const mine = qs.filter((q) => q.toUserIds.includes(id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const answerCounts = new Map<string, number>();
  for (const a of answers) answerCounts.set(a.questionId, (answerCounts.get(a.questionId) || 0) + 1);
  const userLite = Object.fromEntries(Object.values(users).map((x) => [x.accountNumber, { displayName: x.displayName }]));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-borderline bg-panel p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-x/20 text-2xl">📮</div>
          <div>
            <h1 className="text-lg font-bold">{u.displayName}</h1>
            <p className="text-sm text-mut">
              {u.accountNumber.slice(0, 4)}•••• •••• •••• ••••
            </p>
          </div>
        </div>
        {u.bio && <p className="mt-3 whitespace-pre-wrap text-sm">{u.bio}</p>}
        <p className="mt-2 text-xs text-mut">
          このユーザーに匿名で質問できます({mine.length}件の質問)
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">この人に質問する</h2>
        <QuestionForm defaultType="direct" toUserIds={[id]} compact />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">このユーザー宛の質問</h2>
        {mine.length === 0 ? (
          <div className="rounded-2xl border border-borderline bg-panel p-6 text-center text-sm text-mut">
            このユーザー宛の質問はまだありません
          </div>
        ) : (
          <div className="space-y-3">
            {mine.map((q) => (
              <QuestionCard key={q.id} q={q} users={userLite} answerCount={answerCounts.get(q.id) || 0} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
