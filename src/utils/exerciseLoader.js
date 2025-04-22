"use client";

import { useState, useEffect } from 'react';

/**
 * Hook para carregar dados de exercícios do diretório de dados
 * @param {string} subject - Nome da matéria (ex: "matematica")
 * @param {string} listId - ID da lista de exercícios (ex: "adicao")
 * @returns {Object} Objeto contendo dados de exercício e status de carregamento
 */
export function useExerciseData(subject, listId) {
  const [exerciseData, setExerciseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadExerciseData() {
      try {
        setIsLoading(true);
        
        // Constrói o caminho do arquivo JSON
        const response = await fetch(`/api/exercises?subject=${subject}&listId=${listId}`);
        
        if (!response.ok) {
          throw new Error(`Falha ao carregar exercícios: ${response.status}`);
        }
        
        const data = await response.json();
        setExerciseData(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar exercícios:", err);
        setError("Não foi possível carregar os exercícios. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }

    if (subject && listId) {
      loadExerciseData();
    }
  }, [subject, listId]);

  return { exerciseData, isLoading, error };
}

/**
 * Função para carregar todas as listas de exercícios disponíveis para uma matéria
 * @param {string} subject - Nome da matéria (ex: "matematica")
 * @returns {Promise<Array>} Lista de exercícios disponíveis
 */
export async function getAvailableExerciseLists(subject) {
  try {
    const response = await fetch(`/api/exercise-lists?subject=${subject}`);
    
    if (!response.ok) {
      throw new Error(`Falha ao carregar listas: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error("Erro ao carregar listas de exercícios:", err);
    return [];
  }
}