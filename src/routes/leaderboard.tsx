import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard } from "@/lib/puzzles.functions";
import { fmtTime, todayISO } from "@/lib/format";
import { useState } from "react";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Лидерборд — SudoKids" }, { name: "description", content: "Глобальный рейтинг и рейтинг по городам в Daily Challenge." }] }),
  component: LbPage,
});

function LbPage() {
  const fetchLb = useServerFn(getLeaderboard);
  const [scope, setScope] = useState<"global" | "city">("global");
  const [city, setCity] = useState("");

  const q = useQuery({
    queryKey: ["lb-page", scope, city, todayISO()],
    queryFn: () => fetchLb({ data: { date: todayISO(), scope, city: city || undefined, limit: 50 } }),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2"><Trophy className="size-7 text-primary" /> Лидерборд</h1>
      <p className="text-muted-foreground mt-1 text-sm">Сегодня · {new Date().toLocaleDateString("ru-RU")}</p>

      <div className="mt-5 flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 rounded-full bg-surface p-1">
          <button onClick={() => setScope("global")} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${scope === "global" ? "bg-primary text-primary-foreground" : ""}`}>🌍 Глобальный</button>
          <button onClick={() => setScope("city")} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${scope === "city" ? "bg-primary text-primary-foreground" : ""}`}>🏙 По городу</button>
        </div>
        {scope === "city" && (
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Город (напр. Алматы)" className="rounded-full border border-border bg-card px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        )}
      </div>

      <div className="mt-6 rounded-3xl bg-card border border-border overflow-hidden">
        {q.isLoading && <div className="p-6 text-muted-foreground">Загрузка...</div>}
        {q.data && q.data.length === 0 && <div className="p-6 text-muted-foreground text-center">Пока пусто. Стань первым!</div>}
        <ol>
          {q.data?.map((row, i) => (
            <li key={row.user_id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface/50">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`font-display font-black w-7 text-center ${i < 3 ? "text-primary text-xl" : "text-muted-foreground"}`}>{i + 1}</span>
                <span className="truncate font-semibold">{row.display_name}</span>
                {row.city && <span className="text-xs text-muted-foreground">{row.city}</span>}
              </div>
              <div className="flex items-center gap-4 text-sm tabular-nums">
                <span className="text-muted-foreground">{row.mistakes} ❌</span>
                <span>{fmtTime(row.time_seconds)}</span>
                <span className="font-bold text-primary w-14 text-right">{row.score}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
