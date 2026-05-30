import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { type Board, type Size, type Difficulty, BOX, candidates, conflicts, findHint, generatePuzzle, isComplete } from "@/lib/sudoku/engine";
import { fmtTime } from "@/lib/format";
import { Eraser, Lightbulb, Pencil, Pause, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askAICoach } from "@/lib/coach.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Props {
  size: Size;
  difficulty: Difficulty;
  seed?: string;
  puzzleId?: string;
  fixedGiven?: Board;
  fixedSolution?: Board;
  onComplete?: (result: { timeSec: number; mistakes: number; hintsUsed: number; board: Board }) => void;
  hideRestart?: boolean;
}

export function SudokuGame({ size, difficulty, seed, fixedGiven, fixedSolution, onComplete, hideRestart }: Props) {
  const puzzle = useMemo(() => {
    if (fixedGiven) {
      // For server-provided puzzles, solution may be withheld (game integrity).
      // We fall back to rule-based validation in that case.
      return { given: fixedGiven, solution: fixedSolution ?? null, size, difficulty, seed: seed ?? "fixed" };
    }
    const g = generatePuzzle(size, difficulty, seed ?? `r-${Date.now()}-${Math.random()}`);
    return { given: g.given, solution: g.solution as Board | null, size, difficulty, seed: g.seed };
  }, [size, difficulty, seed, fixedGiven, fixedSolution]);

  const [board, setBoard] = useState<Board>(() => puzzle.given.map((r) => r.slice()));
  const [notes, setNotes] = useState<Set<number>[][]>(() =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => new Set<number>()))
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [poppedCell, setPoppedCell] = useState<string | null>(null);
  const [shakeCell, setShakeCell] = useState<string | null>(null);

  // Reset when puzzle changes.
  useEffect(() => {
    setBoard(puzzle.given.map((r) => r.slice()));
    setNotes(Array.from({ length: size }, () => Array.from({ length: size }, () => new Set<number>())));
    setSelected(null); setMistakes(0); setHintsUsed(0); setElapsed(0); setPaused(false); setDone(false);
  }, [puzzle, size]);

  // Timer
  useEffect(() => {
    if (paused || done) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [paused, done]);

  const cellKey = (r: number, c: number) => `${r},${c}`;
  const conflictSet = useMemo(() => conflicts(board, size), [board, size]);

  function place(n: number) {
    if (!selected || done || paused) return;
    const [r, c] = selected;
    if (puzzle.given[r][c] !== 0) return;

    if (noteMode) {
      const next = notes.map((row) => row.map((s) => new Set(s)));
      if (next[r][c].has(n)) next[r][c].delete(n);
      else next[r][c].add(n);
      setNotes(next);
      return;
    }

    const nextBoard = board.map((row) => row.slice());
    nextBoard[r][c] = n;
    // If we know the solution, check directly; otherwise infer from rule conflicts.
    const correct = puzzle.solution
      ? puzzle.solution[r][c] === n
      : conflicts(nextBoard, size).size === 0 || !conflicts(nextBoard, size).has(cellKey(r, c));
    setBoard(nextBoard);
    const nextNotes = notes.map((row) => row.map((s) => new Set(s)));
    nextNotes[r][c].clear();
    setNotes(nextNotes);

    const k = cellKey(r, c);
    if (correct) {
      setPoppedCell(k);
      setTimeout(() => setPoppedCell(null), 300);
      if (isComplete(nextBoard, size)) {
        setDone(true);
        toast.success("🎉 Решено!");
        onComplete?.({ timeSec: elapsed, mistakes, hintsUsed, board: nextBoard });
      }
    } else {
      setMistakes((m) => m + 1);
      setShakeCell(k);
      setTimeout(() => setShakeCell(null), 300);
    }
  }

  function erase() {
    if (!selected) return;
    const [r, c] = selected;
    if (puzzle.given[r][c] !== 0) return;
    const next = board.map((row) => row.slice());
    next[r][c] = 0;
    setBoard(next);
  }

  function hint() {
    const h = findHint(board, size);
    if (!h) return;
    setHintsUsed((x) => x + 1);
    const next = board.map((row) => row.slice());
    next[h.r][h.c] = h.value;
    setBoard(next);
    setSelected([h.r, h.c]);
    setPoppedCell(cellKey(h.r, h.c));
    setTimeout(() => setPoppedCell(null), 300);
    toast.info(h.technique === "naked-single" ? "Одинокий кандидат — здесь подходит только эта цифра!" : h.technique === "hidden-single" ? "Спрятанный кандидат в ряду/колонке/квадрате!" : "Подсказка!");
    if (isComplete(next, size)) { setDone(true); onComplete?.({ timeSec: elapsed, mistakes, hintsUsed: hintsUsed + 1, board: next }); }
  }

  function restart() {
    setBoard(puzzle.given.map((r) => r.slice()));
    setNotes(Array.from({ length: size }, () => Array.from({ length: size }, () => new Set<number>())));
    setMistakes(0); setHintsUsed(0); setElapsed(0); setDone(false); setSelected(null);
  }

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= String(size)) place(parseInt(e.key, 10));
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") erase();
      else if (e.key.toLowerCase() === "n") setNoteMode((v) => !v);
      else if (selected) {
        const [r, c] = selected;
        if (e.key === "ArrowUp" && r > 0) setSelected([r - 1, c]);
        if (e.key === "ArrowDown" && r < size - 1) setSelected([r + 1, c]);
        if (e.key === "ArrowLeft" && c > 0) setSelected([r, c - 1]);
        if (e.key === "ArrowRight" && c < size - 1) setSelected([r, c + 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const { rows: br, cols: bc } = BOX[size];
  const selVal = selected ? board[selected[0]][selected[1]] : 0;

  return (
    <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-start">
      <div>
        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm font-semibold">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-surface px-3 py-1.5 tabular-nums">⏱ {fmtTime(elapsed)}</span>
            <span className="rounded-full bg-surface px-3 py-1.5">Ошибки: <span className={mistakes > 0 ? "text-destructive" : ""}>{mistakes}</span></span>
            <span className="rounded-full bg-surface px-3 py-1.5">💡 {hintsUsed}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPaused((p) => !p)} className="size-9 grid place-items-center rounded-full bg-surface hover:bg-surface-2" title="Пауза">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
            {!hideRestart && <button onClick={restart} className="size-9 grid place-items-center rounded-full bg-surface hover:bg-surface-2" title="Заново"><RotateCcw className="size-4" /></button>}
          </div>
        </div>

        {/* Grid */}
        <div className="relative mx-auto max-w-[min(92vw,560px)]">
          {paused && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-card/80 backdrop-blur-sm rounded-3xl">
              <button onClick={() => setPaused(false)} className="rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold inline-flex items-center gap-2"><Play className="size-4" /> Продолжить</button>
            </div>
          )}
          <div className="rounded-3xl border-2 border-foreground/15 p-2 bg-card shadow-soft">
            <div
              className="grid gap-0 bg-foreground/15"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {board.flatMap((row, r) => row.map((v, c) => {
                const k = cellKey(r, c);
                const given = puzzle.given[r][c] !== 0;
                const isSel = selected?.[0] === r && selected?.[1] === c;
                const sameRow = selected?.[0] === r;
                const sameCol = selected?.[1] === c;
                const sameBox = selected && Math.floor(selected[0] / br) === Math.floor(r / br) && Math.floor(selected[1] / bc) === Math.floor(c / bc);
                const peer = !isSel && (sameRow || sameCol || sameBox);
                const sameVal = selVal && v === selVal;
                const conflict = conflictSet.has(k);
                const borderR = (c + 1) % bc === 0 && c < size - 1;
                const borderB = (r + 1) % br === 0 && r < size - 1;

                return (
                  <button
                    key={k}
                    onClick={() => setSelected([r, c])}
                    className={[
                      "aspect-square relative grid place-items-center font-display font-bold text-2xl sm:text-3xl select-none transition-colors",
                      "bg-card",
                      peer ? "bg-primary/5" : "",
                      sameVal ? "bg-primary/15" : "",
                      isSel ? "bg-primary/25 ring-2 ring-primary z-10" : "",
                      conflict ? "text-destructive" : given ? "text-foreground" : "text-primary",
                      borderR ? "border-r-2 border-r-foreground/30" : "",
                      borderB ? "border-b-2 border-b-foreground/30" : "",
                      poppedCell === k ? "cell-pop" : "",
                      shakeCell === k ? "cell-shake" : "",
                    ].join(" ")}
                  >
                    {v !== 0 ? v : notes[r][c].size > 0 ? (
                      <div className="absolute inset-0 grid p-0.5 text-[9px] sm:text-[10px] text-muted-foreground font-semibold" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(size))}, 1fr)` }}>
                        {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
                          <span key={n} className="grid place-items-center">{notes[r][c].has(n) ? n : ""}</span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => setNoteMode((v) => !v)} className={`rounded-full px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 ${noteMode ? "bg-primary text-primary-foreground" : "bg-surface"}`}>
            <Pencil className="size-4" /> Заметки
          </button>
          <button onClick={erase} className="rounded-full bg-surface hover:bg-surface-2 px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
            <Eraser className="size-4" /> Стереть
          </button>
          <button onClick={hint} className="rounded-full bg-accent text-accent-foreground hover:opacity-90 px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
            <Lightbulb className="size-4" /> Подсказка
          </button>
        </div>

        {/* Number pad */}
        <div className="mt-3 mx-auto max-w-[min(92vw,560px)] grid gap-1.5" style={{ gridTemplateColumns: `repeat(${size > 6 ? size : 6}, 1fr)` }}>
          {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => place(n)} className="aspect-square sm:aspect-auto sm:py-4 rounded-2xl bg-surface hover:bg-primary/20 font-display font-bold text-2xl sm:text-3xl text-primary transition-colors">
              {n}
            </button>
          ))}
        </div>
      </div>

      <AICoachPanel board={board} size={size} selected={selected} />
    </div>
  );
}

function AICoachPanel({ board, size, selected }: { board: Board; size: Size; selected: [number, number] | null }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askAICoach);

  async function send(question: string) {
    if (!user) { toast.error("Войди, чтобы спросить коуча"); return; }
    setLoading(true); setAnswer(null);
    try {
      const r = await ask({ data: { board, size, question } });
      if ("error" in r && r.error) toast.error(r.message);
      else if ("text" in r && r.text) setAnswer(r.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  }

  const suggestions = [
    "С чего мне начать?",
    selected ? `Подходит ли цифра в выделенную клетку?` : "Дай намёк",
    "Объясни технику naked single",
  ];

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 rounded-full bg-primary text-primary-foreground shadow-pop px-5 py-3 font-semibold inline-flex items-center gap-2 z-30"
      >
        <Sparkles className="size-4" /> {open ? "Скрыть коуча" : "AI Coach"}
      </button>

      {/* Small side panel — doesn't cover the board */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[min(92vw,340px)] max-h-[70vh] bg-card rounded-3xl border border-border shadow-pop p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> AI Coach
              </h3>
              <button onClick={() => setOpen(false)} className="size-7 grid place-items-center rounded-full hover:bg-surface">
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Подсказки по технике — без готовых ответов.</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading} className="text-[11px] rounded-full bg-surface hover:bg-surface-2 px-2.5 py-1 font-semibold">
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-3 flex-1 overflow-y-auto min-h-[40px]">
              {loading && !answer && <div className="text-xs text-muted-foreground">Думаю...</div>}
              {answer && (
                <div className="rounded-2xl bg-surface p-3 text-xs leading-relaxed whitespace-pre-wrap float-up">{answer}</div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) send(q.trim()); }} className="mt-3 flex gap-1.5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Свой вопрос..."
                className="flex-1 min-w-0 rounded-full border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="submit" disabled={loading || !q.trim()} className="rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold disabled:opacity-50">
                {loading ? "..." : "→"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Expose helper so other routes can use it
export { candidates };
