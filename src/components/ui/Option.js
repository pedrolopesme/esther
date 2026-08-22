"use client";

import { Check, X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Big, touch-friendly custom radio option.
 * States: idle · hover · selected · correct · incorrect · locked (after submit)
 */
export default function Option({
  children,
  selected = false,
  correct = false,
  incorrect = false,
  locked = false,
  onClick,
  className = "",
}) {
  const state = correct ? "correct" : incorrect ? "incorrect" : selected ? "selected" : "idle";

  const shells = {
    idle: "border-white bg-white/85 text-ink shadow-[0_5px_0_rgba(163,112,255,0.18)] hover:-translate-y-0.5 hover:border-lilac/40",
    selected: "border-lilac bg-lilac-soft text-[#5B2FB0] shadow-[0_5px_0_rgba(163,112,255,0.45)] -translate-y-0.5",
    correct: "border-mint bg-mint-soft text-[#05795b] shadow-[0_5px_0_#06d6a0]",
    incorrect: "border-candy bg-candy-soft text-[#a62f5f] shadow-[0_5px_0_#ff70a6]",
  };

  const bubbles = {
    idle: "border-lilac/30 bg-white text-transparent",
    selected: "border-lilac bg-lilac text-white",
    correct: "border-mint bg-mint text-white",
    incorrect: "border-candy bg-candy text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-pressed={selected}
      className={cn(
        "press flex w-full items-center gap-3 rounded-[1.25rem] border-2 px-4 py-4 text-left font-display font-semibold",
        "active:translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lilac/30",
        shells[state],
        locked && "cursor-default",
        className,
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
          bubbles[state],
        )}
      >
        {correct && <Check className="h-4 w-4" strokeWidth={3} />}
        {incorrect && <X className="h-4 w-4" strokeWidth={3} />}
        {selected && !correct && !incorrect && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}
