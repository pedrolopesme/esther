"use client";

import { Star } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Rounded progress bar with gradient fill, shimmer and a floating star knob.
 */
export default function ProgressBar({ progress = 0, className = "", showKnob = true }) {
  const pct = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn("relative h-5 w-full rounded-full bg-white/70 p-1 shadow-inner", className)}>
      <div
        className="relative h-full rounded-full bg-gradient-to-r from-candy via-lilac to-sky transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.85) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2.2s linear infinite",
          }}
        />
        {showKnob && pct > 4 && (
          <span className="absolute -right-1 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md">
            <Star className="h-3.5 w-3.5 fill-sun text-sun" strokeWidth={2} />
          </span>
        )}
      </div>
    </div>
  );
}
