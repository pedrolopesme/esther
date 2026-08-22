"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, GraduationCap, BookMarked, ListChecks } from "lucide-react";
import ExerciseWrapper from "./ExerciseWrapper";
import { useExerciseData } from "../utils/exerciseLoader";
import { getSubject } from "../utils/subjects";
import { cn } from "../utils/cn";
import Badge from "./ui/Badge";
import Sticker from "./ui/Sticker";

function BackLink({ subject, label = "Voltar" }) {
  return (
    <Link
      href={`/materias/${subject}`}
      className="press mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur hover:-translate-x-0.5 hover:text-lilac"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> {label}
    </Link>
  );
}

export default function ExerciseListClient({ subject, listId: listIdProp }) {
  const params = useParams();
  const listId = listIdProp || params.listId;
  const theme = getSubject(subject);
  const Icon = theme?.icon ?? BookMarked;

  const { exerciseData, isLoading, error } = useExerciseData(subject, listId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <span className="h-16 w-16 animate-spin rounded-full border-4 border-lilac/25 border-t-lilac" />
        <p className="mt-4 font-display font-semibold text-ink-soft">Carregando exercícios... 🎈</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <BackLink subject={subject} label="Voltar para a lista" />
        <div className="clay bg-candy-soft p-6 text-center">
          <div className="mb-2 text-4xl">😢</div>
          <h2 className="font-display text-xl font-bold text-[#a62f5f]">Erro ao carregar exercícios</h2>
          <p className="mt-1 text-ink-soft">{error}</p>
        </div>
      </div>
    );
  }

  if (!exerciseData) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <BackLink subject={subject} label="Voltar para a lista" />
        <div className="clay bg-sky-soft p-6 text-center">
          <div className="mb-2 text-4xl">🔍</div>
          <h2 className="font-display text-xl font-bold text-[#1e7fa6]">Lista não encontrada</h2>
          <p className="mt-1 text-ink-soft">A lista que você procura não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  const formattedDate = exerciseData.data ? new Date(exerciseData.data).toLocaleDateString("pt-BR") : "";
  const count = Array.isArray(exerciseData.exercises) ? exerciseData.exercises.length : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
      <BackLink subject={subject} />

      {/* Meta hero */}
      <motion.div
        className={cn("clay relative mb-8 overflow-hidden bg-gradient-to-br p-6 text-white sm:p-8", theme?.gradient)}
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <div className="bg-dots absolute inset-0 opacity-30" />
        <Sticker className="right-4 top-3 text-4xl" anim="float">{theme?.emoji}</Sticker>
        <div className="relative flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-white/95 shadow-lg">
            <Icon className="h-7 w-7" strokeWidth={2.3} style={{ color: theme?.hex }} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold drop-shadow-sm sm:text-3xl">{exerciseData.title}</h1>
            {exerciseData.description && (
              <p className="mt-1 text-white/90">{exerciseData.description}</p>
            )}
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Badge tone="neutral" icon={BookMarked} className="bg-white/90">{exerciseData.materia}</Badge>
          {exerciseData.ano_letivo && (
            <Badge tone="neutral" icon={GraduationCap} className="bg-white/90">{exerciseData.ano_letivo}</Badge>
          )}
          {formattedDate && (
            <Badge tone="neutral" icon={CalendarDays} className="bg-white/90">{formattedDate}</Badge>
          )}
          <Badge tone="neutral" icon={ListChecks} className="bg-white/90">{count} questões</Badge>
        </div>
      </motion.div>

      <ExerciseWrapper exercises={exerciseData.exercises} />
    </div>
  );
}
