"use client";

import { cn } from "../../utils/cn";

/**
 * Chunky 3D pressable button, kawaii style.
 * variant: candy | lilac | mint | sky | sun | coral | ghost
 * size: sm | md | lg
 */
const VARIANTS = {
  candy: "bg-gradient-to-b from-[#FF8FBB] to-[#FF5C99] text-white shadow-[0_6px_0_#E23F7E]",
  lilac: "bg-gradient-to-b from-[#B48CFF] to-[#9257FF] text-white shadow-[0_6px_0_#7A3FE0]",
  mint: "bg-gradient-to-b from-[#3FE3B8] to-[#06C994] text-white shadow-[0_6px_0_#05A87C]",
  sky: "bg-gradient-to-b from-[#72D6F5] to-[#33BEEC] text-white shadow-[0_6px_0_#1E9BC7]",
  sun: "bg-gradient-to-b from-[#FFDA85] to-[#FFC13B] text-ink shadow-[0_6px_0_#E8A81E]",
  coral: "bg-gradient-to-b from-[#FFB196] to-[#FF8560] text-white shadow-[0_6px_0_#E86A44]",
  ghost: "bg-white/80 text-ink shadow-[0_5px_0_rgba(163,112,255,0.25)] border-2 border-white",
};

const SIZES = {
  sm: "px-4 py-2 text-sm rounded-2xl",
  md: "px-6 py-3 text-base rounded-2xl",
  lg: "px-8 py-4 text-lg rounded-[1.5rem]",
};

export default function Button({
  children,
  onClick,
  disabled = false,
  type = "button",
  variant = "candy",
  size = "md",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "press font-display font-bold tracking-wide select-none",
        "active:translate-y-1.5 active:shadow-none",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lilac/40",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0",
        VARIANTS[variant] ?? VARIANTS.candy,
        SIZES[size] ?? SIZES.md,
        className,
      )}
    >
      {children}
    </button>
  );
}
