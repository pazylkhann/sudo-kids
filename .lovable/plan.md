# SudoKids — Sudoku, который влюбляет детей в логику

Платформа Судоку для детей 6–12 лет с дружелюбным AI-наставником, ежедневными челленджами, наградами и родительским режимом подписки.

## Позиционирование

- **Для кого:** дети 6–12 лет и их родители
- **Ценность:** превращаем «скучную головоломку» в утреннюю тренировку мозга с прогрессом, наклейками и AI-объяснениями простым языком
- **Почему выделяется:** ни один из массовых сайтов судоку не сделан *для детей* с AI-коучем и геймификацией

## Дизайн

Палитра **Morning Calm**: `#faf8f5` фон, `#f0ebe3` поверхности, `#c9b99a` нейтраль, `#e85d3a` акцент. Тёплый, мягкий, дружелюбный — не «детский кринж», а как Duolingo для логики. Скруглённые углы, крупная типографика (Fraunces + Nunito), микро-анимации на правильных ходах, sticker-style награды.

## Структура страниц

```
/                       Лендинг: герой, как работает, Daily, отзывы, pricing, CTA
/play                   Меню режимов: Daily, Свободная игра (4×4, 6×6, 9×9 easy/medium/hard), Обучение
/play/game/$id          Игровой экран: сетка, заметки, подсказки, AI Coach панель, таймер
/daily                  Ежедневный челлендж + лидерборд (общий и по городам)
/learn                  Уроки техник решения (naked single, hidden single и т.д.) от AI Coach
/profile                Прогресс, статистика, стикеры/награды, серия дней
/leaderboard            Глобальный + по городам
/pricing                Free vs Pro (кастомные темы/скины, безлимит подсказок, продвинутый AI)
/login, /signup         Email + Google
```

## Ключевые фичи

### Игровой движок (frontend)
- Генератор уникальных судоку для размеров 4×4, 6×6, 9×9 с уровнями easy/medium/hard
- Solver с подсчётом сложности (количество техник для решения)
- Ввод цифр, режим заметок (pencil marks), undo/redo
- Подсветка конфликтов (строка/столбец/квадрат), счётчик ошибок
- Подсказки: highlight cell → reveal candidate → reveal answer
- Таймер с паузой, авто-сохранение в Cloud + localStorage

### AI Coach (Lovable AI Gateway, Gemini 2.5 Flash)
- «Почему сюда подходит 7?» → объяснение на языке ребёнка
- «Подскажи следующий ход» → техника + пример (naked single, pointing pair)
- Уроки в `/learn`: интерактивные мини-сцены с объяснением

### Daily Challenge
- Один пазл в день, сид по дате (детерминированно)
- Таблица результатов: время + точность (штраф за ошибки/подсказки)
- Стрик дней подряд, награда-стикер за 7/30/100

### Социальный слой
- Глобальный лидерборд по Daily
- Лидерборд по городу (город из профиля, валидация необязательная)
- Профиль с публичной страницей и стикерами

### Монетизация
- **Free:** 3 пазла/день, базовый AI Coach (5 объяснений/день), стандартная тема
- **Pro ($4.99/мес):** безлимит пазлов и AI, кастомные темы/скины сетки, статистика родителей, эксклюзивные стикеры
- Кнопка «Upgrade to Pro» с заглушкой Stripe checkout (демо-уровень)

### Прочее
- Тёмная/светлая тема
- Адаптив: мобильная клавиатура цифр снизу, swipe для заметок
- Родительский режим: pin-код, ограничение времени за сессию

## Технический раздел

### Стек
- TanStack Start v1 + React 19 + Tailwind v4 (уже в шаблоне)
- Lovable Cloud (Supabase) для БД, auth, RLS
- Lovable AI Gateway (Gemini 2.5 Flash) для AI Coach
- Motion для анимаций (cell ripple, win confetti)

### База данных (Lovable Cloud)
```
profiles              (id→auth.users, display_name, city, age_group, avatar, is_pro, created_at)
user_roles            (user_id, role enum: user|admin)  -- паттерн has_role()
puzzles               (id, seed, size, difficulty, given jsonb, solution jsonb, created_at)
daily_puzzles         (date PK, puzzle_id)
game_sessions        (id, user_id, puzzle_id, started_at, finished_at, time_seconds, mistakes, hints_used, completed)
daily_results        (user_id, date, time_seconds, accuracy_score)  -- для лидерборда
achievements          (id, user_id, type, earned_at)
ai_coach_usage       (user_id, date, count)  -- rate-limit для free
```
RLS: каждый видит/пишет свои строки; `daily_results` и `profiles.display_name+city` читаются всеми авторизованными (для лидерборда); insert через `requireSupabaseAuth`-protected server functions.

### Server functions (`src/lib/*.functions.ts`)
- `generatePuzzle({size, difficulty})` — генератор на сервере, кэш в `puzzles`
- `getDailyPuzzle()` — выдаёт сегодняшний, создаёт при отсутствии
- `submitDailyResult({puzzleId, timeSec, mistakes, hintsUsed})`
- `getLeaderboard({scope: 'global'|'city'})`
- `askAICoach({puzzleState, question})` — Lovable AI, проверка лимита для free
- `saveGameSession`, `loadGameSession`

### Auth
- Email/password + Google (через Lovable broker + `configure_social_auth`)
- `_authenticated` layout для защищённых маршрутов (/play, /profile, /daily submit)
- Onboarding: спросить имя ребёнка, возраст, город (опционально)

### Что НЕ войдёт в MVP (для честности)
- Реальный Stripe — только UI + заглушка (demo upgrade toggle), отметим в README
- Мультиплеер реалтайм-дуэли
- Push-уведомления

## План реализации (по шагам)

1. Включить Lovable Cloud, создать схему БД + RLS
2. Дизайн-система: токены Morning Calm, шрифты, базовые компоненты
3. Sudoku engine: генератор, solver, валидатор (`src/lib/sudoku/`)
4. Игровой экран `/play/game/$id` со всеми механиками
5. Меню `/play` и onboarding
6. Daily Challenge + лидерборд
7. AI Coach (server fn + UI панель)
8. Профиль, статистика, стикеры
9. Лендинг `/` и `/pricing` с Upgrade-заглушкой
10. Тёмная тема, адаптив, polish
11. README.md с описанием продукта

После одобрения плана начну с шага 1.
