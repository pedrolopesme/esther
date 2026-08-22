"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Option from "./ui/Option";
import { useSounds } from "../hooks/useSounds";

export default function FillGapExercise({
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

  // Render the sentence with a highlighted gap / chosen word.
  const chosen = selectedIndex !== null ? options[selectedIndex] : null;
  const parts = question.split("____");

  return (
    <Card className="mx-auto max-w-2xl">
      <div className="rounded-2xl bg-gradient-to-br from-lilac-soft/60 to-sky-soft/60 p-5">
        <h2 className="text-center font-display text-xl font-bold leading-snug text-ink sm:text-2xl">
          {parts[0]}
          <span
            className={`mx-1 inline-block min-w-[3rem] rounded-xl border-b-4 px-2 py-0.5 align-middle ${
              chosen
                ? "border-lilac bg-white text-lilac"
                : "border-dashed border-lilac/50 bg-white/60 text-transparent"
            }`}
          >
            {chosen ?? "___"}
          </span>
          {parts[1]}
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

      <div className="my-6 space-y-3">
        {options.map((option, index) => (
          <Option
            key={index}
            selected={selectedIndex === index}
            correct={hasSubmitted && index === correctIndex}
            incorrect={hasSubmitted && selectedIndex === index && selectedIndex !== correctIndex}
            locked={hasSubmitted}
            onClick={() => handleOptionClick(index)}
          >
            {option}
          </Option>
        ))}
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
