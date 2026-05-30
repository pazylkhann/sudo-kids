# SudoKids

Судоку для детей 6–12 лет. Не просто сетка с цифрами: есть подсказки, уроки, общий пазл на день и наставник, который объясняет ход простыми словами.

Демо: [открыть в браузере](https://id-preview--275d6468-9c12-4d97-b6f4-66f4da4b84f4.lovable.app)

## Зачем

Ребёнку сложно разобраться в классических приложениях — там взрослый интерфейс и никто не объясняет, *почему* ставить именно эту цифру. Здесь размер поля можно выбрать (4×4, 6×6, 9×9), сложность подстраивается, а AI Coach отвечает на вопросы по текущей позиции.

## Основное

- Игра: заметки в клетках, отмена хода, проверка ошибок, таймер
- Daily Challenge — один пазл на всех на сутки
- Лидерборд (общий и по городу)
- Стрики и стикеры за серии без ошибок и без подсказок
- Раздел с техниками (naked single, hidden single и т.д.)
- Вход по email или Google
- Pro ($4.99/мес): больше запросов к наставнику, темы, стикеры — сейчас включается демо-кнопкой; Stripe ещё не подключён

## Стек

React 19, TanStack Start, Tailwind v4, Supabase (auth + Postgres + RLS), AI через Lovable Gateway (Gemini).

## Структура проекта

```
src/
  lib/sudoku/engine.ts     — генерация и решение пазлов
  lib/puzzles.functions.ts
  lib/coach.functions.ts
  lib/profile.functions.ts
  components/SudokuGame.tsx
  routes/                  — play, daily, leaderboard, profile, learn, pricing, auth
supabase/migrations/       — схема БД
```

Таблицы: `profiles`, `puzzles`, `daily_puzzles`, `daily_results`, `game_sessions`, `achievements`, `ai_coach_usage`. Доступ с клиента через RLS; серверные функции ходят с авторизацией.

## Локальный запуск

```bash
bun install
# создайте .env с ключами Supabase и AI Gateway из панели Lovable
bun dev
```

## Дальше по плану

Stripe для реальной подписки, push про daily, дуэли в realtime, отчёт для родителей на почту.
