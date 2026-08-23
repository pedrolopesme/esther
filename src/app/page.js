"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CalendarDays, ListChecks, ArrowRight, Wand2 } from "lucide-react";
import { getLatestExerciseLists } from "../utils/exerciseRepository";
import {
  SUBJECTS as STATIC_SUBJECTS,
  getSubjectsFromDB,
  getSubject,
  resolveSubject,
} from "../utils/subjects";
import SubjectCard from "../components/SubjectCard";
import Badge from "../components/ui/Badge";
import Sticker from "../components/ui/Sticker";
import LandingPage from "../components/LandingPage";
import { useAuth } from "../hooks/useAuth";

const gridVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { x: -16, opacity: 0 },
  show: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

function Dashboard() {
  const [subjects, setSubjects] = useState(STATIC_SUBJECTS.map(resolveSubject));
  const [latestLists, setLatestLists] = useState([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [latestError, setLatestError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingLatest(true);
        const [dbSubjects, data] = await Promise.all([
          getSubjectsFromDB(false),
          getLatestExerciseLists(),
        ]);
        setSubjects(dbSubjects);
        setLatestLists(data);
        setLatestError(null);
      } catch (err) {
        setLatestError(err.message);
      } finally {
        setIsLoadingLatest(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:pt-12">
      {/* ---------- Hero ---------- */}
      <section className="relative mb-14 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-lilac/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-candy/10 blur-3xl" />
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-sky/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        >
          <Sticker className="mx-auto mb-5 text-5xl sm:text-6xl">🦄</Sticker>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-5xl">
            Escolha sua matéria e{" "}
            <span className="text-gradient">vamos estudar!</span> ✨
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
            Resolva exercícios, ganhe estrelas e mostre que você é incrível!
          </p>

          {/* Quick stats */}
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-6 text-sm text-ink-soft sm:gap-10">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-lilac">{subjects.length}</span>
              <span>Matérias</span>
            </div>
            <div className="h-8 w-px bg-lilac/20" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-candy">30+</span>
              <span>Listas</span>
            </div>
            <div className="h-8 w-px bg-lilac/20" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-sky">500+</span>
              <span>Questões</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------- Subject grid ---------- */}
      <section className="mb-16">
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3"
          variants={gridVariants}
          initial="hidden"
          animate="show"
        >
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </motion.div>
      </section>

      {/* ---------- Latest lists ---------- */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-lilac" />
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
            Últimas listas publicadas
          </h2>
        </div>

        {isLoadingLatest ? (
          <div className="flex items-center gap-3 text-ink-soft">
            <Wand2 className="h-4 w-4 animate-spin" />
            Carregando listas recentes...
          </div>
        ) : latestError ? (
          <p className="rounded-2xl bg-candy-soft px-4 py-3 text-sm font-semibold text-[#a62f5f]">
            {latestError}
          </p>
        ) : (
          <motion.ul
            className="space-y-3"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {latestLists.map((list) => {
              const theme =
                subjects.find((s) => s.id === list.subject) ||
                getSubject(list.subject) ||
                resolveSubject({ id: list.subject, name: list.materia || list.subject });

              return (
                <motion.li key={`${list.subject}-${list.slug}`} variants={rowVariants}>
                  <Link
                    href={`/materias/${list.subject}/lista?listId=${list.slug}`}
                    className="clay group flex items-center gap-4 p-4 transition-shadow hover:shadow-lg"
                  >
                    <span className="text-2xl">{theme?.emoji ?? "📖"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-bold text-ink">
                        {list.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">{theme?.name ?? list.subject}</p>
                    </div>
                    {typeof list.questionCount === "number" && (
                      <Badge color={theme?.hex ?? "#7c3aed"}>
                        <ListChecks className="mr-1 inline h-3.5 w-3.5" />
                        {list.questionCount}
                      </Badge>
                    )}
                    <span className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow transition-transform duration-200 group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4 text-lilac" strokeWidth={2.5} />
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink-soft">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-lilac/30 border-t-lilac" />
          <span className="text-sm font-semibold">Carregando...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <LandingPage />;
}
