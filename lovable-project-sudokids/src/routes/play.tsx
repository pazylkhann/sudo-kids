import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SudokuGame } from "@/components/SudokuGame";
import type { Size, Difficulty } from "@/lib/sudoku/engine";
import { Calendar, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/play")({
  head: () => ({ meta: [{ title: "Играть — SudoKids" }, { name: "description", content: "Выбери размер и сложность судоку, или попробуй сегодняшний челлендж." }] }),
  component: PlayPage,
});

const SIZES: { value: Size; label: string; sub: string }[] = [
  { value: 4, label: "4×4", sub: "малышам" },
  { value: 6, label: "6×6", sub: "начинающим" },
  { value: 9, label: "9×9", sub: "классика" },
];
const DIFFS: { value: Difficulty; label: string; emoji: string }[] = [
  { value: "easy", label: "Легко", emoji: "🌱" },
  { value: "medium", label: "Средне", emoji: "🔥" },
  { value: "hard", label: "Сложно", emoji: "💎" },
];

function PlayPage() {
  const [size, setSize] = useState<Size>(9);
  const [diff, setDiff] = useState<Difficulty>("easy");
  const [seed, setSeed] = useState(() => `r-${Date.now()}`);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Свободная игра</h1>
          <p className="text-muted-foreground mt-1 text-sm">Бесконечный генератор уникальных пазлов</p>
        </div>
        <div className="flex gap-2">
          <Link to="/daily" className="rounded-full bg-surface hover:bg-surface-2 px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5"><Calendar className="size-4" /> Daily</Link>
          <Link to="/learn" className="rounded-full bg-surface hover:bg-surface-2 px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5"><GraduationCap className="size-4" /> Уроки</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-1.5 rounded-full bg-surface p-1.5">
          {SIZES.map((s) => (
            <button key={s.value} onClick={() => { setSize(s.value); setSeed(`r-${Date.now()}`); }} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${size === s.value ? "bg-primary text-primary-foreground shadow-pop" : "hover:bg-surface-2"}`}>
              {s.label} <span className="font-normal opacity-70 ml-1">{s.sub}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 rounded-full bg-surface p-1.5">
          {DIFFS.map((d) => (
            <button key={d.value} onClick={() => { setDiff(d.value); setSeed(`r-${Date.now()}`); }} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${diff === d.value ? "bg-primary text-primary-foreground shadow-pop" : "hover:bg-surface-2"}`}>
              {d.emoji} {d.label}
            </button>
          ))}
        </div>
        <button onClick={() => setSeed(`r-${Date.now()}`)} className="rounded-full bg-card border border-border px-4 py-2 text-sm font-semibold hover:bg-surface">Новый пазл</button>
      </div>

      <SudokuGame key={`${size}-${diff}-${seed}`} size={size} difficulty={diff} seed={seed} />
    </div>
  );
}
