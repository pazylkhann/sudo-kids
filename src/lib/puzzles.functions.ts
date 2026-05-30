import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generatePuzzle, dailySeed } from "@/lib/sudoku/engine";
import { todayISO, scoreFromRun } from "@/lib/format";

export interface PuzzleDTO {
  id: string;
  size: number;
  difficulty: string;
  given: number[][];
  // NOTE: `solution` is intentionally NOT exposed to clients.
}

// Daily puzzle: cached in DB so everyone gets the same one.
export const getDailyPuzzle = createServerFn({ method: "GET" }).handler(async (): Promise<{ date: string; puzzle: PuzzleDTO }> => {
  const date = todayISO();
  const { data: daily } = await supabaseAdmin
    .from("daily_puzzles")
    .select("puzzle_id, puzzles(*)")
    .eq("date", date)
    .maybeSingle();

  if (daily?.puzzles) {
    const p = daily.puzzles as { id: string; size: string; difficulty: string; given: number[][] };
    return { date, puzzle: { id: p.id, size: parseInt(p.size, 10), difficulty: p.difficulty, given: p.given } };
  }

  const seed = dailySeed(date);
  const gen = generatePuzzle(9, "medium", seed);

  const { data: inserted, error } = await supabaseAdmin
    .from("puzzles")
    .insert({ size: "9", difficulty: "medium", seed, given: gen.given, solution: gen.solution })
    .select("id")
    .single();
  if (error || !inserted) throw new Error(error?.message ?? "Failed to create puzzle");

  await supabaseAdmin.from("daily_puzzles").insert({ date, puzzle_id: inserted.id });

  return { date, puzzle: { id: inserted.id, size: 9, difficulty: "medium", given: gen.given } };
});

// Submit daily result (one per user per day).
// Date is computed server-side to prevent leaderboard tampering.
const SubmitInput = z.object({
  puzzleId: z.string().uuid(),
  timeSec: z.number().int().min(20).max(86400),
  mistakes: z.number().int().min(0).max(999),
  hintsUsed: z.number().int().min(0).max(999),
  // Final board state — verified server-side against the stored solution.
  board: z.array(z.array(z.number().int().min(0).max(9))).min(4).max(9),
});

export const submitDailyResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const date = todayISO();
    const { userId } = context;

    // Verify the submitted puzzle is actually today's daily.
    const { data: daily } = await supabaseAdmin
      .from("daily_puzzles")
      .select("puzzle_id")
      .eq("date", date)
      .maybeSingle();
    if (!daily || daily.puzzle_id !== data.puzzleId) {
      throw new Error("Invalid daily puzzle");
    }

    // Verify the board matches the stored solution.
    const { data: puzzle } = await supabaseAdmin
      .from("puzzles")
      .select("solution")
      .eq("id", data.puzzleId)
      .single();
    const solution = puzzle?.solution as number[][] | undefined;
    if (!solution) throw new Error("Puzzle not found");
    const ok =
      data.board.length === solution.length &&
      data.board.every((row, r) => row.length === solution[r].length && row.every((v, c) => v === solution[r][c]));
    if (!ok) throw new Error("Puzzle is not solved");

    const score = scoreFromRun(data.timeSec, data.mistakes, data.hintsUsed);

    const { error } = await supabaseAdmin.from("daily_results").upsert(
      {
        user_id: userId,
        date,
        time_seconds: data.timeSec,
        mistakes: data.mistakes,
        hints_used: data.hintsUsed,
        score,
      },
      { onConflict: "user_id,date" }
    );
    if (error) throw new Error(error.message);

    // Update streak.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("streak_days, last_daily_date")
      .eq("id", userId)
      .single();

    let newStreak = 1;
    if (profile?.last_daily_date) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (profile.last_daily_date === yesterday) newStreak = (profile.streak_days ?? 0) + 1;
      else if (profile.last_daily_date === date) newStreak = profile.streak_days ?? 1;
    }
    await supabaseAdmin.from("profiles").update({ streak_days: newStreak, last_daily_date: date }).eq("id", userId);

    const earn: string[] = [];
    if (newStreak >= 7) earn.push("streak-7");
    if (newStreak >= 30) earn.push("streak-30");
    if (data.mistakes === 0) earn.push("flawless-daily");
    if (data.hintsUsed === 0) earn.push("no-hints");
    for (const t of earn) {
      await supabaseAdmin.from("achievements").insert({ user_id: userId, type: t }).then(() => {});
    }

    return { score, streak: newStreak, earned: earn };
  });

// Leaderboard (today's daily).
const LbInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scope: z.enum(["global", "city"]).default("global"),
  city: z.string().max(60).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  city: string | null;
  time_seconds: number;
  mistakes: number;
  score: number;
}

export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LbInput.parse(input))
  .handler(async ({ data }): Promise<LeaderboardEntry[]> => {
    let query = supabaseAdmin
      .from("daily_results")
      .select("user_id, time_seconds, mistakes, score, profiles!inner(display_name, city)")
      .eq("date", data.date)
      .order("score", { ascending: false })
      .limit(data.limit);
    if (data.scope === "city" && data.city) {
      query = query.eq("profiles.city", data.city);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => {
      const p = r.profiles as unknown as { display_name: string; city: string | null };
      return {
        user_id: r.user_id,
        display_name: p?.display_name ?? "Player",
        city: p?.city ?? null,
        time_seconds: r.time_seconds,
        mistakes: r.mistakes,
        score: r.score,
      };
    });
  });
