# SudoKids 🧠✨

**Sudoku, который влюбляет детей в логику.**

Полнофункциональная веб-платформа Судоку для детей 6–12 лет, с AI-наставником, ежедневными челленджами, лидербордами по городам, стикерами и Pro-подпиской.

🔗 **Живой проект:** [SudoKids в Lovable](https://id-preview--275d6468-9c12-4d97-b6f4-66f4da4b84f4.lovable.app)

## Для кого

Дети 6–12 лет и их родители. Альтернатива бесконечному скроллу — утренний ритуал тренировки мозга.

## Почему это ценно

Сайтов для Судоку — тысячи. Но **ни один** не сделан специально для детей с AI-наставником, который объясняет ходы на их языке. SudoKids превращает скучную головоломку в Duolingo для логики.

## Что внутри (уровень «Великий» по ТЗ)

| Фича | Реализовано |
|---|---|
| Генератор уникальных пазлов 4×4, 6×6, 9×9 с тремя уровнями сложности | ✅ |
| Solver с проверкой уникальности решения | ✅ |
| Заметки в клетках (pencil marks), подсказки, undo, проверка конфликтов | ✅ |
| Таймер, счётчик ошибок и подсказок | ✅ |
| Тёмная/светлая тема, адаптивный мобильный UI | ✅ |
| **AI Coach** — объясняет ходы и обучает техникам (Lovable AI · Gemini 2.5 Flash) | ✅ |
| **Daily Challenge** — общий пазл на день, детерминированный сид | ✅ |
| **Стрики и стикеры** — 7/30 дней подряд, без ошибок, без подсказок | ✅ |
| **Глобальный лидерборд + по городам** (например, Алматы) | ✅ |
| Уроки техник (naked single, hidden single, naked pair, сканирование) | ✅ |
| Авторизация Email/password + Google OAuth | ✅ |
| Pro-подписка ($4.99/мес): безлимит AI, кастомные темы, эксклюзивные стикеры | ✅ (UI + демо-кнопка) |
| Реальный Stripe checkout | ⏳ В разработке (демо-режим включает Pro кнопкой) |

## Стек

- **Frontend:** TanStack Start v1 (React 19 + SSR), Tailwind v4, Motion для анимаций
- **Backend:** Lovable Cloud (PostgreSQL + Auth + RLS), TanStack server functions
- **AI:** Lovable AI Gateway → Gemini 2.5 Flash
- **Дизайн:** оригинальная палитра «Morning Calm» (тёплый минимализм), типографика Fraunces + Nunito

## Архитектура

```
src/
├── lib/
│   ├── sudoku/engine.ts        — генератор, solver, hint-engine, валидатор
│   ├── puzzles.functions.ts    — daily, лидерборд, submit (server fn)
│   ├── coach.functions.ts      — AI Coach + rate-limit для Free
│   ├── profile.functions.ts    — профиль, стикеры, статистика, Pro upgrade
│   └── ai-gateway.server.ts    — обёртка Lovable AI Gateway
├── components/SudokuGame.tsx   — игровой движок (UI), панель AI Coach
├── routes/
│   ├── index.tsx               — лендинг
│   ├── play.tsx                — свободная игра
│   ├── daily.tsx               — Daily Challenge + мини-лидерборд
│   ├── leaderboard.tsx         — глобальный/city
│   ├── profile.tsx             — стрик, стикеры, настройки, Pro
│   ├── learn.tsx               — техники решения
│   ├── pricing.tsx             — Free vs Pro
│   └── auth.tsx                — login/signup + Google
```

## База данных

- `profiles` — игроки (имя, город, возраст, стрик, Pro)
- `puzzles` + `daily_puzzles` — кэш сгенерированных пазлов
- `daily_results` — лидерборд
- `game_sessions` — авто-сохранение партий
- `achievements` — заработанные стикеры
- `ai_coach_usage` — rate-limit для Free
- `user_roles` + `has_role()` — паттерн ролей без рекурсии в RLS

Все таблицы под RLS, server-fns используют `requireSupabaseAuth`.

## Что бы я добавил дальше

- Реальный Stripe webhook → активация Pro
- Realtime-дуэли на скорость (Supabase Realtime)
- Push-уведомления о Daily
- Родительский pin-код и недельный отчёт по email
- iOS/Android wrapper через Capacitor

---

Сделано с 🧡 для юных мыслителей. SudoKids, 2026.
