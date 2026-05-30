import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Calendar, Trophy, Sparkles, Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SudoKids — Судоку, которое влюбляет детей в логику" },
      { name: "description", content: "Платформа Судоку для детей 6–12 лет с AI-наставником, ежедневными челленджами и наградами. Утренняя зарядка для мозга." },
      { property: "og:title", content: "SudoKids — Утренняя зарядка для мозга" },
      { property: "og:description", content: "AI-наставник, Daily Challenge, лидерборды по городам и стикеры. Сделано для юных мыслителей." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-xs font-bold text-foreground/70 mb-6">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Beta · Утренняя зарядка для мозга
            </div>
            <h1 className="font-display font-black text-5xl sm:text-7xl tracking-tight text-foreground leading-[1.05]">
              Судоку, которое <span className="text-primary italic">влюбляет</span><br />детей в логику
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              SudoKids превращает скучную головоломку в утренний ритуал.
              AI-наставник объясняет каждый ход простым языком, а стрики и стикеры держат интерес.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/play" className="rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-semibold shadow-pop hover:translate-y-[-2px] transition-transform inline-flex items-center gap-2">
                Начать играть <ArrowRight className="size-4" />
              </Link>
              <Link to="/daily" className="rounded-full bg-surface px-6 py-3.5 font-semibold hover:bg-surface-2 inline-flex items-center gap-2">
                <Calendar className="size-4" /> Сегодняшний челлендж
              </Link>
            </div>
          </div>

          {/* Hero illustration: mini sudoku preview */}
          <div className="mt-16 mx-auto max-w-md">
            <MiniGridPreview />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">Почему дети возвращаются</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl bg-card border border-border p-6 shadow-soft hover:shadow-pop transition-shadow">
              <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-surface/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">Как это работает</h2>
          <ol className="space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 items-start rounded-2xl bg-card border border-border p-5">
                <div className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-black shrink-0">{i + 1}</div>
                <div>
                  <h3 className="font-display font-bold text-lg">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Готов начать?</h2>
        <p className="mt-4 text-muted-foreground text-lg">Бесплатно. Без рекламы. Без таймера в первой партии.</p>
        <Link to="/play" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-4 font-semibold shadow-pop hover:translate-y-[-2px] transition-transform">
          Решить первое судоку <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

const FEATURES = [
  { icon: Brain, title: "AI-наставник", desc: "Объясняет каждый ход простым языком. Учит техникам, а не подсказывает ответ." },
  { icon: Calendar, title: "Daily Challenge", desc: "Одно судоку на всех каждый день. Стрики и стикеры за серии 7, 30, 100." },
  { icon: Trophy, title: "Рейтинг по городам", desc: "Сравни себя с друзьями из своего города или со всем миром." },
  { icon: Heart, title: "Для детей", desc: "Сетки 4×4 и 6×6 для малышей, 9×9 для опытных. Без давления." },
];

const STEPS = [
  { title: "Выбираешь размер и уровень", desc: "От малышей с 4×4 до экспертов с 9×9 hard. Бесконечный генератор уникальных пазлов." },
  { title: "Решаешь с подсказками", desc: "Заметки, проверка конфликтов, кнопка hint — всё что нужно, чтобы не застрять." },
  { title: "Спрашиваешь у AI-коуча", desc: "Не понимаешь, куда поставить цифру? Спроси — он объяснит на твоём уровне." },
  { title: "Зарабатываешь стикеры", desc: "Стрик 7 дней — 🔥, 30 дней — 🏆, без ошибок — 💎. Коллекция в профиле." },
];

function MiniGridPreview() {
  const board = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9],
  ];
  return (
    <div className="rounded-3xl bg-card border-2 border-border p-3 shadow-pop">
      <div className="grid grid-cols-9 gap-px bg-foreground/15 rounded-2xl overflow-hidden">
        {board.flatMap((row, r) => row.map((v, c) => (
          <div key={`${r}-${c}`} className={`aspect-square bg-card grid place-items-center font-display font-bold text-sm sm:text-base ${(Math.floor(r/3)+Math.floor(c/3))%2===0 ? "" : "bg-surface/60"}`}>
            {v !== 0 ? <span className={v === 5 ? "text-primary" : ""}>{v}</span> : <span className="text-muted-foreground/30 text-xs">·</span>}
          </div>
        )))}
      </div>
    </div>
  );
}
