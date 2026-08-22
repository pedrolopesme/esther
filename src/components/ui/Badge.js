"use client";

import { cn } from "../../utils/cn";

/**
 * Rounded pill badge with soft color fills.
 * tone: candy | lilac | mint | sky | sun | coral | neutral
 */
const TONES = {
  candy: "bg-candy-soft text-[#B03B6E]",
  lilac: "bg-lilac-soft text-[#6B3FC0]",
  mint: "bg-mint-soft text-[#068a68]",
  sky: "bg-sky-soft text-[#1E7FA6]",
  sun: "bg-sun-soft text-[#9C7415]",
  coral: "bg-coral-soft text-[#C85F3C]",
  neutral: "bg-white/80 text-ink-soft",
};

export default function Badge({ children, tone = "neutral", icon: Icon, className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold font-display",
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
      {children}
    </span>
  );
}
