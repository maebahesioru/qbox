import { QuestionForm } from "@/components/question-form";
import { QuestionCard } from "@/components/question-card";
import { getQuestions, getAnswers } from "@/lib/data";
import { getUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [qs, answers, users] = await Promise.all([getQuestions(), getAnswers(), getUsers()]);

  // 全体質問のみ表示
  const allQs = qs.filter((q) => q.type === "all").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const answerCounts = new Map<string, number>();
  for (const a of answers) {
    answerCounts.set(a.questionId, (answerCounts.get(a.questionId) || 0) + 1);
  }
  const userLite = Object.fromEntries(Object.values(users).map((u) => [u.accountNumber, { displayName: u.displayName }]));

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4">
          <h1 className="text-xl font-bold">QBOX - Xの質問箱</h1>
          <p className="mt-1 text-sm text-mut">
            Xで質問を集めるQ&Aサービス。個別・複数人・全体への質問、知恵袋風のベストアンサーつき。
            URLをXに貼ると質問ページのOGP画像がプレビュー表示されます。
          </p>
        </div>
        <QuestionForm />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">みんなの質問</h2>
        {allQs.length === 0 ? (
          <div className="rounded-2xl border border-borderline bg-panel p-8 text-center text-sm text-mut">
            まだ全体質問がありません。「新しい質問」でみんなに聞いてみましょう
          </div>
        ) : (
          <div className="space-y-3">
            {allQs.map((q) => (
              <QuestionCard key={q.id} q={q} users={userLite} answerCount={answerCounts.get(q.id) || 0} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
