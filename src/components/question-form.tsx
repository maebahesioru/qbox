"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type QuestionType = "direct" | "multi" | "all";

interface U {
  publicId: string;
  displayName: string;
  bio: string;
}

// 対象ユーザー選択(個別/複数人)
function TargetSelect({ type, value, onChange }: { type: QuestionType; value: string[]; onChange: (v: string[]) => void }) {
  const [users, setUsers] = useState<U[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/users", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => {});
  }, []);

  if (type === "all") return null;

  const filtered = users.filter((u) => u.displayName.includes(q));

  function toggle(id: string) {
    if (type === "direct") {
      onChange(value[0] === id ? [] : [id]);
      return;
    }
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <div>
      <p className="mb-1 text-sm text-mut">{type === "direct" ? "質問する相手を1人選択" : "質問する相手を選択(複数可)"}</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="名前や番号で検索"
        className="mb-2 w-full rounded-lg border border-borderline bg-background px-3 py-2 text-sm outline-none focus:border-x"
      />
      <div className="max-h-44 overflow-y-auto rounded-lg border border-borderline bg-black/20">
        {filtered.length === 0 && <p className="p-3 text-sm text-mut">該当するユーザーがいません</p>}
        {filtered.map((u) => {
          const on = value.includes(u.publicId);
          return (
            <button
              key={u.publicId}
              type="button"
              onClick={() => toggle(u.publicId)}
              className={`flex w-full items-center gap-2 border-b border-borderline/50 px-3 py-2 text-left text-sm last:border-0 hover:bg-panel ${on ? "bg-x/10" : ""}`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-xs ${type === "direct" ? "rounded-full" : "rounded"} ${on ? "bg-x text-white" : "border border-borderline"}`}>
                {on ? "✓" : ""}
              </span>
              <span className="font-bold">{u.displayName}</span>
              <span className="ml-auto text-xs text-mut">ID非公開</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 自分の質問編集トークンの保存/取得(localStorage・未ログイン質問の管理用)
export function saveMyQuestion(qid: string, editToken: string) {
  try {
    const raw = localStorage.getItem("qbox_my_questions");
    const map = raw ? JSON.parse(raw) : {};
    map[qid] = editToken;
    localStorage.setItem("qbox_my_questions", JSON.stringify(map));
  } catch { /* ignore */ }
}

export function isMyQuestion(qid: string): boolean {
  try {
    const raw = localStorage.getItem("qbox_my_questions");
    return raw ? qid in JSON.parse(raw) : false;
  } catch {
    return false;
  }
}

export function getEditToken(qid: string): string | null {
  try {
    const raw = localStorage.getItem("qbox_my_questions");
    const map = raw ? JSON.parse(raw) : {};
    return map[qid] || null;
  } catch {
    return null;
  }
}

export function QuestionForm({ defaultType = "all", toUserIds: fixedTo, onCreated, compact }: {
  defaultType?: QuestionType;
  toUserIds?: string[];
  onCreated?: () => void;
  compact?: boolean;
}) {
  const [type, setType] = useState<QuestionType>(defaultType);
  const [toUserIds, setToUserIds] = useState<string[]>(fixedTo || []);
  const [fromName, setFromName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { qid: string }>(null);

  useEffect(() => {
    if (fixedTo) setToUserIds(fixedTo);
  }, [fixedTo?.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useCallback(async () => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, toUserIds, fromName, title, body }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "投稿に失敗しました");
        return;
      }
      // 編集トークンを保存(ベストアンサー選定に使用)
      saveMyQuestion(data.question.id, data.editToken);
      setTitle(""); setBody(""); setFromName("");
      if (!fixedTo) { setToUserIds([]); setType("all"); }
      setDone({ qid: data.question.id });
      if (onCreated) onCreated();
    } finally {
      setBusy(false);
    }
  }, [type, toUserIds, fromName, title, body, fixedTo, onCreated]);

  return (
    <div className="rounded-2xl border border-borderline bg-panel p-5">
      <h2 className="mb-3 font-bold">新しい質問</h2>
      <p className="mb-3 text-xs text-mut">
        未ログイン・匿名で質問できます。相手に知られたくない名前や内容でもOK。
      </p>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {([
          ["all", "全体質問"],
          ["multi", "複数人質問"],
          ["direct", "個別質問"],
        ] as [QuestionType, string][]).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            disabled={!!fixedTo}
            className={`rounded-lg py-2 text-sm font-bold ${type === t ? "bg-x text-white" : "bg-[#2f3336] text-mut hover:text-white"} ${fixedTo ? "opacity-50" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {type !== "all" && (
        <div className="mb-3">
          <TargetSelect type={type} value={toUserIds} onChange={setToUserIds} />
        </div>
      )}

      <div className="space-y-3">
        <input
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder="ニックネーム(任意・空欄なら匿名)"
          maxLength={30}
          className="w-full rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
        />
        {!compact && (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル(任意)"
            maxLength={100}
            className="w-full rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
          />
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={type === "all" ? "みんなに質問する内容を書いてください" : "質問する内容を書いてください"}
          maxLength={2000}
          rows={compact ? 2 : 4}
          className="w-full resize-y rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
        />
        <p className="text-xs text-mut">
          質問の内容は自動で画像化され、Xでリンクを貼ると本文がカード画像としてプレビュー表示されます(実質画像の貼り付け)。
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={submit}
          disabled={busy || !body.trim()}
          className="w-full rounded-lg bg-x py-2.5 font-bold text-white disabled:opacity-50"
        >
          {busy ? "投稿中..." : "質問を送信"}
        </button>
        {done && (
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm">
            <p className="font-bold text-green-400">✓ 質問を投稿しました</p>
            <p className="mt-1 text-mut">
              ベストアンサー選定などの管理用URL:
            </p>
            <Link href={`/q/${done.qid}`} className="text-x hover:underline">
              質問ページを開く →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
