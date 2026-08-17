"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthPanel } from "@/components/auth-panel";
import { ImageInput } from "@/components/image-input";

type QuestionType = "direct" | "multi" | "all";

interface U {
  accountNumber: string;
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

  const filtered = users.filter(
    (u) => u.displayName.includes(q) || u.accountNumber.includes(q.replace(/[^0-9]/g, "")),
  );

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
          const on = value.includes(u.accountNumber);
          return (
            <button
              key={u.accountNumber}
              type="button"
              onClick={() => toggle(u.accountNumber)}
              className={`flex w-full items-center gap-2 border-b border-borderline/50 px-3 py-2 text-left text-sm last:border-0 hover:bg-panel ${on ? "bg-x/10" : ""}`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-xs ${type === "direct" ? "rounded-full" : "rounded"} ${on ? "bg-x text-white" : "border border-borderline"}`}>
                {on ? "✓" : ""}
              </span>
              <span className="font-bold">{u.displayName}</span>
              <span className="ml-auto text-xs text-mut">{u.accountNumber.slice(0, 4)}••••</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuestionForm({ defaultType = "all", toUserIds: fixedTo, onCreated, compact }: {
  defaultType?: QuestionType;
  toUserIds?: string[];
  onCreated?: () => void;
  compact?: boolean;
}) {
  const { me, token } = useAuth();
  const [type, setType] = useState<QuestionType>(defaultType);
  const [toUserIds, setToUserIds] = useState<string[]>(fixedTo || []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [postToX, setPostToX] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (fixedTo) setToUserIds(fixedTo);
  }, [fixedTo?.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, toUserIds, title, body, image, postToX }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "投稿に失敗しました");
        return;
      }
      setTitle(""); setBody(""); setImage(null); setPostToX(false);
      if (!fixedTo) { setToUserIds([]); setType("all"); }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      onCreated?.();
    } finally {
      setBusy(false);
    }
  }

  if (!me) {
    return <AuthPanel />;
  }

  return (
    <div className="rounded-2xl border border-borderline bg-panel p-5">
      <h2 className="mb-3 font-bold">新しい質問</h2>

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
        <div className="flex items-center justify-between gap-3">
          <ImageInput onChange={setImage} label="添付画像は質問ページのOGP画像になり、Xでリンクを貼ると画像がプレビュー表示されます(疑似画像貼り付け)" />
          <div className="shrink-0">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={postToX} onChange={(e) => setPostToX(e.target.checked)} className="h-4 w-4 accent-[#1d9bf0]" />
              <span>Xにも投稿</span>
            </label>
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {done && <p className="text-sm text-green-400">✓ 質問を投稿しました</p>}
        <button
          onClick={submit}
          disabled={busy || !body.trim()}
          className="w-full rounded-lg bg-x py-2.5 font-bold text-white disabled:opacity-50"
        >
          {busy ? "投稿中..." : "質問を送信"}
        </button>
      </div>
    </div>
  );
}
