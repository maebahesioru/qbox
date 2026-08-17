"use client";
import { useRef, useState } from "react";

// 画像付き入力(アップロード → プレビュー → URL保持)
export function ImageInput({ onChange, label }: { onChange: (url: string | null) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(f: File | undefined) {
    if (!f) return;
    setError(""); setBusy(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const token = sessionStorage.getItem("qbox_token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "アップロードに失敗しました");
        return;
      }
      setUrl(data.url);
      onChange(data.url);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-borderline bg-[#2f3336] px-3 py-1.5 text-sm text-mut hover:text-white disabled:opacity-50"
        >
          {busy ? "アップロード中..." : url ? "画像を変更" : "📷 画像を添付"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {url && (
          <>
            <span className="text-sm text-mut">✓ 添付済み</span>
            <button
              type="button"
              onClick={() => { setUrl(null); onChange(null); }}
              className="text-sm text-red-400 hover:underline"
            >
              削除
            </button>
          </>
        )}
      </div>
      {url && (
        <div className="relative mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-borderline bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* OG画像プレビュー用に通常img */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="添付画像" className="h-full w-full object-cover" />
        </div>
      )}
      {label && <p className="mt-1 text-xs text-mut">{label}</p>}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
