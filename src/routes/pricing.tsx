import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Цены — SudoKids Pro" }, { name: "description", content: "Free навсегда. Pro для серьёзных юных решателей." }] }),
  component: Pricing,
});

function Pricing() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Простые цены</h1>
        <p className="text-muted-foreground mt-3">Бесплатно для всех, Pro — для тех, кто играет каждый день.</p>
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-5">
        <Plan name="Free" price="0" desc="Идеально для знакомства." features={[
          "3 пазла в день в свободной игре",
          "Daily Challenge с лидербордом",
          "AI Coach (5 вопросов в день)",
          "Светлая и тёмная тема",
          "Стикеры за стрики",
        ]} cta={<Link to="/play" className="rounded-full bg-surface hover:bg-surface-2 px-5 py-3 font-semibold inline-block">Начать играть</Link>} />

        <Plan accent name="Pro" price="4.99" desc="Для настоящих логиков." features={[
          "Безлимит пазлов и AI-коуча",
          "Кастомные темы и скины сетки",
          "Родительская статистика прогресса",
          "Эксклюзивные стикеры и аватары",
          "Приоритетная разработка фич",
        ]} cta={<Link to="/profile" className="rounded-full bg-primary text-primary-foreground hover:opacity-90 px-5 py-3 font-semibold inline-flex items-center gap-2 shadow-pop"><Sparkles className="size-4" /> Upgrade to Pro</Link>} />
      </div>
      <p className="text-xs text-muted-foreground text-center mt-6">Демо: Stripe интеграция в разработке. Кнопка Upgrade в профиле включает Pro для пробы.</p>
    </div>
  );
}

function Plan({ name, price, desc, features, cta, accent }: { name: string; price: string; desc: string; features: string[]; cta: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-3xl border p-8 ${accent ? "bg-gradient-to-br from-primary/10 via-accent/10 to-card border-primary/40 shadow-pop" : "bg-card border-border shadow-soft"}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-2xl">{name}</h2>
        {accent && <span className="rounded-full bg-primary text-primary-foreground text-xs px-2.5 py-1 font-bold">Лучшее</span>}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-5xl font-black">${price}</span>
        <span className="text-muted-foreground text-sm">/мес</span>
      </div>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex gap-2 items-start text-sm"><Check className="size-4 text-primary mt-0.5 shrink-0" />{f}</li>
        ))}
      </ul>
      <div className="mt-7">{cta}</div>
    </div>
  );
}
