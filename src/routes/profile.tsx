import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, getMyStats, getMyAchievements, updateMyProfile } from "@/lib/profile.functions";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtTime } from "@/lib/format";
import { toast } from "sonner";
import { Flame, Trophy, Sparkles, LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Профиль — SudoKids" }] }),
  component: ProfilePage,
});

const STICKER_MAP: Record<string, { emoji: string; label: string }> = {
  "streak-7": { emoji: "🔥", label: "Стрик 7 дней" },
  "streak-30": { emoji: "🏆", label: "Стрик 30 дней" },
  "streak-100": { emoji: "👑", label: "Стрик 100 дней" },
  "flawless-daily": { emoji: "💎", label: "Без ошибок" },
  "no-hints": { emoji: "🧠", label: "Без подсказок" },
};

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getProf = useServerFn(getMyProfile);
  const getStat = useServerFn(getMyStats);
  const getAch = useServerFn(getMyAchievements);
  const upd = useServerFn(updateMyProfile);
  

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProf(), enabled: !!user });
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => getStat(), enabled: !!user });
  const ach = useQuery({ queryKey: ["ach"], queryFn: () => getAch(), enabled: !!user });

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  useEffect(() => {
    if (profile.data) {
      setName(profile.data.display_name);
      setCity(profile.data.city ?? "");
      setAgeGroup(profile.data.age_group ?? "");
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => upd({ data: { display_name: name, city: city || null, age_group: ageGroup || null } }),
    onSuccess: () => { toast.success("Сохранено"); qc.invalidateQueries({ queryKey: ["profile"] }); },
  });
  // Pro upgrade flow is now handled exclusively by a verified Stripe webhook.
  // The button is disabled until the integration is wired up.

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Профиль</h1>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
        </div>
        <button onClick={signOut} className="rounded-full bg-surface hover:bg-surface-2 px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5"><LogOut className="size-4" /> Выйти</button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard icon={<Flame className="size-5" />} label="Стрик дней" value={profile.data?.streak_days ?? 0} />
        <StatCard icon={<Trophy className="size-5" />} label="Завершено" value={stats.data?.totalCompleted ?? 0} />
        <StatCard icon={<Sparkles className="size-5" />} label="Лучшее время" value={stats.data?.bestTime ? fmtTime(stats.data.bestTime) : "—"} />
      </div>

      {/* Stickers */}
      <div className="rounded-3xl bg-card border border-border p-6">
        <h2 className="font-display font-bold text-xl mb-3">Стикеры</h2>
        {ach.data && ach.data.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {ach.data.map((a) => {
              const s = STICKER_MAP[a.type] ?? { emoji: "⭐", label: a.type };
              return (
                <div key={a.type} className="rounded-2xl bg-surface px-4 py-3 flex items-center gap-2">
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Реши пазл из Daily без ошибок, чтобы получить первый стикер!</p>
        )}
      </div>

      {/* Settings */}
      <div className="rounded-3xl bg-card border border-border p-6 space-y-3">
        <h2 className="font-display font-bold text-xl">Настройки</h2>
        <Input label="Имя" value={name} onChange={setName} />
        <Input label="Город (для лидерборда)" value={city} onChange={setCity} placeholder="Алматы" />
        <Input label="Возраст" value={ageGroup} onChange={setAgeGroup} placeholder="8-12" />
        <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold disabled:opacity-50">Сохранить</button>
      </div>

      {/* Pro */}
      {!profile.data?.is_pro && (
        <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 p-6">
          <h2 className="font-display font-bold text-xl flex items-center gap-2"><Sparkles className="size-5 text-primary" /> Перейти на Pro</h2>
          <p className="text-sm text-muted-foreground mt-1">Безлимит AI-коуча, кастомные темы сетки, эксклюзивные стикеры.</p>
          <button disabled onClick={() => toast.info("Оплата скоро — мы подключаем Stripe.")} className="mt-4 rounded-full bg-primary/60 text-primary-foreground px-5 py-2.5 text-sm font-semibold cursor-not-allowed">
            Upgrade to Pro · $4.99/mo (скоро)
          </button>
          <p className="text-xs text-muted-foreground mt-2">* Активация Pro произойдёт автоматически после оплаты через Stripe.</p>
        </div>
      )}
      {profile.data?.is_pro && (
        <div className="rounded-3xl bg-primary/10 border border-primary/30 p-6">
          <h2 className="font-display font-bold text-xl">✨ Pro активен</h2>
          <p className="text-sm text-muted-foreground mt-1">Спасибо за поддержку проекта!</p>
        </div>
      )}

      <p className="text-center"><Link to="/leaderboard" className="text-sm text-primary font-semibold hover:underline">Открыть лидерборд →</Link></p>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card border border-border p-5">
      <div className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center">{icon}</div>
      <div className="mt-3 text-xs text-muted-foreground font-semibold uppercase tracking-wide">{label}</div>
      <div className="font-display text-3xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
