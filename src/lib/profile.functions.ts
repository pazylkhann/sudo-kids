import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ProfileDTO {
  id: string;
  display_name: string;
  city: string | null;
  age_group: string | null;
  avatar: string | null;
  is_pro: boolean;
  streak_days: number;
  last_daily_date: string | null;
  theme: string;
  stickers: string[];
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileDTO | null> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, city, age_group, avatar, is_pro, streak_days, last_daily_date, theme, stickers")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    return {
      ...data,
      stickers: Array.isArray(data.stickers) ? (data.stickers as string[]) : [],
    };
  });

const UpdateInput = z.object({
  display_name: z.string().min(1).max(40).optional(),
  city: z.string().max(60).nullable().optional(),
  age_group: z.string().max(20).nullable().optional(),
  avatar: z.string().max(8).nullable().optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Pro upgrade is handled by a future verified Stripe webhook only.
// Never let clients flip `is_pro` directly — that would bypass payment.

export const getMyAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("achievements").select("type, earned_at").eq("user_id", userId);
    return (data ?? []) as { type: string; earned_at: string }[];
  });

export interface MyStats {
  totalGames: number;
  totalCompleted: number;
  bestTime: number | null;
  dailyResults: { date: string; time_seconds: number; mistakes: number; score: number }[];
}

export const getMyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyStats> => {
    const { supabase, userId } = context;
    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("completed, time_seconds")
      .eq("user_id", userId);
    const total = sessions?.length ?? 0;
    const completed = sessions?.filter((s) => s.completed) ?? [];
    const best = completed.length
      ? Math.min(...completed.map((s) => s.time_seconds ?? Infinity))
      : null;
    const { data: dailies } = await supabase
      .from("daily_results")
      .select("date, time_seconds, mistakes, score")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(30);
    return {
      totalGames: total,
      totalCompleted: completed.length,
      bestTime: Number.isFinite(best) ? best : null,
      dailyResults: dailies ?? [],
    };
  });
