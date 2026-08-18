"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ImageInput } from "@/components/image-input";
import { QUESTION_TYPE_LABEL } from "@/lib/const";
import type { QuestionType } from "@/lib/const";
import { isMyQuestion, getEditToken, saveMyQuestion } from "@/components/question-form";
import { xShareUrl, questionShareText, answerShareText } from "@/lib/xpost";

interface ThreadUser {
  display: string;
  masked: string;
  anonymous: boolean;
}

interface ThreadAns {
  id: string;
  fromAccount: string | null;
  fromName: string;
  body: string;
  image: string | null;
  createdAt: string;
  user: ThreadUser;
  isBest: boolean;
}

interface ThreadData {
  question: {
    id: string;
    type: QuestionType;
    toUserIds: string[];
    fromAccount: string | null;
    fromName: string;
    title: string;
    body: string;
    image: string | null;
    status: "open" | "closed";
    bestAnswerId: string | null;
    createdAt: string;
    fromUser: ThreadUser;
    toDisplay: { id: string; name: string }[];
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
  const { me } = useAuth();
  const [q, setQ] = useState(initial.question);
  const [answers, setAnswers] = useState<ThreadAns[]>(initial.answers);
  const [body, setBody] = useState("");
  const [fromName, setFromName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // 「自分が質問したか」= localStorageの編集トークン or ログイン中の質問者
  const mine = isMyQuestion(q.id) || (!!me && q.fromAccount === me.accountNumber);

  async function submitAnswer() {
    setError(""); setBusy(true);
    try {
      const token = sessionStorage.getItem("qbox_token");
      const res = await fetch(`/api/questions/${q.id}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ body, fromName, image }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "回答に失敗しました");
        return;
      }
      saveMyQuestion(q.id, data.editToken ?? "");
      const display = fromName.trim() || "匿名";
      setAnswers((prev) => [
        ...prev,
        { ...data.answer, isBest: false, user: { display, masked: "", anonymous: !fromName.trim() } },
      ]);
      setBody(""); setImage(null); setFromName("");
    } finally {
      setBusy(false);
    }
  }

  async function chooseBest(answerId: string) {
    setBusy(true); setError("");
    try {
      const token = sessionStorage.getItem("qbox_token");
      const editToken = getEditToken(q.id) || "";
      const res = await fetch(`/api/questions/${q.id}/best`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answerId, editToken }),
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

  const shareLink = xShareUrl(questionShareText(q), questionUrl);

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
          {mine && <span className="rounded-full bg-[#2f3336] px-2 py-0.5 text-mut">あなたの質問</span>}
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
            質問者: <span className={q.fromUser.anonymous ? "" : "font-bold"}>{q.fromUser.display}</span>
          </span>
        </div>

        {/* X拡散: 各自が自分のXアカウントでURLを貼る(OGB画像で疑似画像も再現) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-black/30 p-3 text-sm">
          <span className="text-mut">Xでシェア(自分のアカウントで投稿):</span>
          <a
            href={shareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-x px-3 py-1.5 text-xs font-bold text-white"
          >
            ✕ この質問をポスト
          </a>
          <button
            onClick={copyUrl}
            className="rounded-lg bg-[#2f3336] px-3 py-1.5 text-xs font-bold text-mut hover:text-white"
          >
            {copied ? "コピーしました ✓" : "URLをコピー"}
          </button>
        </div>
      </section>

      {/* 回答フォーム */}
      <section className="rounded-2xl border border-borderline bg-panel p-5">
        <h2 className="mb-3 font-bold">回答する</h2>
        {q.status === "closed" ? (
          <p className="text-sm text-mut">この質問は解決済みのため、これ以上の回答はできません。</p>
        ) : (
          <div className="space-y-3">
            <input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="ニックネーム(任意・空欄なら匿名)"
              maxLength={30}
              className="w-full rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="この質問に対するあなたの回答を書いてください"
              maxLength={2000}
              rows={4}
              className="w-full resize-y rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
            />
            <ImageInput onChange={setImage} label="回答の画像もXでのOGPプレビューに使えます(各自でXに貼り付けて投稿)" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={submitAnswer}
              disabled={busy || !body.trim()}
              className="w-full rounded-lg bg-x py-2.5 font-bold text-white disabled:opacity-50"
            >
              {busy ? "送信中..." : "回答を送信"}
            </button>
            <p className="text-xs text-mut">
              回答した後、各回答の「✕ この回答をポスト」から自分のXアカウントで知恵アンサーを投稿できます。
            </p>
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
                <span className={`${a.user.anonymous ? "" : "font-bold"} text-foreground`}>{a.user.display}</span>
                <span>{fmt(a.createdAt)}</span>
                {a.isBest && <span className="rounded-full bg-best/20 px-2 py-0.5 font-bold text-best">ベストアンサー ★</span>}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{a.body}</p>
              {a.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image} alt="回答画像" className="mt-2 aspect-video w-full max-w-xs rounded-lg border border-borderline object-cover" />
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={xShareUrl(answerShareText(a), questionUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#2f3336] px-3 py-1.5 text-xs font-bold text-mut hover:text-white"
                >
                  ✕ この回答をポスト(自分のXで)
                </a>
                {mine && q.status === "open" && !a.isBest && (
                  <button
                    onClick={() => chooseBest(a.id)}
                    disabled={busy}
                    className="rounded-lg border border-best/50 px-3 py-1.5 text-xs font-bold text-best hover:bg-best/10 disabled:opacity-50"
                  >
                    ★ この回答をベストアンサーに選んで解決する
                  </button>
                )}
              </div>
              {mine && a.isBest && (
                <p className="mt-2 text-xs text-best/80">この回答をベストアンサーに選びました。質問は解決済みです。</p>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
