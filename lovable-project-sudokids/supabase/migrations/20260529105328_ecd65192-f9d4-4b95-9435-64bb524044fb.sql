
-- ENUMS
create type public.app_role as enum ('user', 'admin');
create type public.puzzle_size as enum ('4', '6', '9');
create type public.puzzle_difficulty as enum ('easy', 'medium', 'hard');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  city text,
  age_group text,
  avatar text,
  is_pro boolean not null default false,
  stickers jsonb not null default '[]'::jsonb,
  streak_days int not null default 0,
  last_daily_date date,
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "profiles_select_all_auth" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "user_roles_self_select" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

-- PUZZLES
create table public.puzzles (
  id uuid primary key default gen_random_uuid(),
  size puzzle_size not null,
  difficulty puzzle_difficulty not null,
  seed text not null,
  given jsonb not null,      -- 2d array, 0 for empty
  solution jsonb not null,
  created_at timestamptz not null default now(),
  unique(seed, size, difficulty)
);
grant select on public.puzzles to authenticated, anon;
grant all on public.puzzles to service_role;
alter table public.puzzles enable row level security;
create policy "puzzles_read_all" on public.puzzles for select using (true);

-- DAILY PUZZLES
create table public.daily_puzzles (
  date date primary key,
  puzzle_id uuid not null references public.puzzles(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select on public.daily_puzzles to authenticated, anon;
grant all on public.daily_puzzles to service_role;
alter table public.daily_puzzles enable row level security;
create policy "daily_read_all" on public.daily_puzzles for select using (true);

-- GAME SESSIONS
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  puzzle_id uuid not null references public.puzzles(id) on delete cascade,
  state jsonb not null,         -- {board, notes, mistakes, hintsUsed, elapsedSec}
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  time_seconds int,
  mistakes int not null default 0,
  hints_used int not null default 0,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.game_sessions to authenticated;
grant all on public.game_sessions to service_role;
alter table public.game_sessions enable row level security;

create policy "sessions_own_select" on public.game_sessions
  for select to authenticated using (user_id = auth.uid());
create policy "sessions_own_insert" on public.game_sessions
  for insert to authenticated with check (user_id = auth.uid());
create policy "sessions_own_update" on public.game_sessions
  for update to authenticated using (user_id = auth.uid());
create policy "sessions_own_delete" on public.game_sessions
  for delete to authenticated using (user_id = auth.uid());

-- DAILY RESULTS (leaderboard)
create table public.daily_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  time_seconds int not null,
  mistakes int not null default 0,
  hints_used int not null default 0,
  score int not null,         -- computed: lower time + penalties
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
grant select, insert on public.daily_results to authenticated;
grant all on public.daily_results to service_role;
alter table public.daily_results enable row level security;

create policy "daily_results_read_all_auth" on public.daily_results
  for select to authenticated using (true);
create policy "daily_results_insert_own" on public.daily_results
  for insert to authenticated with check (user_id = auth.uid());

-- ACHIEVEMENTS
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  earned_at timestamptz not null default now(),
  unique(user_id, type)
);
grant select, insert on public.achievements to authenticated;
grant all on public.achievements to service_role;
alter table public.achievements enable row level security;
create policy "ach_own_select" on public.achievements
  for select to authenticated using (user_id = auth.uid());
create policy "ach_own_insert" on public.achievements
  for insert to authenticated with check (user_id = auth.uid());

-- AI COACH USAGE
create table public.ai_coach_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  count int not null default 0,
  primary key (user_id, date)
);
grant select, insert, update on public.ai_coach_usage to authenticated;
grant all on public.ai_coach_usage to service_role;
alter table public.ai_coach_usage enable row level security;
create policy "ai_usage_own" on public.ai_coach_usage
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Player'))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
