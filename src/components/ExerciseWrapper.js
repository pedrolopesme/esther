"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProgressBar from './ProgressBar';
import Button from './Button';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import { useSounds } from '../hooks/useSounds';

export default function ExerciseWrapper({ exercises }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const { playCompletedSound } = useSounds();

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  useEffect(() => {
    // Calculate progress as percentage
    setProgress((currentExerciseIndex / totalExercises) * 100);
  }, [currentExerciseIndex, totalExercises]);

  const handleExerciseComplete = (isCorrect) => {
    if (isCorrect) {
      setScore(score + 1);
    }
    
    if (currentExerciseIndex < totalExercises - 1) {
      // Go to next exercise
      setTimeout(() => {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }, 1000);
    } else {
      // All exercises completed
      setCompleted(true);
      setProgress(100);
      // Play the completion sound when all exercises are done
      playCompletedSound();
    }
  };

  const handleReset = () => {
    setCurrentExerciseIndex(0);
    setProgress(0);
    setCompleted(false);
    setScore(0);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center">
        <ProgressBar progress={progress} className="mb-6" />
        
        <motion.div 
          className="duolingo-card text-center p-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4">Exercícios Completos!</h2>
          <p className="text-xl mb-6">
            Você acertou {score} de {totalExercises} questões.
          </p>
          
          <div className="text-6xl mb-8">
            {score === totalExercises ? '🎉' : score > totalExercises / 2 ? '👍' : '😢'}
          </div>
          
          <div className="mb-6 p-4 rounded-lg bg-[rgba(88,204,2,0.1)]">
            <p className="font-medium">
              {score === totalExercises 
                ? "Parabéns! Você acertou todas as questões!" 
                : score > totalExercises / 2 
                  ? "Bom trabalho! Continue praticando para melhorar ainda mais." 
                  : "Continue praticando! Você vai melhorar."}
            </p>
          </div>
          
          <Button onClick={handleReset}>Tentar Novamente</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ProgressBar progress={progress} className="mb-6" />
      
      <motion.div
        key={currentExerciseIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4 }}
      >
        {currentExercise.type === 'multiple-choice' ? (
          <MultipleChoiceExercise
            question={currentExercise.question}
            options={currentExercise.options}
            correctIndex={currentExercise.correctIndex}
            onComplete={handleExerciseComplete}
            dica={currentExercise.dica}
            explicacao={currentExercise.explicacao}
            resposta_correta={currentExercise.resposta_correta}
          />
        ) : (
          <div>Tipo de exercício não suportado</div>
        )}
      </motion.div>
      
      <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
        Exercício {currentExerciseIndex + 1} de {totalExercises}
      </div>
    </div>
  );
}