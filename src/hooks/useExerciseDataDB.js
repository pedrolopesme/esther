"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "../utils/supabase";

/**
 * Hook para carregar dados de exercícios do Supabase
 * @param {string} subject - Nome da matéria (ex: "matematica")
 * @param {string} listId - ID da lista (slug, ex: "revisao")
 * @returns {Object} Objeto contendo dados de exercício e status de carregamento
 */
export function useExerciseDataDB(subject, listId) {
  const [exerciseData, setExerciseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function loadExerciseData() {
      try {
        setIsLoading(true);
        setError(null);

        // Buscar a lista de exercícios pelo slug
        const { data, error: fetchError } = await supabase
          .from("exercise_lists")
.select("*, grade_levels(name, stage)")
          .eq("subject", subject)
          .eq("slug", listId)
          .single();

        if (fetchError) {
          throw new Error(`Falha ao carregar exercícios: ${fetchError.message}`);
        }

        if (!data) {
          throw new Error("Lista de exercícios não encontrada");
        }

        // Transformar dados para o formato esperado pelo frontend
        const exerciseList = {
          nome: data.title,
          title: data.title,
          description: data.description,
materia: data.materia || subject,
          grade_level_id: data.grade_level_id,
          grade_level_name: data.grade_levels?.name || "",
          grade_level_stage: data.grade_levels?.stage || "",
          data: data.exercise_date,
          exercises: data.exercises || [],
        };

        setExerciseData(exerciseList);
      } catch (err) {
        setError(err.message);
        console.error("Erro ao carregar exercícios do DB:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (subject && listId) {
      loadExerciseData();
    }
  }, [subject, listId, supabase]);

  return { exerciseData, isLoading, error };
}

/**
 * Hook para carregar lista de exercícios disponíveis para uma matéria
 * @param {string} subject - Nome da matéria (ex: "matematica")
 * @returns {Object} Objeto contendo lista de exercícios e status
 */
export function useAvailableExerciseListsDB(subject) {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function loadLists() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("exercise_lists")
          .select("id, slug, title, description, exercise_date, question_count")
          .eq("subject", subject)
          .eq("published", true)
          .order("exercise_date", { ascending: false });

        if (fetchError) {
          throw new Error(`Falha ao carregar listas: ${fetchError.message}`);
        }

        setLists(
          data.map((list) => ({
            id: list.slug,
            title: list.title,
            description: list.description,
            date: list.exercise_date,
            questionCount: list.question_count || 0,
          }))
        );
      } catch (err) {
        setError(err.message);
        console.error("Erro ao carregar listas do DB:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (subject) {
      loadLists();
    }
  }, [subject, supabase]);

  return { lists, isLoading, error };
}
