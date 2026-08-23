"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ListChecks, FolderDown, AlertTriangle } from "lucide-react";
import { cn } from "../utils/cn";

const cardVariants = {
  hidden: { y: 16, opacity: 0, scale: 0.96 },
  show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

/**
 * Compact & cheerful Kawaii Subject Card for the student dashboard.
 * Designed to fit comfortably in responsive 2, 3 or 4 columns without overwhelming the page.
 */
export default function SubjectCard({ subject, listCount, materialCount, unseenMaterialCount = 0 }) {
  const Icon = subject.icon;

  return (
    <motion.div variants={cardVariants}>
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      >
        <Link
          href={`/materias/${subject.id}`}
          className="clay group relative flex flex-col justify-between overflow-hidden p-4 sm:p-5 transition-all hover:shadow-xl"
        >
          {/* Subtle colored accent top border */}
          <div
            className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${subject.hex}, #ffffff)`,
            }}
          />

          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-2xl shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${subject.hex}22` }}
              >
                {subject.emoji}
              </div>

              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: subject.hex }}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </div>

            <h3 className="font-display text-lg font-bold text-ink group-hover:text-lilac transition-colors truncate">
              {subject.name}
            </h3>
            {subject.tag && (
              <p className="mt-0.5 text-xs text-ink-soft truncate">
                {subject.tag}
              </p>
            )}
          </div>

          {/* Counts and unseen material alert */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-lilac/10 pt-3 text-[11px] font-bold text-ink-soft">
            {typeof listCount === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lilac/10 px-2 py-0.5 text-lilac">
                <ListChecks className="h-3 w-3" />
                {listCount} listas
              </span>
            )}
            {typeof materialCount === "number" && materialCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2 py-0.5 text-sky">
                <FolderDown className="h-3 w-3" />
                {materialCount} materiais
              </span>
            )}
            {unseenMaterialCount > 0 && (
              <span
                className="inline-flex animate-pulse items-center gap-1 rounded-full border border-[#FF70A6]/60 bg-[#FF70A6] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_3px_0_#D93B74]"
                title={`${unseenMaterialCount} material(is) ainda não visto(s) nesta matéria`}
              >
                <AlertTriangle className="h-3 w-3" />
                {unseenMaterialCount} novo{unseenMaterialCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
