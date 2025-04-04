
"use client"

import React, { useState } from 'react';
import { CharacterSelection, MinecraftButton, ResultScreen } from './MinecraftComponents';
import { Questions } from './Questions';
import { ProgressBar } from './ProgressBar';

export default function MathQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState(Array(Questions.length).fill(null));
  const [character, setCharacter] = useState('steve');
  const [gameStarted, setGameStarted] = useState(false);
  const [diamonds, setDiamonds] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Sound effects
  const playCorrectSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/correct.mp3');
      audio.play().catch(e => console.log('Audio error:', e));
    }
  };

  const playWrongSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/wrong.mp3');
      audio.play().catch(e => console.log('Audio error:', e));
    }
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    const correct = Questions[currentQuestion].correctAnswer === answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
      setDiamonds(diamonds + Math.floor(Math.random() * 3) + 1);
      playCorrectSound();
    } else {
      playWrongSound();
    }

    setShowFeedback(true);
    
    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestion < Questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResults(true);
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setAnswers(Array(Questions.length).fill(null));
    setShowResults(false);
    setDiamonds(0);
  };

  const startGame = (selectedCharacter:string) => {
    setCharacter(selectedCharacter);
    setGameStarted(true);
  };

  if (!gameStarted) {
    return <CharacterSelection onSelect={startGame} />;
  }

  if (showResults) {
    return <ResultScreen score={score} totalQuestions={Questions.length} diamonds={diamonds} character={character} onRestart={restartQuiz} />;
  }

  const progress = ((currentQuestion + 1) / Questions.length) * 100;
  const currentQuestionData = Questions[currentQuestion];

  return (
    <div className="bg-green-800 min-h-screen p-4 font-minecraft">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 bg-opacity-80 rounded-lg p-6 shadow-lg border-4 border-gray-900">
          <div className="flex justify-between items-center mb-4">
            <div className="text-white font-bold text-2xl">Quiz de Matemática</div>
            <div className="flex items-center gap-2">
              <img src="/images/diamond.png" alt="Diamantes" className="w-8 h-8" />
              <span className="text-white font-bold">{diamonds}</span>
            </div>
          </div>

          <ProgressBar progress={progress} />

          <div className="mt-6 bg-gray-700 p-4 rounded-lg border-2 border-gray-600">
            <div className="text-white text-xl mb-4">Questão {currentQuestion + 1} de {Questions.length}</div>
            
            {showFeedback ? (
              <div className={`p-4 rounded-lg mb-8 text-center text-xl ${isCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
                {isCorrect ? 'Correto!' : 'Ops! Tente novamente na próxima questão.'}
              </div>
            ) : (
              <div className="mb-8">
                <div className="text-white text-lg mb-4">{currentQuestionData.question}</div>
                
                {currentQuestionData.type === 'multiple-choice' && (
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestionData.options.map((option, index) => (
                      <MinecraftButton
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="text-left"
                      >
                        {option}
                      </MinecraftButton>
                    ))}
                  </div>
                )}
                
                {currentQuestionData.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-3">
                    <MinecraftButton onClick={() => handleAnswer('Verdadeiro')}>
                      Verdadeiro
                    </MinecraftButton>
                    <MinecraftButton onClick={() => handleAnswer('Falso')}>
                      Falso
                    </MinecraftButton>
                  </div>
                )}
                
                {currentQuestionData.type === 'fill-blank' && (
                  <div className="flex flex-col gap-3">
                    {currentQuestionData.options.map((option, index) => (
                      <MinecraftButton
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="text-left"
                      >
                        {option}
                      </MinecraftButton>
                    ))}
                  </div>
                )}
                
                {currentQuestionData.type === 'matching' && (
                  <div className="flex flex-col gap-3">
                    {currentQuestionData.options.map((option, index) => (
                      <MinecraftButton
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="text-left"
                      >
                        {option}
                      </MinecraftButton>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}