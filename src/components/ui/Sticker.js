"use client";

import { cn } from "../../utils/cn";

/**
 * Decorative floating sticker (emoji or node). Purely cosmetic.
 * anim: float | float-slow | wiggle | sparkle | bob
 */
export default function Sticker({ children, className = "", anim = "float", "aria-hidden": ariaHidden = true }) {
  const animClass = {
    float: "anim-float",
    "float-slow": "anim-float-slow",
    wiggle: "anim-wiggle",
    sparkle: "anim-sparkle",
    bob: "anim-bob",
  }[anim];

  return (
    <span
      aria-hidden={ariaHidden}
      className={cn("pointer-events-none absolute select-none", animClass, className)}
    >
      {children}
    </span>
  );
}
