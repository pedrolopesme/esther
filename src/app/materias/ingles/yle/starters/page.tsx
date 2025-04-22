"use client";
import React, { useState } from 'react';
import styles from './page.module.css';

interface Question {
  prompt: string;
  options: string[];
  answer: number;
}

const questions: Question[] = [
  { prompt: 'What color is the sky?', options: ['Blue', 'Green', 'Red'], answer: 0 },
  { prompt: 'Which one is a cat?', options: ['🐱', '🐶', '🐰'], answer: 0 },
  { prompt: 'What number is this: 5?', options: ['3', '5', '7'], answer: 1 },
  { prompt: 'Which one is an apple?', options: ['🍎', '🍌', '🍉'], answer: 0 },
  { prompt: 'What is the color of this heart? ❤️', options: ['Pink', 'Red', 'Yellow'], answer: 1 },
  { prompt: 'How many legs does a dog have?', options: ['2', '4', '6'], answer: 1 },
  { prompt: 'Which one is a triangle?', options: ['🔺', '🔵', '◼️'], answer: 0 },
  { prompt: 'What do you say when you meet someone in the morning?', options: ['Good night', 'Hello', 'Good morning'], answer: 2 },
  { prompt: 'What is this? 🐶', options: ['dog', 'cat', 'bird'], answer: 0 },
  { prompt: 'What is this? 🐱', options: ['cat', 'dog', 'fish'], answer: 0 },
  { prompt: 'What color is grass?', options: ['Green', 'Blue', 'Pink'], answer: 0 },
  { prompt: "What is the opposite of 'big'?", options: ['small', 'happy', 'fast'], answer: 0 },
  { prompt: "Which animal says 'meow'?", options: ['dog', 'cat', 'cow'], answer: 1 },
  { prompt: 'What do you use to write?', options: ['book', 'pencil', 'eraser'], answer: 1 },
  { prompt: 'Which one is a fruit?', options: ['🔑', '🍌', '🚗'], answer: 1 },
  { prompt: 'What comes after three?', options: ['two', 'four', 'five'], answer: 1 },
  { prompt: 'Which one is a vehicle? 🚗', options: ['car', 'dog', 'apple'], answer: 0 },
  { prompt: 'How many days are there in a week?', options: ['5', '7', '10'], answer: 1 },
  { prompt: 'Which one is for sleeping? 🛏️', options: ['bed', 'chair', 'plate'], answer: 0 },
  { prompt: 'What color is this flower? 🌸', options: ['Pink', 'Blue', 'Yellow'], answer: 0 },
  { prompt: 'Which one is a number?', options: ['A', 'B', '3'], answer: 2 },
  { prompt: "What is the first letter of the word 'apple'?", options: ['A', 'B', 'C'], answer: 0 },
  { prompt: 'Which one flies? 🐦', options: ['bird', 'fish', 'dog'], answer: 0 },
  { prompt: 'How do you feel? 😊', options: ['happy', 'angry', 'sad'], answer: 0 },
  { prompt: 'What do you wear on your feet?', options: ['socks', 'hat', 'shirt'], answer: 0 },
  { prompt: 'Which one is cold? ☕️ 🍦', options: ['coffee', 'ice cream'], answer: 1 },
  { prompt: 'What sound does a cow make?', options: ['moo', 'oink', 'baa'], answer: 0 },
  { prompt: 'Which one is a fruit? 🍌', options: ['banana', 'carrot', 'drumstick'], answer: 0 },
  { prompt: 'What is the color of the sun?', options: ['Yellow', 'Green', 'Purple'], answer: 0 },
  { prompt: 'What do you say before you eat?', options: ['goodbye', 'thank you', "let's eat"], answer: 2 }
];

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
  };

  const handleNext = () => {
    if (selectedOption === null) {
      alert('Please select an option!');
      return;
    }
    if (selectedOption === questions[currentQuestion].answer) {
      setScore(score + 1);
    }
    setSelectedOption(null);
    const next = currentQuestion + 1;
    if (next < questions.length) {
      setCurrentQuestion(next);
    } else {
      setShowScore(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
    setShowScore(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {showScore ? (
          <div className={styles.score_section}>
            <div className={styles.score_text}>
              Congratulations!<br />
              You scored {score} out of {questions.length}!
            </div>
            <button className={styles.restart_button} onClick={handleRestart}>
              Restart Quiz
            </button>
          </div>
        ) : (
          <>
            <div className={styles.question_count}>
              Question {currentQuestion + 1}/{questions.length}
            </div>
            <div className={styles.question_text}>
              {questions[currentQuestion].prompt}
            </div>
            <ul className={styles.options}>
              {questions[currentQuestion].options.map((option, idx) => (
                <li key={idx} className={styles.option}>
                  <button
                    className={selectedOption === idx ? styles.selected : ''}
                    onClick={() => handleOptionClick(idx)}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
            <button className={styles.next_button} onClick={handleNext}>
              {currentQuestion + 1 === questions.length ? 'See Score' : 'Next'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}