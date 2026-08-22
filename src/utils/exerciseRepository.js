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
