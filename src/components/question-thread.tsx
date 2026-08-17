"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthPanel } from "@/components/auth-panel";
import { ImageInput } from "@/components/image-input";
import { QUESTION_TYPE_LABEL } from "@/lib/const";
import type { QuestionType } from "@/lib/const";

interface AnsUser {
  name: string;
  masked: string;
}

interface ThreadAns {
  id: string;
  fromAccount: string;
  body: string;
  image: string | null;
  xUrl: string | null;
  createdAt: string;
  user: AnsUser | null;
  isBest: boolean;
}

interface ThreadData {
  question: {
    id: string;
    type: QuestionType;
    toUserIds: string[];
    fromAccount: string | null;
    title: string;
    body: string;
    image: string | null;
    xUrl: string | null;
    status: "open" | "closed";
    bestAnswerId: string | null;
    createdAt: string;
    fromDisplay: AnsUser | null;
    toDisplay: { id: string; name: string; masked: string }[];
  };
  answers: ThreadAns[];
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return j.toISOString().slice(0, 16).replace("T", " ");
};

export function QuestionThread({ initial, questionUrl }: {
  initial: ThreadData;
  questionUrl: string;
}) {
  const { me, token } = useAuth();
  const [q, setQ] = useState(initial.question);
  const [answers, setAnswers] = useState<ThreadAns[]>(initial.answers);
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [postToX, setPostToX] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isOwner = me && q.fromAccount === me.accountNumber;

  async function submitAnswer() {
    if (!token || !me) return;
    setError(""); setBusy(true);
    try {
      const res = await fetch(`/api/questions/${q.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body, image, postToX }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "回答に失敗しました");
        return;
      }
      setAnswers((prev) => [
        ...prev,
        { ...data.answer, isBest: false, user: { name: me.displayName, masked: `${me.accountNumber.slice(0, 2)}••${me.accountNumber.slice(-2)}` } },
      ]);
      setBody(""); setImage(null); setPostToX(false);
    } finally {
      setBusy(false);
    }
  }

  async function chooseBest(answerId: string) {
    if (!token) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/questions/${q.id}/best`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answerId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "ベストアンサーに設定できませんでした");
        return;
      }
      setQ((prev) => ({ ...prev, status: "closed", bestAnswerId: answerId }));
      setAnswers((prev) => prev.map((a) => ({ ...a, isBest: a.id === answerId })));
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(questionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      {/* 質問表示 */}
      <section className="rounded-2xl border border-borderline bg-panel p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-bold ${q.type === "all" ? "bg-x/20 text-x" : q.type === "multi" ? "bg-purple-500/20 text-purple-300" : "bg-green-500/20 text-green-300"}`}>
            {QUESTION_TYPE_LABEL[q.type]}
          </span>
          {q.status === "closed" && (
            <span className="rounded-full bg-best/20 px-2 py-0.5 font-bold text-best">解決済み ✓</span>
          )}
          <span className="text-mut">{fmt(q.createdAt)}</span>
        </div>

        {q.title && <h1 className="mb-2 text-xl font-bold leading-snug">{q.title}</h1>}
        <p className="whitespace-pre-wrap leading-relaxed">{q.body}</p>

        {q.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.image} alt="添付画像" className="mt-3 aspect-video w-full max-w-md rounded-xl border border-borderline object-cover" />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-mut">
          <span>
            {q.type === "all" ? (
              "→ みんなへ"
            ) : (
              <>→ {q.toDisplay.map((t) => (
                <Link key={t.id} href={`/u/${t.id}`} className="text-x hover:underline">
                  {t.name}
                </Link>
              ))}
              </>
            )}
          </span>
          <span className="ml-auto">
            {q.fromDisplay ? (
              <>質問者: <span className="text-mut">{q.fromDisplay.name}({q.fromDisplay.masked})</span></>
            ) : (
              <span>質問者: 匿名</span>
            )}
          </span>
        </div>

        {/* X投稿用URLコピー(OGP疑似画像の使い方) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-black/30 p-3 text-sm">
          <span className="text-mut">Xに貼り付けて質問を拡散:</span>
          <code className="flex-1 truncate rounded bg-black/40 px-2 py-1 text-xs text-x">{questionUrl}</code>
          <button
            onClick={copyUrl}
            className="rounded-lg bg-x px-3 py-1.5 text-xs font-bold text-white"
          >
            {copied ? "コピーしました ✓" : "URLをコピー"}
          </button>
        </div>
      </section>

      {/* 回答フォーム */}
      <section className="rounded-2xl border border-borderline bg-panel p-5">
        <h2 className="mb-3 font-bold">回答する</h2>
        {!me ? (
          <AuthPanel />
        ) : q.status === "closed" ? (
          <p className="text-sm text-mut">この質問は解決済みのため、これ以上の回答はできません。</p>
        ) : (
          <div className="space-y-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="この質問に対するあなたの回答を書いてください"
              maxLength={2000}
              rows={4}
              className="w-full resize-y rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
            />
            <div className="flex items-center justify-between gap-3">
              <ImageInput onChange={setImage} label="画像付き回答はOGP画像としてXでプレビューされます" />
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={postToX} onChange={(e) => setPostToX(e.target.checked)} className="h-4 w-4 accent-[#1d9bf0]" />
                <span>Xにも投稿(知恵アンサー)</span>
              </label>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={submitAnswer}
              disabled={busy || !body.trim()}
              className="w-full rounded-lg bg-x py-2.5 font-bold text-white disabled:opacity-50"
            >
              {busy ? "送信中..." : "回答を送信"}
            </button>
          </div>
        )}
      </section>

      {/* 回答一覧 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">回答({answers.length})</h2>
        {answers.length === 0 ? (
          <div className="rounded-2xl border border-borderline bg-panel p-8 text-center text-sm text-mut">
            まだ回答がありません。最初の回答をしましょう
          </div>
        ) : (
          answers.map((a) => (
            <div key={a.id} className={`rounded-2xl border bg-panel p-4 ${a.isBest ? "border-best/60" : "border-borderline"}`}>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-mut">
                <span className="font-bold text-foreground">{a.user?.name || "不明"}</span>
                <span>{a.user?.masked}</span>
                <span>{fmt(a.createdAt)}</span>
                {a.isBest && <span className="rounded-full bg-best/20 px-2 py-0.5 font-bold text-best">ベストアンサー ★</span>}
                {a.xUrl && (
                  <a href={a.xUrl} target="_blank" rel="noopener noreferrer" className="text-x hover:underline">✕ ポストを見る</a>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{a.body}</p>
              {a.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image} alt="回答画像" className="mt-2 aspect-video w-full max-w-xs rounded-lg border border-borderline object-cover" />
              )}
              {isOwner && q.status === "open" && !a.isBest && (
                <div className="mt-3">
                  <button
                    onClick={() => chooseBest(a.id)}
                    disabled={busy}
                    className="rounded-lg border border-best/50 px-3 py-1.5 text-xs font-bold text-best hover:bg-best/10 disabled:opacity-50"
                  >
                    ★ この回答をベストアンサーに選んで解決する
                  </button>
                </div>
              )}
              {isOwner && a.isBest && (
                <p className="mt-2 text-xs text-best/80">この回答をベストアンサーに選びました。質問は解決済みです。</p>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
