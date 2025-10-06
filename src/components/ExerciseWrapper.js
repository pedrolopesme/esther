"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProgressBar from './ProgressBar';
import Button from './Button';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import FillGapExercise from './FillGapExercise';
import TrueFalseExercise from './TrueFalseExercise';
import { useSounds } from '../hooks/useSounds';
import { addPoints, subPoints } from '../utils/points';

export default function ExerciseWrapper({ exercises }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const { playCompletedSound } = useSounds();

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  useEffect(() => {
    // Calculate progress as percentage
    setProgress((currentExerciseIndex / totalExercises) * 100);
  }, [currentExerciseIndex, totalExercises]);

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
    setWrongAnswers([]);
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

          {/* Tabela de erros compacta */}
          {wrongAnswers.length > 0 && (
            <div className="text-left overflow-x-auto">
              <h3 className="text-lg font-bold mb-2">Erros cometidos</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[rgba(28,176,246,0.1)]">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Pergunta</th>
                    <th className="p-2 text-left">Sua resposta</th>
                    <th className="p-2 text-left">Correta</th>
                  </tr>
                </thead>
                <tbody>
                  {wrongAnswers.map((wa, idx) => (
                    <tr key={idx} className="border-t border-[var(--border-light)]">
                      <td className="p-2 align-top whitespace-nowrap">{wa.index + 1}</td>
                      <td className="p-2 align-top max-w-[320px]">
                        <div className="truncate" title={wa.question}>{wa.question}</div>
                      </td>
                      <td className="p-2 align-top">
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-white"
                          style={{ backgroundColor: '#dc2626' }}
                        >
                          {String(wa.selected)}
                        </span>
                      </td>
                      <td className="p-2 align-top">
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-white"
                          style={{ backgroundColor: '#16a34a' }}
                        >
                          {String(wa.correct)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
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
        ) : currentExercise.type === 'fill-gap' ? (
          <FillGapExercise
            question={currentExercise.question}
            options={currentExercise.options}
            correctIndex={currentExercise.correctIndex}
            onComplete={handleExerciseComplete}
            dica={currentExercise.dica}
            explicacao={currentExercise.explicacao}
            resposta_correta={currentExercise.resposta_correta}
          />
        ) : currentExercise.type === 'true-false' ? (
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
          <div className="duolingo-card text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Tipo de exercício não suportado</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Este tipo de exercício ainda não está implementado.
            </p>
            <Button 
              onClick={() => handleExerciseComplete(false)}
              className="w-full"
            >
              Pular para o próximo
            </Button>
          </div>
        )}
      </motion.div>
      
      <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
        Exercício {currentExerciseIndex + 1} de {totalExercises}
      </div>
    </div>
  );
}
