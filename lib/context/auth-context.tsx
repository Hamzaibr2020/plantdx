"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextValue {
  username: string | null;
  loading: boolean;
  setUsername: (u: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "plantdx_username";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setUsernameState(stored);
    setLoading(false);
  }, []);

  function setUsername(u: string | null) {
    setUsernameState(u);
    if (u) localStorage.setItem(STORAGE_KEY, u);
    else localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ username, loading, setUsername }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}
