"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Trophy, Star, ChevronRight, ChevronLeft } from "lucide-react";
import MultipleChoiceExercise from "./MultipleChoiceExercise";
import FillGapExercise from "./FillGapExercise";
import TrueFalseExercise from "./TrueFalseExercise";
import ProgressBar from "./ui/ProgressBar";
import Button from "./ui/Button";

export default function ExerciseDrawer({ list, onClose }) {
  const exercises = list.exercises || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  const current = exercises[currentIndex];
  const total = exercises.length;

  function handleComplete(isCorrect, details) {
    setLocked(true);
    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      setWrongAnswers((prev) => [...prev, { index: currentIndex, ...details }]);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= total) {
      setCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setLocked(false);
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setScore(0);
    setLocked(false);
    setCompleted(false);
    setWrongAnswers([]);
  }

  const progress = completed ? 100 : (currentIndex / total) * 100;

  function renderExercise(ex) {
    const common = {
      onComplete: handleComplete,
      dica: ex.dica,
      explicacao: ex.explicacao,
      resposta_correta: ex.resposta_correta,
    };

    switch (ex.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceExercise
            question={ex.question}
            options={ex.options}
            correctIndex={ex.correctIndex}
            {...common}
          />
        );
      case "fill-gap":
        return (
          <FillGapExercise
            question={ex.question}
            options={ex.options}
            correctIndex={ex.correctIndex}
            {...common}
          />
        );
      case "true-false":
        return (
          <TrueFalseExercise
            question={ex.question}
            options={ex.options}
            correctIndex={ex.correctIndex}
            {...common}
          />
        );
      default:
        return (
          <div className="rounded-xl bg-[#FFE3F0] p-4 text-sm font-semibold text-[#a62f5f]">
            Tipo desconhecido: {ex.type}
          </div>
        );
    }
  }

  function renderCompleted() {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const good = pct >= 70;

    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="text-6xl">{good ? "🏆" : "📝"}</div>
        <h2 className="font-display text-2xl font-bold text-ink">
          {good ? "Parabéns!" : "Continue praticando!"}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-[#FFD166] text-[#FFD166]" />
            <span className="font-display text-3xl font-bold text-ink">
              {score}/{total}
            </span>
          </div>
          <span className="rounded-full bg-[#EEE6FF] px-3 py-1 text-sm font-bold text-[#A370FF]">
            {pct}%
          </span>
        </div>

        {wrongAnswers.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            <p className="text-sm font-bold text-ink">Erros para revisar:</p>
            {wrongAnswers.map((wa, i) => (
              <div key={i} className="rounded-lg bg-[#FFE3F0] p-3 text-left">
                <p className="text-xs font-semibold text-ink line-clamp-2">
                  {exercises[wa.index]?.question}
                </p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  Resposta correta: <strong>{wa.resposta_correta}</strong>
                </p>
              </div>
            ))}
          </div>
        )}

        <Button variant="lilac" size="md" onClick={handleReset}>
          <span className="flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Jogar novamente
          </span>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <motion.div
        className="relative z-10 flex h-full w-full max-w-xl flex-col bg-cream shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-lilac/10 bg-white/60 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-ink truncate">
              {list.title}
            </h2>
            <p className="text-xs text-ink-soft">
              {total} exercício{total !== 1 && "s"} &middot; Pré-visualização
            </p>
          </div>
          <div className="flex items-center gap-2">
            {score > 0 && !completed && (
              <span className="flex items-center gap-1 rounded-full bg-[#FFF3D6] px-2 py-0.5 text-xs font-bold text-[#E8A81E]">
                <Star className="h-3 w-3 fill-[#FFD166] text-[#FFD166]" />
                {score}/{total}
              </span>
            )}
            <button
              onClick={onClose}
              className="press rounded-full bg-white/70 p-2 shadow-sm hover:bg-candy/10 hover:text-[#FF70A6] transition"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-3">
          <ProgressBar progress={progress} />
          {!completed && (
            <p className="mt-1 text-center text-xs text-ink-soft">
              Exercício {currentIndex + 1} de {total}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {completed ? (
              <motion.div
                key="completed"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                {renderCompleted()}
              </motion.div>
            ) : (
              <motion.div
                key={`ex-${currentIndex}`}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {current && renderExercise(current)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        {!completed && (
          <div className="flex items-center justify-between gap-3 border-t border-lilac/10 bg-white/60 px-5 py-4">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex((i) => i - 1);
                  setLocked(false);
                }
              }}
              disabled={currentIndex === 0}
              className="press flex items-center gap-1 rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-ink shadow-sm hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <Button
              variant="lilac"
              size="md"
              onClick={handleNext}
              disabled={!locked && currentIndex < total}
            >
              <span className="flex items-center gap-1.5">
                {currentIndex + 1 >= total ? "Finalizar" : "Próximo"}
                <ChevronRight className="h-4 w-4" />
              </span>
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}