import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/learn")({
  head: () => ({ meta: [{ title: "Уроки — SudoKids" }, { name: "description", content: "Учим техники Судоку простым языком." }] }),
  component: Learn,
});

const LESSONS = [
  {
    title: "Одинокий кандидат (Naked Single)",
    emoji: "🌱",
    body: "Если в клетке может быть только ОДНА цифра — она там и стоит. Проверяй ряд, колонку и квадрат. Если все остальные цифры уже есть рядом — ставь ту, что осталась.",
  },
  {
    title: "Спрятанный кандидат (Hidden Single)",
    emoji: "🔍",
    body: "В ряду (или колонке, или квадрате) каждая цифра 1–9 должна появиться один раз. Если в этом ряду только одна клетка, куда можно поставить, например, цифру 7 — ставь её туда!",
  },
  {
    title: "Двойняшки (Naked Pair)",
    emoji: "👯",
    body: "Если в двух клетках одного ряда могут стоять только две одинаковые цифры (например, 3 и 5) — другие клетки этого ряда точно НЕ содержат 3 или 5. Это помогает вычеркивать кандидатов.",
  },
  {
    title: "Заметки — твой блокнот",
    emoji: "✏️",
    body: "Нажми кнопку «Заметки» (или N на клавиатуре) и записывай маленькие цифры — кандидатов. Это как карандашные пометки. Когда становится ясно — ставь большую цифру.",
  },
  {
    title: "Сканирование",
    emoji: "📡",
    body: "Возьми цифру (например, 1) и проверь: в каких рядах, колонках и квадратах её ещё нет? Это самый быстрый способ найти ходы в начале партии.",
  },
];

function Learn() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Уроки от AI-коуча</h1>
      <p className="text-muted-foreground mt-2 text-sm">Короткие объяснения техник простым языком. Без зубрёжки.</p>
      <div className="mt-8 space-y-4">
        {LESSONS.map((l) => (
          <article key={l.title} className="rounded-3xl bg-card border border-border p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{l.emoji}</span>
              <h2 className="font-display font-bold text-xl">{l.title}</h2>
            </div>
            <p className="text-foreground/80 leading-relaxed">{l.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
