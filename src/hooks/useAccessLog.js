"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "../utils/supabase";

/**
 * Logs the current authenticated student's page visit to `access_logs`.
 * Inserts once per unique path per mount — no duplicate spam on re-renders.
 */
export function useAccessLog() {
  const pathname = usePathname();
  const loggedRef = useRef(null);

  useEffect(() => {
    if (loggedRef.current === pathname) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) return;

      loggedRef.current = pathname;
      supabase.from("access_logs").insert({ user_id: userId, path: pathname }).then(() => {});
    });
  }, [pathname]);
}
