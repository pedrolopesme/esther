"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import Question from './Question';
import OptionCard from './OptionCard';
import Button from './Button';
import Feedback from './Feedback';
import ExerciseContainer from './ExerciseContainer';
import { useSounds } from '../hooks/useSounds';

export default function FillGapExercise({
  question,
  options,
  correctIndex,
  onComplete,
  dica,
  explicacao,
  resposta_correta
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isCorrect = selectedIndex === correctIndex;
  const { playCorrectSound, playWrongSound } = useSounds();

  const handleOptionClick = (index) => {
    if (!hasSubmitted) {
      setSelectedIndex(index);
    }
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  const handleSubmit = () => {
    if (selectedIndex !== null && !hasSubmitted) {
      setHasSubmitted(true);
      if (isCorrect) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
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

  const filledSentence = question.replace('____', selectedIndex !== null ? options[selectedIndex] : '____');

  return (
    <ExerciseContainer>
      <Card>
        <Question>{filledSentence}</Question>

        {dica && showHint && (
          <motion.div
            className="bg-[rgba(255,200,0,0.1)] p-4 my-4 rounded-lg border-l-4 border-[var(--secondary)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-medium">💡 Dica: {dica}</p>
          </motion.div>
        )}

        <div className="space-y-3 my-6">
          {options.map((option, index) => (
            <OptionCard
              key={index}
              selected={selectedIndex === index}
              correct={hasSubmitted && index === correctIndex}
              incorrect={hasSubmitted && selectedIndex === index && selectedIndex !== correctIndex}
              onClick={() => handleOptionClick(index)}
            >
              {option}
            </OptionCard>
          ))}
        </div>

        {hasSubmitted && (
          <Feedback correct={isCorrect}>
            {isCorrect ? (
              <>
                <span className="font-bold">Correto! Muito bem! 🎉</span>
                {explicacao && <p className="mt-2">{explicacao}</p>}
              </>
            ) : (
              <>
                <span className="font-bold">
                  Incorreto. A resposta correta é: {resposta_correta || options[correctIndex]}
                </span>
                {explicacao && <p className="mt-2">{explicacao}</p>}
              </>
            )}
          </Feedback>
        )}

        <div className="mt-6 flex justify-between items-center">
          {dica && !hasSubmitted && !showHint && (
            <button
              onClick={handleShowHint}
              className="text-[var(--blue)] hover:underline font-medium"
            >
              Mostrar Dica
            </button>
          )}

          <div className={dica && !hasSubmitted && !showHint ? "" : "w-full"}>
            <Button
              onClick={handleSubmit}
              disabled={selectedIndex === null || hasSubmitted}
              className="w-full"
            >
              {hasSubmitted ? 'Verificado' : 'Verificar'}
            </Button>
          </div>
        </div>
      </Card>
    </ExerciseContainer>
  );
}
