"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, CheckCircle2, XCircle, Check, X } from "lucide-react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { cn } from "../utils/cn";
import { useSounds } from "../hooks/useSounds";

export default function TrueFalseExercise({
  question,
  options,
  correctIndex,
  onComplete,
  dica,
  explicacao,
  resposta_correta,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isCorrect = selectedIndex === correctIndex;
  const { playCorrectSound, playWrongSound } = useSounds();

  const handleOptionClick = (index) => {
    if (!hasSubmitted) setSelectedIndex(index);
  };

  const handleShowHint = () => setShowHint(true);

  const handleSubmit = () => {
    if (selectedIndex !== null && !hasSubmitted) {
      setHasSubmitted(true);
      if (isCorrect) playCorrectSound();
      else playWrongSound();

      setTimeout(() => {
        if (onComplete) {
          onComplete(isCorrect, {
            question,
            selectedIndex,
            selectedValue: options[selectedIndex],
            correctIndex,
            correctValue: options[correctIndex],
          });
        }
      }, 2500);
    }
  };

  const tfState = (index) => {
    const isTrue = options[index] === "Verdadeiro";
    const base = isTrue
      ? "border-mint/40 bg-mint-soft/60 text-[#05795b]"
      : "border-candy/40 bg-candy-soft/60 text-[#a62f5f]";
    if (selectedIndex === index && !hasSubmitted)
      return isTrue
        ? "border-mint bg-mint-soft text-[#05795b] -translate-y-1 shadow-[0_6px_0_#06d6a0]"
        : "border-candy bg-candy-soft text-[#a62f5f] -translate-y-1 shadow-[0_6px_0_#ff70a6]";
    if (hasSubmitted && index === correctIndex)
      return "border-mint bg-mint-soft text-[#05795b] shadow-[0_6px_0_#06d6a0]";
    if (hasSubmitted && selectedIndex === index && index !== correctIndex)
      return "border-candy bg-candy-soft text-[#a62f5f] shadow-[0_6px_0_#ff70a6]";
    return cn(base, "shadow-[0_5px_0_rgba(163,112,255,0.12)]");
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <div className="rounded-2xl bg-gradient-to-br from-lilac-soft/60 to-sky-soft/60 p-5">
        <h2 className="text-center font-display text-xl font-bold leading-snug text-ink sm:text-2xl">
          {question}
        </h2>
      </div>

      <AnimatePresence>
        {dica && showHint && (
          <motion.div
            className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-sun/40 bg-sun-soft p-4"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0 }}
          >
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#e8a81e]" strokeWidth={2.5} />
            <p className="font-semibold text-[#9c7415]">{dica}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="my-6 flex justify-center gap-4">
        {options.map((option, index) => {
          const isTrue = option === "Verdadeiro";
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(index)}
              disabled={hasSubmitted}
              className={cn(
                "press flex flex-1 max-w-[200px] flex-col items-center gap-2 rounded-[1.5rem] border-2 px-4 py-6 font-display text-lg font-bold active:translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lilac/30",
                hasSubmitted && "cursor-default",
                tfState(index),
              )}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/80 shadow-inner">
                {isTrue ? <Check className="h-6 w-6" strokeWidth={3} /> : <X className="h-6 w-6" strokeWidth={3} />}
              </span>
              {isTrue ? "Verdadeiro" : "Falso"}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {hasSubmitted && (
          <motion.div
            className={`mb-5 rounded-2xl border-2 p-4 ${
              isCorrect ? "border-mint/50 bg-mint-soft" : "border-candy/50 bg-candy-soft"
            }`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-mint" strokeWidth={2.5} />
              ) : (
                <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-candy" strokeWidth={2.5} />
              )}
              <div className={isCorrect ? "text-[#05795b]" : "text-[#a62f5f]"}>
                <p className="font-display font-bold">
                  {isCorrect
                    ? "Correto! Muito bem! 🎉"
                    : `Ops! A resposta certa é: ${resposta_correta || options[correctIndex]}`}
                </p>
                {explicacao && <p className="mt-1 text-sm font-medium opacity-90">{explicacao}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {dica && !hasSubmitted && !showHint && (
          <Button variant="sun" onClick={handleShowHint} className="shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4" strokeWidth={2.5} /> Dica
            </span>
          </Button>
        )}
        <Button
          variant="mint"
          onClick={handleSubmit}
          disabled={selectedIndex === null || hasSubmitted}
          className="flex-1"
        >
          {hasSubmitted ? "Verificado ✓" : "Verificar"}
        </Button>
      </div>
    </Card>
  );
}
