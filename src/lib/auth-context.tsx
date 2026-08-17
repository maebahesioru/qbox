// 認証コンテキスト(sessionStorage にトークンを保持)
"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export interface Me {
  accountNumber: string;
  accountNumberDisplay: string;
  displayName: string;
  bio: string;
}

interface AuthCtx {
  me: Me | null;
  token: string | null;
  login: (t: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  me: null,
  token: null,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function tokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("qbox_token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const fetchMe = useCallback(async (t: string) => {
    try {
      const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMe({ accountNumber: data.accountNumber, accountNumberDisplay: data.accountNumberDisplay, displayName: data.displayName, bio: data.bio });
      } else {
        sessionStorage.removeItem("qbox_token");
        setToken(null);
        setMe(null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const t = tokenFromStorage();
    if (t) {
      setToken(t);
      fetchMe(t);
    }
  }, [fetchMe]);

  const login = useCallback((t: string) => {
    sessionStorage.setItem("qbox_token", t);
    setToken(t);
    fetchMe(t);
  }, [fetchMe]);

  const logout = useCallback(async () => {
    const t = tokenFromStorage();
    if (t) {
      try {
        await fetch("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
      } catch { /* ignore */ }
    }
    sessionStorage.removeItem("qbox_token");
    setToken(null);
    setMe(null);
  }, []);

  const refresh = useCallback(async () => {
    const t = tokenFromStorage();
    if (t) await fetchMe(t);
  }, [fetchMe]);

  return <Ctx.Provider value={{ me, token, login, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
