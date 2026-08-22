"use client";

import Link from "next/link";
import { LogIn, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function AuthNav() {
  const { isAuthenticated, user, profile, isLoading, supabase, isAdmin } = useAuth();

  if (isLoading) {
    return <span className="h-8 w-8 animate-pulse rounded-full bg-white/50" />;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="press flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold text-ink shadow-sm hover:text-lilac"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Entrar</span>
      </Link>
    );
  }

  const name = profile?.display_name || user?.email?.split("@")[0] || "Estudante";

  async function handleLogout() {
    await supabase?.auth?.signOut();
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          href="/admin"
          className="press flex items-center gap-1.5 rounded-full bg-lilac/20 px-3 py-1.5 text-sm font-bold text-lilac shadow-sm hover:bg-lilac/30"
          title="Painel administrativo"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}
      <span className="hidden items-center gap-1.5 text-sm font-semibold text-ink-soft sm:flex">
        <User className="h-4 w-4" />
        {name}
      </span>
      <button
        onClick={handleLogout}
        className="press flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold text-ink shadow-sm hover:text-candy"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </div>
  );
}
