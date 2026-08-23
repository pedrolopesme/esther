"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Filter, X, CalendarDays, GraduationCap, ChevronRight, ListChecks } from "lucide-react";
import { getAvailableExerciseLists } from "../utils/exerciseLoader";
import { getSubject, getSubjectsFromDB, resolveSubject } from "../utils/subjects";
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
  const [subject, setSubject] = useState(
    getSubject(subjectId) || resolveSubject({ id: subjectId, name: subjectId })
  );
  const [exerciseLists, setExerciseLists] = useState([]);
  const [filterYear, setFilterYear] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [dbSubjects, lists] = await Promise.all([
          getSubjectsFromDB(true),
          getAvailableExerciseLists(subjectId),
        ]);

        const matched = dbSubjects.find((s) => s.id === subjectId);
        if (matched) setSubject(matched);

        setExerciseLists(lists);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar listas de exercícios:", err);
        setError("Não foi possível carregar as listas de exercícios. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [subjectId]);

  const Icon = subject?.icon ?? ListChecks;

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <Filter className="h-4 w-4 text-lilac" />
            <span>Filtrar</span>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setFilterYear(""); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="press inline-flex items-center gap-1 rounded-full bg-candy-soft px-3 py-2 text-sm font-bold text-[#b03b6e] hover:-translate-y-0.5"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Year */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Ano letivo</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac"
            >
              <option value="">Todos os anos</option>
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Data inicial</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Data final</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac"
            />
          </div>
        </div>
      </motion.div>

      {/* List count */}
      <div className="mb-4 flex items-center justify-between text-sm text-ink-soft">
        <span>
          {filteredLists.length} {filteredLists.length === 1 ? "lista encontrada" : "listas encontradas"}
        </span>
      </div>

      {/* Lists */}
      {isLoading ? (
        <div className="clay flex min-h-60 items-center justify-center p-8 text-center text-ink-soft">
          <span className="animate-pulse">Carregando listas...</span>
        </div>
      ) : error ? (
        <div className="clay bg-candy-soft p-6 text-center text-sm font-semibold text-[#a62f5f]">
          {error}
        </div>
      ) : filteredLists.length === 0 ? (
        <div className="clay p-10 text-center">
          <div className="mb-2 text-4xl">🔍</div>
          <p className="font-display text-lg font-bold text-ink">Nenhuma lista encontrada</p>
          <p className="mt-1 text-sm text-ink-soft">
            {hasFilters
              ? "Tente ajustar os filtros de ano ou data acima."
              : "Ainda não há exercícios publicados para esta matéria."}
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-4"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {filteredLists.map((list) => {
            const dateStr = list.date
              ? new Date(list.date + "T12:00:00").toLocaleDateString("pt-BR")
              : "";
            return (
              <motion.div key={list.id} variants={cardVariants}>
                <Link
                  href={`/materias/${subjectId}/lista?listId=${list.id}`}
                  className="clay group relative block p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {list.ano_letivo && (
                          <Badge variant="soft" color={subject?.hex}>
                            <GraduationCap className="mr-1 inline h-3.5 w-3.5" />
                            {list.ano_letivo}
                          </Badge>
                        )}
                        {dateStr && (
                          <Badge variant="subtle">
                            <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                            {dateStr}
                          </Badge>
                        )}
                        {typeof list.questionCount === "number" && (
                          <Badge color={subject?.hex}>
                            <ListChecks className="mr-1 inline h-3.5 w-3.5" />
                            {list.questionCount} {list.questionCount === 1 ? "questão" : "questões"}
                          </Badge>
                        )}
                      </div>

                      <h2 className="font-display text-xl font-bold text-ink group-hover:text-lilac transition-colors">
                        {list.title}
                      </h2>

                      {list.description && (
                        <p className="mt-2 text-sm text-ink-soft line-clamp-2">
                          {list.description}
                        </p>
                      )}
                    </div>

                    <span
                      className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white shadow-md transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color: subject?.hex }}
                    >
                      <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
