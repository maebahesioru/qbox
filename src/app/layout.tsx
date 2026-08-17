import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { NavBar } from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "QBOX - Xの質問箱",
  description: "Xの質問箱サービス。個別質問・複数人質問・全体質問、知恵袋風のQ&Aとベストアンサー対応。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
