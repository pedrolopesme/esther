"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { POINTS_EVENT, getPoints } from "../../utils/points";
import { cn } from "../../utils/cn";

const PER_LEVEL = 100;
const AVATARS = ["🐣", "🐥", "🦄", "🐰", "🦊", "🐼", "🐸", "🦋", "🌟", "👑"];

export default function PlayerBadge() {
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

  const level = Math.floor(points / PER_LEVEL) + 1;
  const inLevel = points % PER_LEVEL;
  const pct = (inLevel / PER_LEVEL) * 100;
  const avatar = AVATARS[Math.min(level - 1, AVATARS.length - 1)];

  return (
    <div className="flex items-center gap-2 sm:gap-3" title={`Nível ${level} · ${points} estrelas`}>
      {/* Avatar with level badge */}
      <div className="relative">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-sky-soft to-lilac-soft text-xl shadow-md ring-2 ring-white">
          {avatar}
        </span>
        <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-lilac to-candy px-1 text-[10px] font-bold text-white shadow ring-2 ring-white">
          {level}
        </span>
      </div>

      {/* Level progress (hidden on small screens) */}
      <div className="hidden w-24 flex-col gap-1 sm:flex">
        <span className="text-[11px] font-semibold leading-none text-ink-soft">Nível {level}</span>
        <div className="h-2 w-full rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mint to-sky transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Star counter */}
      <div
        className={cn(
          "press flex items-center gap-1.5 rounded-full bg-gradient-to-br from-sun-soft to-candy-soft px-3 py-1.5 shadow-sm ring-1 ring-white",
          pop && "-translate-y-1 scale-110",
        )}
      >
        <Star className="h-4 w-4 fill-sun text-sun anim-bob" strokeWidth={2} />
        <span className="font-display text-sm font-bold text-ink">{points}</span>
      </div>
    </div>
  );
}
