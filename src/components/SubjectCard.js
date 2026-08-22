"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";

const cardVariants = {
  hidden: { y: 24, opacity: 0, scale: 0.94 },
  show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 240, damping: 20 } },
};

/**
 * Collectible "trading card" for a subject, with its own color identity,
 * Lucide icon, sticker emoji and hover levitation.
 */
export default function SubjectCard({ subject }) {
  const Icon = subject.icon;

  return (
    <motion.div variants={cardVariants}>
      <motion.div
        whileHover={{ y: -10, rotate: 1.5, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <Link
          href={`/materias/${subject.id}`}
          className="clay group relative block overflow-hidden p-0"
        >
          {/* Gradient header */}
          <div className={cn("relative h-28 bg-gradient-to-br", subject.gradient)}>
            <div className="bg-dots absolute inset-0 opacity-40" />
            <span className="absolute right-3 top-3 text-3xl drop-shadow-sm anim-bob">
              {subject.emoji}
            </span>
            <Sparkles className="absolute left-3 top-3 h-4 w-4 text-white/70 anim-sparkle" />
            {/* Icon badge overlapping */}
            <span className="absolute -bottom-7 left-5 grid h-16 w-16 place-items-center rounded-3xl border-4 border-white bg-white/95 shadow-lg">
              <Icon className="h-8 w-8" strokeWidth={2.2} style={{ color: subject.hex }} />
            </span>
          </div>

          {/* Body */}
          <div className="px-5 pb-5 pt-10">
            <h3 className="font-display text-xl font-bold text-ink">{subject.name}</h3>
            <p className="mt-0.5 text-sm text-ink-soft">{subject.tag}</p>

            <div className="mt-4 flex items-center justify-between">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: subject.hex }}
              >
                Jogar
              </span>
              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-white shadow transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: subject.hex }}
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
