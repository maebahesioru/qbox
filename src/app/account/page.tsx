"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthPanel } from "@/components/auth-panel";
import { QuestionCard } from "@/components/question-card";
import type { Question } from "@/lib/data";

export default function AccountPage() {
  const { me, token, logout } = useAuth();
  const [showNumber, setShowNumber] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [userLite, setUserLite] = useState<Record<string, { displayName: string }>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadQuestions = useCallback(async () => {
    if (!token) return;
    const [qRes, uRes] = await Promise.all([
      fetch("/api/questions?mine=true", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      fetch("/api/users", { cache: "no-store" }),
    ]);
    const qd = await qRes.json();
    const ud = await uRes.json();
    const lite: Record<string, { displayName: string }> = {};
    for (const u of ud.users || []) lite[u.accountNumber] = { displayName: u.displayName };
    setUserLite(lite);
    setMyQuestions(qd.questions || []);
    // 回答数
    const c: Record<string, number> = {};
    for (const q of qd.questions || []) {
      const r = await fetch(`/api/questions/${q.id}`, { cache: "no-store" });
      const d = await r.json();
      c[q.id] = (d.answers || []).length;
    }
    setCounts(c);
  }, [token]);

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName);
      setBio(me.bio);
    }
  }, [me]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  if (!me) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-bold">アカウント</h1>
        <p className="text-sm text-mut">ログイン・新規登録すると質問への回答やベストアンサー選定ができます。</p>
        <AuthPanel onDone={() => {}} />
      </div>
    );
  }

  async function saveProfile() {
    setSaveMsg("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ displayName, bio }),
    });
    const d = await res.json();
    setSaveMsg(res.ok && d.ok ? "✓ 保存しました" : d.error || "保存に失敗しました");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">アカウント</h1>

      <section className="rounded-2xl border border-borderline bg-panel p-5">
        <h2 className="mb-3 font-bold">アカウント番号(Mullvad方式)</h2>
        <div className="flex items-center gap-3 rounded-xl bg-black/30 p-4">
          <code className="font-mono text-lg tracking-wider">
            {showNumber ? me.accountNumberDisplay : "•••• •••• •••• ••••"}
          </code>
          <button
            onClick={() => setShowNumber((s) => !s)}
            className="rounded-lg bg-[#2f3336] px-3 py-1.5 text-sm hover:text-white"
          >
            {showNumber ? "🙈 隠す" : "👁 表示"}
          </button>
        </div>
        <p className="mt-2 text-xs text-mut">
          この16桁の番号がID兼パスワードです。失くすと復旧できません。必ずメモしてください。
        </p>
      </section>

      <section className="rounded-2xl border border-borderline bg-panel p-5">
        <h2 className="mb-3 font-bold">プロフィール</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-mut">表示名</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              className="w-full rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-mut">自己紹介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full resize-y rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveProfile} className="rounded-lg bg-x px-4 py-2 text-sm font-bold text-white">
              保存する
            </button>
            {saveMsg && <span className="text-sm text-green-400">{saveMsg}</span>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-borderline bg-panel p-5">
        <h2 className="mb-3 font-bold">あなたの質問箱のURL</h2>
        <p className="mb-2 text-sm text-mut">
          このリンクをXに貼ると、あなた宛の質問を受け付けられます。
        </p>
        <Link href={`/u/${me.accountNumber}`} className="break-all text-x hover:underline">
          {typeof window !== "undefined" ? `${window.location.origin}/u/${me.accountNumber}` : `/u/${me.accountNumber}`}
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">自分が関わった質問</h2>
        {myQuestions.length === 0 ? (
          <div className="rounded-2xl border border-borderline bg-panel p-6 text-center text-sm text-mut">
            まだ質問がありません
          </div>
        ) : (
          <div className="space-y-3">
            {myQuestions.map((q) => (
              <QuestionCard key={q.id} q={q} users={userLite} answerCount={counts[q.id] || 0} myAccount={me.accountNumber} />
            ))}
          </div>
        )}
      </section>

      <button
        onClick={() => {
          logout();
          window.location.href = "/";
        }}
        className="w-full rounded-xl border border-red-500/40 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10"
      >
        ログアウト
      </button>
    </div>
  );
}
