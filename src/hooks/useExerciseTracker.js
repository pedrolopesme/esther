"use client";

import { useRef, useCallback } from "react";
import { useAuth } from "./useAuth";

/**
 * Tracks exercise session metrics and persists to Supabase on completion.
 *
 * Usage:
 *   const tracker = useExerciseTracker({ subject, slug, title, total });
 *   tracker.recordAnswer(isCorrect, details);
 *   await tracker.finish(pointsEarned);
 */
export function useExerciseTracker({ subject, slug, title, total }) {
  const { user, child, supabase } = useAuth();
  const startedAt = useRef(Date.now());
  const correct = useRef(0);
  const wrong = useRef(0);
  const wrongDetails = useRef([]);
  const saved = useRef(false);

  const recordAnswer = useCallback(
    (isCorrect, details) => {
      if (isCorrect) {
        correct.current += 1;
      } else {
        wrong.current += 1;
        wrongDetails.current.push({
          questionId: details?.id ?? null,
          question: details?.question ?? "",
          selected: details?.selectedValue ?? null,
          correct: details?.correctValue ?? null,
        });
      }
    },
    [],
  );

  const finish = useCallback(
    async (pointsEarned = 0) => {
      if (saved.current) return; // guard against double-submit
      saved.current = true;

      // Don't persist if not authenticated (local demo mode)
      if ((!user && !child) || !supabase) return;

      const started = new Date(startedAt.current).toISOString();
      const now = new Date().toISOString();
      const duration = Math.round((Date.now() - startedAt.current) / 1000);

      try {
        await supabase.from("exercise_sessions").insert({
          user_id: user?.id ?? null,
          child_id: child?.id ?? null,
          list_subject: subject,
          list_slug: slug,
          list_title: title,
          total_questions: total,
          correct_count: correct.current,
          wrong_count: wrong.current,
          wrong_details: wrongDetails.current,
          points_earned: pointsEarned,
          started_at: started,
          completed_at: now,
          duration_seconds: duration,
        });
      } catch (err) {
        console.error("Failed to save exercise session:", err);
      }
    },
    [user, child, supabase, subject, slug, title, total],
  );

  return { recordAnswer, finish };
}
