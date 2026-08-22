"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { RotateCcw, Trophy, Star, Sparkles } from "lucide-react";
import ProgressBar from "./ui/ProgressBar";
import Button from "./ui/Button";
import MultipleChoiceExercise from "./MultipleChoiceExercise";
import FillGapExercise from "./FillGapExercise";
import TrueFalseExercise from "./TrueFalseExercise";
import { useSounds } from "../hooks/useSounds";
import { addPoints, subPoints } from "../utils/points";
import { useExerciseTracker } from "../hooks/useExerciseTracker";

function celebrate() {
  const colors = ["#FF70A6", "#A370FF", "#FFD166", "#06D6A0", "#4CC9F0", "#FF9770"];
  const fire = (particleRatio, opts) =>
    confetti({
      origin: { y: 0.7 },
      colors,
      disableForReducedMotion: true,
      particleCount: Math.floor(200 * particleRatio),
      ...opts,
    });
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export default function ExerciseWrapper({ exercises, subject, slug, title }) {
  const tracker = useExerciseTracker({ subject, slug, title, total: exercises.length });
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const { playCompletedSound } = useSounds();

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  useEffect(() => {
    setProgress((currentExerciseIndex / totalExercises) * 100);
  }, [currentExerciseIndex, totalExercises]);

  // Celebrate great results when the quiz completes.
  useEffect(() => {
    if (completed && score > totalExercises / 2) {
      celebrate();
    }
  }, [completed, score, totalExercises]);

  const handleExerciseComplete = (isCorrect, details) => {
    if (isCorrect) {
      setScore(score + 1);
      addPoints(10);
    } else {
      subPoints(5);
      if (details) {
        setWrongAnswers((prev) => [
          ...prev,
          {
            index: currentExerciseIndex,
            question: details.question,
            selected: details.selectedValue,
            correct: details.correctValue,
          },
        ]);
      }
    }

    // Record answer for session tracking
    tracker.recordAnswer(isCorrect, {
      id: currentExercise?.id,
      question: details?.question || currentExercise?.question || "",
      selectedValue: isCorrect ? undefined : details?.selectedValue,
      correctValue: isCorrect ? undefined : details?.correctValue,
    });

    if (currentExerciseIndex < totalExercises - 1) {
      setTimeout(() => {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }, 1000);
    } else {
      setCompleted(true);
      setProgress(100);
      playCompletedSound();
      const netPoints = (score + (isCorrect ? 1 : 0)) * 10;
      tracker.finish(netPoints).catch(() => {});
    }
  };

  const handleReset = () => {
    setCurrentExerciseIndex(0);
    setProgress(0);
    setCompleted(false);
    setScore(0);
    setWrongAnswers([]);
  };

  if (completed) {
    const perfect = score === totalExercises;
    const good = score > totalExercises / 2;
    const emoji = perfect ? "🏆" : good ? "🌟" : "🌱";
    const message = perfect
      ? "Parabéns! Você acertou tudo! Você é uma estrela! ⭐"
      : good
        ? "Muito bem! Continue praticando para ficar craque!"
        : "Continue tentando! Cada erro é um passo para aprender. 💪";

    return (
      <div className="flex flex-col items-center">
        <ProgressBar progress={100} className="mb-6" />

        <motion.div
          className="clay w-full max-w-2xl overflow-hidden p-0 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          {/* Trophy header */}
          <div className="relative bg-gradient-to-br from-candy via-lilac to-sky px-6 py-8 text-white">
            <div className="bg-dots absolute inset-0 opacity-30" />
            <motion.div
              className="relative text-7xl"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.15 }}
            >
              {emoji}
            </motion.div>
            <h2 className="relative mt-2 font-display text-3xl font-bold drop-shadow">Missão concluída!</h2>
          </div>

          <div className="px-6 py-7">
            {/* Score */}
            <div className="mx-auto mb-5 inline-flex items-center gap-3 rounded-full bg-sun-soft px-6 py-3 shadow-inner">
              <Trophy className="h-7 w-7 fill-sun text-[#e8a81e]" strokeWidth={1.5} />
              <span className="font-display text-2xl font-bold text-ink">
                {score} <span className="text-ink-soft">/ {totalExercises}</span>
              </span>
            </div>

            <p className="mb-6 font-display text-lg font-semibold text-ink">{message}</p>

            {/* Stars earned */}
            <div className="mb-6 flex items-center justify-center gap-1">
              {Array.from({ length: totalExercises }).map((_, i) => (
                <Star
                  key={i}
                  className={i < score ? "h-6 w-6 fill-sun text-sun" : "h-6 w-6 text-lilac/25"}
                  strokeWidth={1.5}
                />
              ))}
            </div>

            {/* Wrong answers */}
            {wrongAnswers.length > 0 && (
              <div className="mb-6 overflow-hidden rounded-2xl border-2 border-lilac/15 text-left">
                <div className="flex items-center gap-2 bg-lilac-soft px-4 py-2.5 font-display font-bold text-[#6b3fc0]">
                  <Sparkles className="h-4 w-4" strokeWidth={2.5} /> Vamos revisar juntas
                </div>
                <div className="divide-y divide-lilac/10">
                  {wrongAnswers.map((wa, idx) => (
                    <div key={idx} className="px-4 py-3">
                      <p className="mb-1.5 text-sm font-semibold text-ink" title={wa.question}>
                        <span className="mr-1 text-ink-soft">#{wa.index + 1}</span>
                        {wa.question}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-candy-soft px-2.5 py-1 text-[#a62f5f]">
                          Você: {String(wa.selected)}
                        </span>
                        <span className="rounded-full bg-mint-soft px-2.5 py-1 text-[#05795b]">
                          Certo: {String(wa.correct)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleReset} variant="lilac" size="lg" className="w-full">
              <span className="inline-flex items-center justify-center gap-2">
                <RotateCcw className="h-5 w-5" strokeWidth={2.5} /> Jogar de novo
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex w-full max-w-2xl items-center justify-between px-1">
        <span className="font-display text-sm font-bold text-ink-soft">
          Exercício {currentExerciseIndex + 1} de {totalExercises}
        </span>
        <span className="inline-flex items-center gap-1 font-display text-sm font-bold text-mint">
          <Star className="h-4 w-4 fill-sun text-sun" strokeWidth={1.5} /> {score}
        </span>
      </div>
      <ProgressBar progress={progress} className="mb-6 max-w-2xl" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentExerciseIndex}
          className="w-full"
          initial={{ opacity: 0, x: 60, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {currentExercise.type === "multiple-choice" ? (
            <MultipleChoiceExercise
              question={currentExercise.question}
              options={currentExercise.options}
              correctIndex={currentExercise.correctIndex}
              onComplete={handleExerciseComplete}
              dica={currentExercise.dica}
              explicacao={currentExercise.explicacao}
              resposta_correta={currentExercise.resposta_correta}
            />
          ) : currentExercise.type === "fill-gap" ? (
            <FillGapExercise
              question={currentExercise.question}
              options={currentExercise.options}
              correctIndex={currentExercise.correctIndex}
              onComplete={handleExerciseComplete}
              dica={currentExercise.dica}
              explicacao={currentExercise.explicacao}
              resposta_correta={currentExercise.resposta_correta}
            />
          ) : currentExercise.type === "true-false" ? (
            <TrueFalseExercise
              question={currentExercise.question}
              options={currentExercise.options}
              correctIndex={currentExercise.correctIndex}
              onComplete={handleExerciseComplete}
              dica={currentExercise.dica}
              explicacao={currentExercise.explicacao}
              resposta_correta={currentExercise.resposta_correta}
            />
          ) : (
            <div className="clay mx-auto max-w-2xl p-8 text-center">
              <div className="mb-3 text-4xl">🚧</div>
              <h2 className="mb-2 font-display text-xl font-bold text-ink">
                Tipo de exercício não suportado
              </h2>
              <p className="mb-6 text-ink-soft">Este tipo de exercício ainda não está implementado.</p>
              <Button onClick={() => handleExerciseComplete(false)} variant="sky" className="w-full">
                Pular para o próximo
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
