import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Войти — SudoKids" }, { name: "description", content: "Вход и регистрация в SudoKids" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) navigate({ to: "/play" }); }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Готово! Проверь почту, чтобы подтвердить email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Добро пожаловать!");
        navigate({ to: "/play" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Не получилось войти через Google");
    if (!r.redirected && !r.error) navigate({ to: "/play" });
    setBusy(false);
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-7 shadow-soft">
        <h1 className="font-display text-3xl font-bold text-center">{mode === "login" ? "С возвращением!" : "Привет, юный логик!"}</h1>
        <p className="text-center text-muted-foreground mt-2 text-sm">{mode === "login" ? "Войди, чтобы продолжить стрик" : "Создай аккаунт за 30 секунд"}</p>

        <button onClick={google} disabled={busy} className="mt-6 w-full rounded-full border border-border bg-card hover:bg-surface py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          <GoogleIcon /> Продолжить с Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />или<div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input type="text" placeholder="Как тебя зовут?" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:ring-2 focus:ring-ring outline-none" />
          )}
          <input type="email" required placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:ring-2 focus:ring-ring outline-none" />
          <input type="password" required minLength={6} placeholder="Пароль (6+ символов)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:ring-2 focus:ring-ring outline-none" />
          <button type="submit" disabled={busy} className="w-full rounded-full bg-primary text-primary-foreground py-3 font-semibold shadow-pop disabled:opacity-50">
            {busy ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground">
          {mode === "login" ? "Ещё нет аккаунта? " : "Уже есть аккаунт? "}
          <span className="font-semibold text-primary">{mode === "login" ? "Зарегистрироваться" : "Войти"}</span>
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/>
    </svg>
  );
}
