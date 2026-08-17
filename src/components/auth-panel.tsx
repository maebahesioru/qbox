"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function AuthPanel({ onDone }: { onDone?: () => void }) {
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setError(""); setInfo(""); setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "ログインに失敗しました");
        return;
      }
      login(data.token);
      onDone?.();
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    setError(""); setInfo(""); setBusy(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "登録に失敗しました");
        return;
      }
      setInfo(`アカウント番号: ${data.accountNumberDisplay}\n${data.warning}`);
      login(data.token);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-borderline bg-panel p-5">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => { setMode("login"); setError(""); setInfo(""); }}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === "login" ? "bg-x text-white" : "bg-button bg-[#2f3336] text-mut hover:text-white"}`}
        >
          ログイン
        </button>
        <button
          onClick={() => { setMode("register"); setError(""); setInfo(""); }}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === "register" ? "bg-x text-white" : "bg-[#2f3336] text-mut hover:text-white"}`}
        >
          新規登録
        </button>
      </div>

      {mode === "login" ? (
        <div className="space-y-3">
          <p className="text-sm text-mut">16桁のアカウント番号を入力してログイン(番号=ID兼パスワード)。</p>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            className="w-full rounded-lg border border-borderline bg-background px-3 py-2 outline-none focus:border-x"
          />
          <button
            onClick={handleLogin}
            disabled={busy || !/^\d{16}$/.test(accountNumber.replace(/[^0-9]/g, ""))}
            className="w-full rounded-lg bg-x py-2.5 font-bold text-white disabled:opacity-50"
          >
            {busy ? "処理中..." : "ログイン"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-mut">
            メール・パスワード不要。16桁の番号がそのままあなたのアカウントになります。
          </p>
          <button
            onClick={handleRegister}
            disabled={busy}
            className="w-full rounded-lg bg-x py-2.5 font-bold text-white disabled:opacity-50"
          >
            {busy ? "発行中..." : "新しいアカウント番号を発行する"}
          </button>
          {(info || error) && (
            <pre className="whitespace-pre-wrap rounded-lg border border-best/40 bg-black/30 p-3 text-sm">
              {error ? <span className="text-red-400">{error}</span> : <span>{info}</span>}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
