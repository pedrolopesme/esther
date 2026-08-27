-- ============================================================
-- Fix: children could never read back their own exercise sessions
-- ============================================================
--
-- Children authenticate through the public.child_login RPC, which validates a
-- username/password pair and returns the child row. It does NOT create a
-- Supabase Auth session, so for a logged-in child auth.uid() is NULL.
--
-- Every SELECT policy on exercise_sessions required auth.uid():
--
--   "Users can read own exercise sessions"      -> user_id = auth.uid()
--                                                 OR child belongs to auth.uid()
--   "Parents can read children exercise sessions" -> same shape
--   "Admins can read all exercise sessions"     -> public.is_admin()
--
-- Meanwhile INSERT was already permitted via
-- "Children can insert own exercise sessions" -> with check (child_id is not null).
--
-- Net effect: a child could finish a list and persist the session, but the
-- follow-up SELECT returned zero rows. getStudentStudyOverview() therefore
-- built an empty completedMap, and the child dashboard kept showing the "NOVO"
-- badge on lists that were already done. It also silently disabled
-- "Continue de onde parou" and the needsReview recommendations for children.
--
-- game_sessions and material_accesses already carry the equivalent
-- `or child_id is not null` clause, which is why minigame and material badges
-- cleared correctly while exercise lists did not. This restores parity.
--
-- SECURITY NOTE: like the two policies it mirrors, this predicate cannot scope
-- rows to *one* child, because a child has no server-verified identity — the
-- child id lives in localStorage. Any anonymous client can therefore read
-- exercise_sessions rows that carry a child_id. Closing that hole properly
-- requires giving children real Supabase Auth identities (or routing reads
-- through a SECURITY DEFINER RPC keyed by a short-lived child token) and then
-- tightening all three tables together.

drop policy if exists "Children can read own exercise sessions" on public.exercise_sessions;
create policy "Children can read own exercise sessions"
  on public.exercise_sessions for select
  using (child_id is not null);
