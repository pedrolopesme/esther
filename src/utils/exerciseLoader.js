"use client";

import { useState, useEffect } from "react";
import { getAvailableExerciseLists, getExerciseData } from "./exerciseRepository";

export function useExerciseData(subject, listId) {
  const [exerciseData, setExerciseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExerciseData() {
      try {
        setIsLoading(true);
        const data = await getExerciseData(subject, listId);
        if (!cancelled) {
          setExerciseData(data);
          setError(null);
        }
      } catch (err) {
        console.error("Erro ao carregar exercícios:", err);
        if (!cancelled) {
          setExerciseData(null);
          setError("Não foi possível carregar os exercícios. Por favor, tente novamente.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (subject && listId) {
      loadExerciseData();
    } else {
      setExerciseData(null);
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [subject, listId]);

  return { exerciseData, isLoading, error };
}

export { getAvailableExerciseLists };