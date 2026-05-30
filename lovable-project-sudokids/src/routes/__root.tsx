import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Этой страницы нет в нашем альбоме.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">На главную</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Попробовать снова</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SudoKids — Утренняя зарядка для мозга" },
      { name: "description", content: "Судоку для детей с AI-наставником, ежедневными челленджами и наградами. Тренируй мозг каждое утро." },
      { property: "og:title", content: "SudoKids — Утренняя зарядка для мозга" },
      { property: "og:description", content: "Судоку для детей с AI-наставником, ежедневными челленджами и наградами. Тренируй мозг каждое утро." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "SudoKids — Утренняя зарядка для мозга" },
      { name: "twitter:description", content: "Судоку для детей с AI-наставником, ежедневными челленджами и наградами. Тренируй мозг каждое утро." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/jvcBeuzXv8axlSDtNDuNf3dE5Qr2/social-images/social-1780054597985-ChatGPT_Image_29_мая_2026_г.,_16_30_26.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/jvcBeuzXv8axlSDtNDuNf3dE5Qr2/social-images/social-1780054597985-ChatGPT_Image_29_мая_2026_г.,_16_30_26.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=Nunito:wght@400;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <Shell />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

function AuthListener() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}

function Shell() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-display font-black text-lg shadow-pop group-hover:rotate-3 transition-transform">S</div>
            <span className="font-display font-bold text-lg tracking-tight">SudoKids</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 text-sm font-semibold">
            <Link to="/play" className="px-3 py-1.5 rounded-full hover:bg-surface" activeProps={{ className: "px-3 py-1.5 rounded-full bg-surface text-primary" }}>Играть</Link>
            <Link to="/daily" className="px-3 py-1.5 rounded-full hover:bg-surface" activeProps={{ className: "px-3 py-1.5 rounded-full bg-surface text-primary" }}>Daily</Link>
            <Link to="/leaderboard" className="px-3 py-1.5 rounded-full hover:bg-surface" activeProps={{ className: "px-3 py-1.5 rounded-full bg-surface text-primary" }}>Рейтинг</Link>
            <Link to="/pricing" className="px-3 py-1.5 rounded-full hover:bg-surface" activeProps={{ className: "px-3 py-1.5 rounded-full bg-surface text-primary" }}>Pro</Link>
          </nav>
          <div className="flex items-center gap-2">
            {!loading && (user
              ? <Link to="/profile" className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-surface-2">Профиль</Link>
              : <Link to="/auth" className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold shadow-pop hover:opacity-90 inline-flex items-center gap-1.5"><Sparkles className="size-3.5" />Войти</Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border mt-12 py-8 text-center text-sm text-muted-foreground">
        Сделано с 🧡 для юных мыслителей · SudoKids 2026
      </footer>
    </div>
  );
}
