"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "../utils/cn";

const cardVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.9 },
  show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 18 } },
};

/**
 * Playful subject tile for the student playground.
 * Reads as a chunky toy button: colored planet orb, soft color wash and a
 * pressable 3D shadow tinted with the subject hue.
 */
export default function SubjectCard({ subject, listCount, materialCount, unseenMaterialCount = 0 }) {
  const hex = subject.hex || "#A370FF";
  const hasNews = unseenMaterialCount > 0;

  return (
    <motion.div variants={cardVariants} className="h-full">
      <motion.div
        className="h-full"
        whileHover={{ y: -8, rotate: -1.5 }}
        whileTap={{ scale: 0.96, y: -2 }}
        transition={{ type: "spring", stiffness: 340, damping: 16 }}
      >
        <Link
          href={`/materias/${subject.id}`}
          aria-label={`Abrir ${subject.name}`}
          className="group relative flex h-full flex-col items-center gap-2 overflow-hidden rounded-[1.9rem] border-[3px] border-white bg-cloud p-4 text-center outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-lilac/40 sm:p-5"
          style={{
            backgroundImage: `radial-gradient(120% 90% at 50% -10%, ${hex}2E 0%, #ffffff 68%)`,
            boxShadow: `0 8px 0 ${hex}55, 0 16px 28px -14px ${hex}88`,
          }}
        >
          {/* Sparkle badge for unseen content */}
          {hasNews && (
            <span
              className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#ff477e] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-[0_2px_0_#bd1f58]"
              title={`${unseenMaterialCount} novidade(s) nesta matéria`}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {unseenMaterialCount}
            </span>
          )}

          {/* Planet orb */}
          <span
            aria-hidden="true"
            className={cn(
              "grid h-16 w-16 shrink-0 place-items-center rounded-full text-3xl shadow-inner transition-transform duration-300 group-hover:scale-110 sm:h-[4.5rem] sm:w-[4.5rem] sm:text-4xl",
              hasNews && "anim-bob"
            )}
            style={{
              background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${hex}44 55%, ${hex}77 100%)`,
            }}
          >
            {subject.emoji}
          </span>

          <h3 className="font-display text-sm font-bold leading-tight text-ink sm:text-base">
            {subject.name}
          </h3>

          {/* Counts as tiny chips */}
          <div className="mt-auto flex flex-wrap items-center justify-center gap-1">
            {listCount > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
                style={{ backgroundColor: hex }}
              >
                {listCount} {listCount === 1 ? "lista" : "listas"}
              </span>
            )}
            {materialCount > 0 && (
              <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-extrabold text-ink-soft">
                {materialCount} {materialCount === 1 ? "material" : "materiais"}
              </span>
            )}
            {listCount === 0 && materialCount === 0 && (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                em breve ✨
              </span>
            )}
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
