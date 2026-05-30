import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { todayISO } from "@/lib/format";

const FREE_LIMIT = 5;

const AskInput = z.object({
  board: z.array(z.array(z.number().int().min(0).max(9))).min(4).max(9),
  size: z.union([z.literal(4), z.literal(6), z.literal(9)]),
  question: z.string().min(2).max(300),
  ageGroup: z.string().optional(),
});

function serializeBoard(board: number[][]): (number | null)[][] {
  return board.map((row) => row.map((v) => (v === 0 ? null : v)));
}

function emptyCoords(board: number[][]): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) out.push([r, c]);
    }
  }
  return out;
}

export const askAICoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = todayISO();

    // Check pro status & usage
    const { data: profile } = await supabase.from("profiles").select("is_pro, age_group").eq("id", userId).single();
    const isPro = profile?.is_pro ?? false;

    if (!isPro) {
      const { data: usage } = await supabase
        .from("ai_coach_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      if ((usage?.count ?? 0) >= FREE_LIMIT) {
        return {
          error: "limit",
          message: `Ты использовал ${FREE_LIMIT} подсказок коуча сегодня. Перейди на Pro для безлимита!`,
        };
      }
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { error: "config", message: "AI coach временно недоступен." };
    }

    const provider = createLovableAiGatewayProvider(apiKey);
    const model = provider("google/gemini-2.5-flash");
    const age = data.ageGroup ?? profile?.age_group ?? "8-12";

    const system = `Ты — добрый AI-наставник по Судоку для ребёнка ${age} лет.
Говори ПРОСТЫМ языком: короткие предложения, никаких сложных терминов без пояснений.
Используй сравнения из жизни ("представь полку, где может стоять только одна книга...").
Объясняй техники: "одинокий кандидат" (naked single), "спрятанный кандидат" (hidden single).
Никогда не выдавай весь ответ, если ребёнок ещё может подумать. Подталкивай. Хвали попытки.
Отвечай по-русски, очень дружелюбно, 2-4 коротких абзаца.`;

    const serialized = serializeBoard(data.board);
    const empties = emptyCoords(data.board);
    const boardJson = JSON.stringify(serialized);
    const emptiesStr = empties.map(([r, c]) => `(${r},${c})`).join(", ");

    const coachSystem = `Ты — тренер по Судоку. Вот текущее состояние доски: ${boardJson}. Пустые клетки: [${emptiesStr}]. Не давай прямых ответов, только подсказки о технике или стратегии.`;

    const fullSystem = `${coachSystem}\n\n${system}`;

    try {
      const result = await generateText({
        model,
        system: fullSystem,
        prompt: `Размер доски: ${data.size}x${data.size}.\n\nВопрос ребёнка: "${data.question}"\n\nОтветь подсказкой о технике или стратегии, не выдавай конкретные цифры в клетки.`,
      });

      if (!isPro) {
        const { data: cur } = await supabase
          .from("ai_coach_usage")
          .select("count")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle();
        const next = (cur?.count ?? 0) + 1;
        await supabase
          .from("ai_coach_usage")
          .upsert({ user_id: userId, date: today, count: next }, { onConflict: "user_id,date" });
      }

      return { text: result.text, remaining: isPro ? null : FREE_LIMIT - 1 };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI error";
      if (msg.includes("429")) return { error: "rate", message: "Слишком много запросов, подожди минутку." };
      if (msg.includes("402")) return { error: "credits", message: "Закончились кредиты Lovable AI. Пополни в Workspace Settings." };
      return { error: "unknown", message: "Не получилось получить ответ. Попробуй ещё раз." };
    }
  });
