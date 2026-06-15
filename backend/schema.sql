-- ============================================================
--  CyberArena — Supabase / Postgres schema
--  Paste this whole file into the Supabase SQL Editor and RUN.
--  (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- ============================================================

-- gen_random_uuid() lives in pgcrypto (already enabled on Supabase,
-- but this is here for safety / self-hosted Postgres).
create extension if not exists pgcrypto;

-- ---------- TEAMS ----------
create table if not exists teams (
    id          uuid primary key default gen_random_uuid(),
    name        text unique not null,
    invite_code text unique not null,
    created_at  timestamptz default now()
);

-- ---------- USERS ----------
-- NOTE: password_hash never leaves the backend. The frontend only ever
-- reads safe columns through the views below (never the base table).
create table if not exists users (
    id            uuid primary key default gen_random_uuid(),
    username      text unique not null,
    password_hash text not null,
    reg_no        text unique not null,
    dp            text default '',
    bio           text default '',
    team_id       uuid references teams(id) on delete set null,
    created_at    timestamptz default now()
);

-- ---------- CHALLENGES (public metadata only — NO flags) ----------
-- app.py is the source of truth and upserts these rows on startup.
-- Flags + docker image/tar mapping stay in the backend code, never here.
create table if not exists challenges (
    id          text primary key,
    name        text not null,
    category    text not null,
    difficulty  text not null default 'Easy',
    points      int  not null default 100,
    description text default ''
);

-- ---------- SOLVES ----------
create table if not exists solves (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid references users(id) on delete cascade,
    challenge_id text references challenges(id) on delete cascade,
    points       int  not null,
    first_blood  boolean default false,
    solved_at    timestamptz default now(),
    unique (user_id, challenge_id)         -- a user can solve a challenge once
);

create index if not exists idx_solves_challenge on solves(challenge_id);
create index if not exists idx_solves_user      on solves(user_id);
create index if not exists idx_users_team        on users(team_id);

-- ============================================================
--  VIEWS  (safe, public-facing aggregates — no secrets)
-- ============================================================

-- Per-user score + solve count
create or replace view user_scores as
select
    u.id        as user_id,
    u.username,
    u.dp,
    u.team_id,
    coalesce(sum(s.points), 0)::int as points,
    count(s.id)::int                as solves
from users u
left join solves s on s.user_id = u.id
group by u.id, u.username, u.dp, u.team_id;

-- Team leaderboard (sum of all member solves)
create or replace view team_leaderboard as
select
    t.id        as team_id,
    t.name      as team_name,
    coalesce(sum(s.points), 0)::int  as points,
    count(s.id)::int                 as solves,
    count(distinct u.id)::int        as members
from teams t
left join users u on u.team_id = t.id
left join solves s on s.user_id = u.id
group by t.id, t.name;

-- ============================================================
--  ROW LEVEL SECURITY + REALTIME
--  The backend connects as the 'postgres' role (via the connection
--  string) and BYPASSES RLS, so it can read/write everything.
--  The browser uses the ANON key and only needs to *read* solves
--  to trigger live leaderboard refreshes. solves has no secrets.
-- ============================================================

alter table solves enable row level security;

drop policy if exists "public read solves" on solves;
create policy "public read solves"
    on solves for select
    using (true);

-- Lock the other base tables down from the anon key entirely
-- (frontend never touches them directly; it goes through Flask).
alter table users      enable row level security;
alter table teams      enable row level security;
alter table challenges enable row level security;

drop policy if exists "public read challenges" on challenges;
create policy "public read challenges"
    on challenges for select
    using (true);

-- Enable Realtime broadcasts on the solves table so the scoreboard
-- updates the instant anyone scores.
alter publication supabase_realtime add table solves;
