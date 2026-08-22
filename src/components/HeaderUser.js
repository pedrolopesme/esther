"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, LogIn, LogOut, Settings, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { POINTS_EVENT, getPoints } from "../utils/points";
import { cn } from "../utils/cn";

const PER_LEVEL = 100;
const AVATARS = ["🐣", "🐥", "🦄", "🐰", "🦊", "🐼", "🐸", "🦋", "🌟", "👑"];

export default function HeaderUser() {
  const router = useRouter();
  const { isAuthenticated, user, profile, isLoading, supabase, isAdmin, isParent } = useAuth();
  const [points, setPoints] = useState(0);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setPoints(getPoints());
    const handleUpdate = (e) => {
      setPoints(typeof e?.detail === "number" ? e.detail : getPoints());
      setPop(true);
      setTimeout(() => setPop(false), 400);
    };
    window.addEventListener(POINTS_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(POINTS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Loading skeleton
  if (isLoading) {
    return <span className="h-9 w-9 animate-pulse rounded-full bg-white/50" />;
  }

  // ── Not logged in: just the "Entrar" button ──
  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="press flex items-center gap-1.5 rounded-full bg-gradient-to-br from-lilac to-candy px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg"
      >
        <LogIn className="h-4 w-4" strokeWidth={2.5} />
        Entrar
      </Link>
    );
  }

  // ── Logged in: avatar + name + stars ──
  const name = profile?.display_name || user?.email?.split("@")[0] || "Estudante";
  const level = Math.floor(points / PER_LEVEL) + 1;
  const inLevel = points % PER_LEVEL;
  const pct = (inLevel / PER_LEVEL) * 100;
  const avatar = AVATARS[Math.min(level - 1, AVATARS.length - 1)];

  async function handleLogout() {
    await supabase?.auth?.signOut();
    router.push("/");
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Admin link */}
      {isAdmin && (
        <Link
          href="/admin"
          className="press hidden items-center gap-1.5 rounded-full bg-lilac/15 px-2.5 py-1.5 text-xs font-bold text-lilac shadow-sm hover:bg-lilac/25 sm:flex"
          title="Painel administrativo"
        >
          <Settings className="h-3.5 w-3.5" />
          Admin
        </Link>
      )}

      {/* Parent dashboard link */}
      {isParent && (
        <Link
          href="/responsavel"
          className="press hidden items-center gap-1.5 rounded-full bg-candy/15 px-2.5 py-1.5 text-xs font-bold text-candy shadow-sm hover:bg-candy/25 sm:flex"
          title="Painel do responsável"
        >
          <Users className="h-3.5 w-3.5" />
          Filhos
        </Link>
      )}

      {/* Avatar + name pill → links to profile */}
      <Link
        href="/perfil"
        className="press flex items-center gap-2 rounded-full bg-white/70 py-1 pl-1 pr-3 shadow-sm ring-1 ring-white hover:ring-lilac/40 sm:pr-4"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-soft to-lilac-soft text-base shadow ring-2 ring-white sm:h-9 sm:w-9 sm:text-lg">
          {avatar}
        </span>
        <span className="max-w-[5rem] truncate text-sm font-bold text-ink sm:max-w-[8rem]">
          {name}
        </span>
      </Link>

      {/* Stars */}
      <div
        className={cn(
          "press flex items-center gap-1 rounded-full bg-gradient-to-br from-sun-soft to-candy-soft px-2.5 py-1.5 shadow-sm ring-1 ring-white",
          pop && "-translate-y-1 scale-110",
        )}
        title={`${points} estrelas · Nível ${level}`}
      >
        <Star className="h-3.5 w-3.5 fill-sun text-sun anim-bob" strokeWidth={2} />
        <span className="font-display text-xs font-bold text-ink">{points}</span>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="press rounded-full bg-white/60 p-1.5 text-ink-soft shadow-sm hover:text-candy"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
