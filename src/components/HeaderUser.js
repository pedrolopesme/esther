"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, LogIn, LogOut, Settings, Users, User, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { POINTS_EVENT, getPoints } from "../utils/points";
import { cn } from "../utils/cn";

const PER_LEVEL = 100;
const AVATARS = ["🐣", "🐥", "🦄", "🐰", "🦊", "🐼", "🐸", "🦋", "🌟", "👑"];

export default function HeaderUser() {
  const router = useRouter();
  const { isAuthenticated, user, profile, child, isChild, isLoading, supabase, isAdmin, isParent } = useAuth();
  const [points, setPoints] = useState(0);
  const [pop, setPop] = useState(false);
  const [open, setOpen] = useState(false);

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
  const name = isChild
    ? child?.display_name || "Estudante"
    : profile?.display_name || user?.email?.split("@")[0] || "Estudante";
  const level = Math.floor(points / PER_LEVEL) + 1;
  const inLevel = points % PER_LEVEL;
  const pct = (inLevel / PER_LEVEL) * 100;
  const roleLabel = isChild ? "Criança" : isAdmin ? "Admin" : isParent ? "Responsável" : "Estudante";
  const roleColor = isChild ? "bg-mint-soft text-[#05795b]" : isAdmin ? "bg-lilac/20 text-lilac" : isParent ? "bg-candy/20 text-candy" : "bg-sky-soft text-sky";

  async function handleLogout() {
    if (isChild) {
      localStorage.removeItem("esther_child");
      window.location.reload();
      return;
    }
    await supabase?.auth?.signOut();
    router.push("/");
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {!isChild && isAdmin && (
        <Link
          href="/admin"
          className="press hidden items-center gap-1.5 rounded-full bg-lilac/15 px-2.5 py-1.5 text-xs font-bold text-lilac shadow-sm hover:bg-lilac/25 sm:flex"
          title="Painel administrativo"
        >
          <Settings className="h-3.5 w-3.5" />
          Admin
        </Link>
      )}
      {!isChild && isParent && (
        <Link
          href="/responsavel"
          className="press hidden items-center gap-1.5 rounded-full bg-candy/15 px-2.5 py-1.5 text-xs font-bold text-candy shadow-sm hover:bg-candy/25 sm:flex"
          title="Painel do responsável"
        >
          <Users className="h-3.5 w-3.5" />
          Filhos
        </Link>
      )}
      {/* Avatar + name with hover dropdown */}
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-full bg-white/70 py-1 pl-1 pr-2 shadow-sm ring-1 ring-white transition sm:pr-2.5",
            open ? "ring-lilac/40" : "hover:ring-lilac/40",
          )}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-soft to-lilac-soft text-base shadow ring-2 ring-white sm:h-9 sm:w-9 sm:text-lg">
            {avatar}
          </span>
          <span className="flex items-center gap-1 max-w-[7rem] sm:max-w-[10rem]">
            <span className="truncate text-sm font-bold text-ink">{name}</span>
            <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none", roleColor)}>
              {roleLabel}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-ink-soft transition-transform",
              open && "rotate-180",
            )}
          />
        </div>

        {/* Dropdown menu */}
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-2xl bg-white/95 shadow-xl ring-1 ring-lilac/10 backdrop-blur transition-all duration-150",
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0",
          )}
        >
          {!isChild && (
          <Link
            href="/perfil"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-lilac/10"
          >
            <User className="h-4 w-4 text-lilac" />
            Perfil
          </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-candy/10"
          >
            <LogOut className="h-4 w-4 text-candy" />
            Sair
          </button>
        </div>
      </div>

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
    </div>
  );
}
