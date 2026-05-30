import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDailyPuzzle, getLeaderboard, submitDailyResult } from "@/lib/puzzles.functions";
import { SudokuGame } from "@/components/SudokuGame";
import { useAuth } from "@/hooks/use-auth";
import { fmtTime, todayISO } from "@/lib/format";
import { Calendar, Flame, Globe } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Size } from "@/lib/sudoku/engine";

export const Route = createFileRoute("/daily")({
  head: () => ({ meta: [{ title: "Daily Challenge — SudoKids" }, { name: "description", content: "Ежедневное судоку для всех. Соревнуйся со всем миром и со своим городом." }] }),
  component: DailyPage,
});

function DailyPage() {
  const { user } = useAuth();
  const fetchDaily = useServerFn(getDailyPuzzle);
  const fetchLb = useServerFn(getLeaderboard);
  const submit = useServerFn(submitDailyResult);
  const qc = useQueryClient();

  const daily = useQuery({ queryKey: ["daily"], queryFn: () => fetchDaily() });
  const lb = useQuery({
    queryKey: ["lb", todayISO()],
    queryFn: () => fetchLb({ data: { date: todayISO(), scope: "global", limit: 10 } }),
  });

  const submitMut = useMutation({
    mutationFn: (input: { timeSec: number; mistakes: number; hintsUsed: number; board: number[][] }) =>
      submit({ data: { puzzleId: daily.data!.puzzle.id, ...input } }),
    onSuccess: (r) => {
      toast.success(`🎉 Score ${r.score} · Стрик: ${r.streak} 🔥`);
      qc.invalidateQueries({ queryKey: ["lb"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-bold mb-2">
            <Calendar className="size-3.5" /> {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Daily Challenge</h1>
          <p className="text-muted-foreground mt-1 text-sm">Одно судоку, одна попытка, общий рейтинг для всех.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          {daily.isLoading && <div className="text-muted-foreground">Загрузка...</div>}
          {daily.data && (
            <SudokuGame
              size={daily.data.puzzle.size as Size}
              difficulty="medium"
              seed={daily.data.date}
              puzzleId={daily.data.puzzle.id}
              fixedGiven={daily.data.puzzle.given}
              hideRestart
              onComplete={(r) => {
                if (!user) { toast.info("Войди, чтобы сохранить результат в лидерборд"); return; }
                if (!submitMut.isPending && !submitMut.isSuccess) submitMut.mutate(r);
              }}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><Globe className="size-4 text-primary" /> Топ сегодня</h3>
            {lb.isLoading && <div className="mt-3 text-sm text-muted-foreground">...</div>}
            {lb.data && lb.data.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Будь первым, кто решит сегодняшний пазл!</p>}
            <ol className="mt-3 space-y-1.5">
              {lb.data?.map((row, i) => (
                <li key={row.user_id} className="flex items-center justify-between text-sm gap-2 rounded-xl bg-surface px-3 py-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-display font-black w-6 text-center text-primary">{i + 1}</span>
                    <span className="truncate">{row.display_name}</span>
                    {row.city && <span className="text-xs text-muted-foreground">· {row.city}</span>}
                  </span>
                  <span className="tabular-nums font-semibold">{fmtTime(row.time_seconds)}</span>
                </li>
              ))}
            </ol>
            <Link to="/leaderboard" className="mt-3 block text-center text-sm text-primary font-semibold hover:underline">Полный лидерборд →</Link>
          </div>

          {!user && (
            <div className="rounded-3xl bg-primary/10 border border-primary/30 p-5">
              <h3 className="font-display font-bold text-lg flex items-center gap-2"><Flame className="size-4 text-primary" /> Войди для стрика</h3>
              <p className="text-sm text-muted-foreground mt-1">Сохраняй прогресс, зарабатывай стикеры и попадай в лидерборд.</p>
              <Link to="/auth" className="mt-3 inline-flex rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">Войти</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
