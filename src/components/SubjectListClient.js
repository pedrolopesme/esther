"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Filter, X, CalendarDays, GraduationCap, ChevronRight, ListChecks } from "lucide-react";
import { getAvailableExerciseLists } from "../utils/exerciseLoader";
import { getSubject } from "../utils/subjects";
import { cn } from "../utils/cn";
import Badge from "./ui/Badge";
import Sticker from "./ui/Sticker";

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { y: 22, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 240, damping: 20 } },
};

export default function SubjectListClient({ subjectId }) {
  const subject = getSubject(subjectId);
  const Icon = subject?.icon ?? ListChecks;

  const [exerciseLists, setExerciseLists] = useState([]);
  const [filterYear, setFilterYear] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadExerciseLists() {
      try {
        setIsLoading(true);
        const lists = await getAvailableExerciseLists(subjectId);
        setExerciseLists(lists);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar listas de exercícios:", err);
        setError("Não foi possível carregar as listas de exercícios. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
    loadExerciseLists();
  }, [subjectId]);

  const uniqueYears = Array.from(new Set(exerciseLists.map((l) => l.ano_letivo).filter(Boolean)));
  const filteredLists = exerciseLists.filter((l) => {
    const matchesYear = filterYear ? l.ano_letivo === filterYear : true;
    const listDate = l.date ? new Date(l.date).toISOString().slice(0, 10) : "";
    const matchesFrom = filterDateFrom ? listDate >= filterDateFrom : true;
    const matchesTo = filterDateTo ? listDate <= filterDateTo : true;
    return matchesYear && matchesFrom && matchesTo;
  });

  const hasFilters = filterYear || filterDateFrom || filterDateTo;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6">
      {/* Back */}
      <Link
        href="/"
        className="press mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur hover:-translate-x-0.5 hover:text-lilac"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Voltar
      </Link>

      {/* Subject hero */}
      <motion.header
        className={cn("clay relative mb-8 overflow-hidden bg-gradient-to-br p-6 text-white sm:p-8", subject?.gradient)}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <div className="bg-dots absolute inset-0 opacity-30" />
        <Sticker className="right-4 top-3 text-5xl" anim="float">{subject?.emoji}</Sticker>
        <div className="relative flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-white/95 shadow-lg">
            <Icon className="h-8 w-8" strokeWidth={2.3} style={{ color: subject?.hex }} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold drop-shadow-sm sm:text-4xl">{subject?.name}</h1>
            <p className="text-white/90">{subject?.tag}</p>
          </div>
        </div>
      </motion.header>

      {/* Filters */}
      <motion.div
        className="clay-sm mb-6 bg-white/85 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <span className="mr-1 inline-flex items-center gap-1.5 font-display text-sm font-bold text-ink">
            <Filter className="h-4 w-4 text-lilac" strokeWidth={2.5} /> Filtros
          </span>
          <label className="flex flex-col text-xs font-semibold text-ink-soft">
            Ano da lista
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="mt-1 rounded-xl border-2 border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac/50"
            >
              <option value="">Todos</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-semibold text-ink-soft">
            De
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="mt-1 rounded-xl border-2 border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac/50"
            />
          </label>
          <label className="flex flex-col text-xs font-semibold text-ink-soft">
            Até
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="mt-1 rounded-xl border-2 border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac/50"
            />
          </label>
          {hasFilters && (
            <button
              onClick={() => { setFilterYear(""); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="press inline-flex items-center gap-1 rounded-full bg-candy-soft px-3 py-2 text-sm font-bold text-[#b03b6e] hover:-translate-y-0.5"
            >
              <X className="h-4 w-4" strokeWidth={2.5} /> Limpar
            </button>
          )}
        </div>
      </motion.div>

      {/* States */}
      {isLoading && (
        <div className="flex justify-center p-12">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-lilac/25 border-t-lilac" />
        </div>
      )}

      {error && (
        <div className="clay-sm bg-candy-soft p-4 text-center font-semibold text-[#a62f5f]">{error}</div>
      )}

      {!isLoading && !error && exerciseLists.length === 0 && (
        <div className="clay-sm bg-sky-soft p-6 text-center font-semibold text-[#1e7fa6]">
          Nenhuma lista de exercícios disponível no momento. 🐣
        </div>
      )}

      {!isLoading && !error && filteredLists.length === 0 && exerciseLists.length > 0 && (
        <div className="clay-sm bg-sun-soft p-6 text-center font-semibold text-[#9c7415]">
          Nenhum item corresponde aos filtros. 🔍
        </div>
      )}

      {/* List */}
      <motion.div className="grid gap-4" variants={listVariants} initial="hidden" animate="show">
        {filteredLists.map((list) => (
          <motion.div key={list.id} variants={cardVariants}>
            <Link
              href={`/materias/${subjectId}/${list.id}`}
              className="clay group block p-5 transition-transform duration-200 hover:-translate-y-1.5 hover:rotate-[0.4deg]"
            >
              <div className="flex items-start gap-4">
                <span
                  className="mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-md"
                  style={{ backgroundColor: subject?.hex }}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.3} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-ink sm:text-xl">{list.title}</h3>
                  {list.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{list.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {list.ano_letivo && (
                      <Badge tone={subject?.color ?? "lilac"} icon={GraduationCap}>{list.ano_letivo}</Badge>
                    )}
                    <Badge tone="sky" icon={CalendarDays}>
                      {new Date(list.date).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                </div>
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white shadow transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: subject?.hex }}
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
