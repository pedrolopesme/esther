"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CalendarDays, ListChecks, ArrowRight, Wand2 } from "lucide-react";
import { getLatestExerciseLists } from "../utils/exerciseRepository";
import { SUBJECTS, getSubject } from "../utils/subjects";
import SubjectCard from "../components/SubjectCard";
import Badge from "../components/ui/Badge";
import Sticker from "../components/ui/Sticker";

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

export default function Home() {
  const [latestLists, setLatestLists] = useState([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [latestError, setLatestError] = useState(null);

  useEffect(() => {
    async function fetchLatest() {
      try {
        setIsLoadingLatest(true);
        const data = await getLatestExerciseLists();
        setLatestLists(data);
        setLatestError(null);
      } catch (e) {
        console.error(e);
        setLatestError("Não foi possível carregar as últimas listas.");
      } finally {
        setIsLoadingLatest(false);
      }
    }
    fetchLatest();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:pt-12">
      {/* ---------- Hero ---------- */}
      <section className="relative mb-14 text-center">
        <Sticker className="left-2 top-0 text-4xl sm:left-10" anim="float">⭐</Sticker>
        <Sticker className="right-2 top-4 text-4xl sm:right-12" anim="float-slow">🌈</Sticker>
        <Sticker className="left-8 bottom-0 text-3xl" anim="wiggle">☁️</Sticker>
        <Sticker className="right-10 bottom-2 text-3xl" anim="bob">✏️</Sticker>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-lilac shadow-sm backdrop-blur">
            <Wand2 className="h-4 w-4" strokeWidth={2.5} /> Aventura de estudos
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
            <span className="text-gradient">Vamos estudar juntas!</span>
            <span className="ml-2 inline-block anim-wiggle">✨</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
            🌟 Escolha uma matéria, resolva desafios super divertidos e colecione
            estrelinhas para subir de nível! 🚀
          </p>
        </motion.div>
      </section>

      {/* ---------- Subject grid ---------- */}
      <section className="mb-16">
        <motion.h2
          className="mb-6 flex items-center justify-center gap-2 font-display text-2xl font-bold text-ink"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="anim-bob">💖</span> Escolha sua matéria favorita
          <span className="anim-bob">💖</span>
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={gridVariants}
          initial="hidden"
          animate="show"
        >
          {SUBJECTS.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </motion.div>
      </section>

      {/* ---------- Latest lists ---------- */}
      <section>
        <motion.h2
          className="mb-6 flex items-center gap-2 font-display text-2xl font-bold text-ink"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-sky to-lilac text-white shadow-md">
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          </span>
          Novidades fresquinhas
        </motion.h2>

        {isLoadingLatest && (
          <div className="flex justify-center p-10">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-lilac/25 border-t-lilac" />
          </div>
        )}

        {latestError && (
          <div className="clay-sm bg-candy-soft p-4 text-center font-semibold text-[#a62f5f]">
            {latestError}
          </div>
        )}

        {!isLoadingLatest && !latestError && (
          <motion.div
            className="grid gap-3"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {latestLists.map((item) => {
              const subject = getSubject(item.subject);
              const Icon = subject?.icon ?? ListChecks;
              return (
                <motion.div key={`${item.subject}-${item.id}`} variants={rowVariants}>
                  <Link
                    href={`/materias/${item.subject}/lista?listId=${encodeURIComponent(item.id)}`}
                    className="clay group flex items-center gap-4 p-4 transition-transform duration-200 hover:-translate-y-1"
                  >
                    <span
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-md"
                      style={{ backgroundColor: subject?.hex ?? "#A370FF" }}
                    >
                      <Icon className="h-7 w-7" strokeWidth={2.2} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-base font-bold text-ink sm:text-lg">
                        {item.title}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge tone={subject?.color ?? "lilac"}>{item.materia}</Badge>
                        <Badge tone="sky" icon={CalendarDays}>
                          {new Date(item.date).toLocaleDateString("pt-BR")}
                        </Badge>
                        <Badge tone="mint" icon={ListChecks}>
                          {item.questionCount} questões
                        </Badge>
                      </div>
                    </div>

                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white shadow transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color: subject?.hex ?? "#A370FF" }}
                    >
                      <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
