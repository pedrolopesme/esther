import { getSupabaseBrowserClient } from "./supabase";

const LIST_SUMMARY_COLUMNS = "id, slug, title, description, subject, materia, ano_letivo, exercise_date, question_count, published";
const LIST_DETAIL_COLUMNS = `${LIST_SUMMARY_COLUMNS}, exercises`;

function normalizeList(row) {
  if (!row) return null;

  return {
    ...row,
    id: row.slug,
    dbId: row.id,
    date: row.exercise_date,
    questionCount: row.question_count ?? 0,
  };
}

export async function getLatestExerciseLists(limit = 10) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("exercise_lists")
    .select(LIST_SUMMARY_COLUMNS)
    .eq("published", true)
    .order("exercise_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(normalizeList);
}

export async function getAvailableExerciseLists(subject) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("exercise_lists")
    .select(LIST_SUMMARY_COLUMNS)
    .eq("subject", subject)
    .eq("published", true)
    .order("exercise_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeList);
}

export async function getExerciseData(subject, slug) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("exercise_lists")
    .select(LIST_DETAIL_COLUMNS)
    .eq("subject", subject)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  return normalizeList(data);
}

/**
 * Fetch a holistic study overview for a student:
 * - Completed sessions & scores
 * - In-progress or recently practiced topics (where they stopped)
 * - Needs study / low score topics (< 70%)
 * - List stats per subject
 */
export async function getStudentStudyOverview(childId = null, userId = null) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { recentSessions: [], completedMap: {}, needsReview: [], lastSession: null };

  try {
    let sessionQuery = supabase
      .from("exercise_sessions")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(60);

    if (childId) {
      sessionQuery = sessionQuery.eq("child_id", childId);
    } else if (userId) {
      sessionQuery = sessionQuery.eq("user_id", userId);
    }

    const { data: sessionData, error: sessionErr } = await sessionQuery;
    if (sessionErr) throw sessionErr;

    const sessions = sessionData || [];
    const completedMap = {};
    const needsReview = [];

    for (const s of sessions) {
      const key = `${s.list_subject}/${s.list_slug}`;
      const scorePct =
        s.total_questions > 0
          ? Math.round((s.correct_count / s.total_questions) * 100)
          : 0;

      if (!completedMap[key]) {
        completedMap[key] = {
          count: 0,
          bestScore: scorePct,
          lastScore: scorePct,
          lastCompletedAt: s.completed_at,
          title: s.list_title,
          subject: s.list_subject,
          slug: s.list_slug,
        };
      }
      completedMap[key].count += 1;
      if (scorePct > completedMap[key].bestScore) {
        completedMap[key].bestScore = scorePct;
      }

      // If last score was low, mark as needs review
      if (scorePct < 70 && !needsReview.some((n) => n.key === key)) {
        needsReview.push({
          key,
          subject: s.list_subject,
          slug: s.list_slug,
          title: s.list_title,
          lastScore: scorePct,
          wrongCount: s.wrong_count,
          completedAt: s.completed_at,
        });
      }
    }

    const lastSession = sessions.length > 0 ? sessions[0] : null;

    return {
      recentSessions: sessions.slice(0, 5),
      completedMap,
      needsReview: needsReview.slice(0, 4),
      lastSession,
    };
  } catch (err) {
    console.warn("Aviso ao carregar visão geral do estudante:", err);
    return { recentSessions: [], completedMap: {}, needsReview: [], lastSession: null };
  }
}
