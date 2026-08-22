"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "../utils/supabase";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

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

  return {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    isAdmin: profile?.role === "admin",
    isStudent: profile?.role === "student",
    isParent: profile?.role === "parent",
    isLoading,
    isAuthenticated: !!session?.user,
    supabase,
    refresh,
  };
}
