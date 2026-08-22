import { getSupabaseBrowserClient } from "./supabase";

/**
 * Log a structured event for a child: 'login' | 'exercise_started' | 'exercise_completed'
 */
export async function logChildEvent({
  childId,
  eventType,
  subject,
  listSlug,
  listTitle,
  metadata = {},
}) {
  if (typeof window === "undefined" || !childId) return;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  try {
    await supabase.from("child_events").insert({
      child_id: childId,
      event_type: eventType,
      subject: subject ?? null,
      list_slug: listSlug ?? null,
      list_title: listTitle ?? null,
      metadata,
    });
  } catch (err) {
    console.error("Erro ao registrar evento da criança:", err);
  }
}
