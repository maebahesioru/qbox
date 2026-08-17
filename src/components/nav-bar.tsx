"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function NavBar() {
  const { me } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-borderline bg-background/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-x">
          <span className="text-xl">📮</span>
          <span>QBOX</span>
        </Link>
        <div className="ml-auto flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-panel">ホーム</Link>
          <Link href="/users" className="rounded-full px-3 py-1.5 hover:bg-panel">ユーザー</Link>
          <Link href="/account" className="rounded-full px-3 py-1.5 hover:bg-panel">アカウント</Link>
          {me ? (
            <span className="ml-1 hidden rounded-full bg-panel px-3 py-1.5 text-mut sm:inline">
              {me.displayName}
            </span>
          ) : (
            <span className="ml-1 hidden rounded-full bg-panel px-3 py-1.5 text-mut sm:inline">未ログイン</span>
          )}
        </div>
      </nav>
    </header>
  );
}
