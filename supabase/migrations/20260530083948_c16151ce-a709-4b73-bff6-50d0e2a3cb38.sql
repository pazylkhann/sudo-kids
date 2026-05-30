-- Tighten RLS to fix security findings.

-- 1) Profiles: stop exposing every user's full profile to all authenticated users.
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2) Puzzles + daily_puzzles: solutions must not be readable by clients.
--    All app reads go through server functions using the service-role client.
DROP POLICY IF EXISTS puzzles_read_all ON public.puzzles;
REVOKE SELECT ON public.puzzles FROM anon;
REVOKE SELECT ON public.puzzles FROM authenticated;

DROP POLICY IF EXISTS daily_read_all ON public.daily_puzzles;
REVOKE SELECT ON public.daily_puzzles FROM anon;
REVOKE SELECT ON public.daily_puzzles FROM authenticated;

-- 3) Daily results: don't expose every user's stats; leaderboard is built server-side.
DROP POLICY IF EXISTS daily_results_read_all_auth ON public.daily_results;
CREATE POLICY daily_results_select_own
  ON public.daily_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
