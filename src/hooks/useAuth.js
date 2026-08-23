"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "../utils/supabase";

const CHILD_KEY = "esther_child";

function loadChild() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHILD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [child, setChild] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const updateChild = useCallback((updates) => {
    setChild((currentChild) => {
      if (!currentChild) return currentChild;
      const nextChild = { ...currentChild, ...updates };
      localStorage.setItem(CHILD_KEY, JSON.stringify(nextChild));
      return nextChild;
    });
  }, []);

  // Load child from localStorage on mount
  useEffect(() => {
    setChild(loadChild());
    const onStorage = () => setChild(loadChild());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, display_name")
        .eq("id", data.session.user.id)
        .single();
      setProfile(profileData ?? null);
    } else {
      setProfile(null);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();

    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        supabase
          .from("profiles")
          .select("role, display_name")
          .eq("id", nextSession.user.id)
          .single()
          .then(({ data }) => setProfile(data ?? null));
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [refresh, supabase]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    isAdmin: profile?.role === "admin",
    isStudent: profile?.role === "student",
    isParent: profile?.role === "parent",
    child,
    isChild: !!child,
    isLoading,
    isAuthenticated: !!session?.user || !!child,
    supabase,
    refresh,
    updateChild,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
