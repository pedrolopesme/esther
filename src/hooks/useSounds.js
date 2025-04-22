"use client";

import { useCallback, useEffect, useRef } from "react";

export function useSounds() {
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const completedSoundRef = useRef(null);
  
  useEffect(() => {
    // Initialize audio objects only on client-side
    correctSoundRef.current = new Audio("/duolingo-correct.mp3");
    wrongSoundRef.current = new Audio("/duolingo-wrong.mp3");
    completedSoundRef.current = new Audio("/duolingo-completed-lesson.mp3");
    
    // Preload sounds
    correctSoundRef.current.load();
    wrongSoundRef.current.load();
    completedSoundRef.current.load();
    
    // Cleanup on unmount
    return () => {
      if (correctSoundRef.current) {
        correctSoundRef.current.pause();
        correctSoundRef.current = null;
      }
      if (wrongSoundRef.current) {
        wrongSoundRef.current.pause();
        wrongSoundRef.current = null;
      }
      if (completedSoundRef.current) {
        completedSoundRef.current.pause();
        completedSoundRef.current = null;
      }
    };
  }, []);
  
  const playCorrectSound = useCallback(() => {
    if (correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0;
      correctSoundRef.current.play().catch(err => console.error("Error playing sound:", err));
    }
  }, []);
  
  const playWrongSound = useCallback(() => {
    if (wrongSoundRef.current) {
      wrongSoundRef.current.currentTime = 0;
      wrongSoundRef.current.play().catch(err => console.error("Error playing sound:", err));
    }
  }, []);
  
  const playCompletedSound = useCallback(() => {
    if (completedSoundRef.current) {
      completedSoundRef.current.currentTime = 0;
      completedSoundRef.current.play().catch(err => console.error("Error playing sound:", err));
    }
  }, []);
  
  return {
    playCorrectSound,
    playWrongSound,
    playCompletedSound
  };
}