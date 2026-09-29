-- =====================================================================
-- Nila — Supabase Initial Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =====================================================================

-- ─── Places ──────────────────────────────────────────────────────────
create table if not exists places (
  id          text primary key,
  name        text not null,
  emoji       text not null,
  color       text not null,
  lat         double precision not null,
  lng         double precision not null,
  radius      integer not null default 150,
  address     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Tasks ───────────────────────────────────────────────────────────
create table if not exists tasks (
  id            text primary key,
  place_id      text references places(id) on delete cascade,
  title         text not null,
  description   text,
  priority      text not null default 'medium',
  due_date      text,
  due_time      text,
  time_start    text,
  time_end      text,
  repeat        text not null default 'none',
  completed     boolean not null default false,
  completed_at  timestamptz,
  trigger_type  text not null default 'NONE',
  alert_sound   text default 'chime',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Notes ───────────────────────────────────────────────────────────
create table if not exists notes (
  id          text primary key,
  place_id    text references places(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  tags        text[] default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Checklists ───────────────────────────────────────────────────────
create table if not exists checklists (
  id          text primary key,
  place_id    text references places(id) on delete cascade,
  journey_id  text,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Checklist Items ──────────────────────────────────────────────────
create table if not exists checklist_items (
  id           text primary key,
  checklist_id text not null references checklists(id) on delete cascade,
  text         text not null,
  completed    boolean not null default false,
  "order"      integer not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── Reminders ────────────────────────────────────────────────────────
create table if not exists reminders (
  id           text primary key,
  place_id     text references places(id) on delete cascade,
  task_id      text references tasks(id) on delete cascade,
  title        text not null,
  trigger_type text not null default 'NONE',
  enabled      boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Rules ────────────────────────────────────────────────────────────
create table if not exists rules (
  id                text primary key,
  place_id          text not null references places(id) on delete cascade,
  trigger_event     text not null,
  conditions        jsonb not null default '{}',
  actions           text[] not null default '{}',
  actions_triggered text[] not null default '{}',
  enabled           boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── Journeys ─────────────────────────────────────────────────────────
create table if not exists journeys (
  id                    text primary key,
  name                  text not null,
  status                text not null default 'planned',
  transport_mode        text,
  start_name            text not null,
  start_lat             double precision not null,
  start_lng             double precision not null,
  dest_name             text not null,
  dest_lat              double precision not null,
  dest_lng              double precision not null,
  alert_distance        integer not null default 1000,
  start_place_id        text,
  end_place_id          text,
  start_address         text,
  end_address           text,
  alert_distance_meters integer,
  scheduled_at          timestamptz,
  started_at            timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Journey Stations ─────────────────────────────────────────────────
create table if not exists journey_stations (
  id          text primary key,
  journey_id  text not null references journeys(id) on delete cascade,
  name        text not null,
  lat         double precision not null,
  lng         double precision not null,
  "order"     integer not null default 0,
  reached     boolean not null default false,
  reached_at  timestamptz,
  created_at  timestamptz default now()
);

-- ─── Notification History ─────────────────────────────────────────────
create table if not exists notification_history (
  id              text primary key,
  place_id        text,
  type            text not null,
  sent_at         timestamptz not null default now(),
  cooldown_until  timestamptz not null,
  expires_at      timestamptz
);

-- ─── Settings ─────────────────────────────────────────────────────────
create table if not exists settings (
  key    text primary key,
  value  jsonb not null
);

-- ─── Users ────────────────────────────────────────────────────────────
create table if not exists users (
  id             text primary key,
  name           text not null,
  email          text not null unique,
  password_hash  text not null,
  role           text not null default 'user',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── AI Chat Messages ─────────────────────────────────────────────────
create table if not exists ai_chat_messages (
  id          text primary key,
  user_id     text not null references users(id) on delete cascade,
  role        text not null, -- 'user' | 'assistant'
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ─── AI Usage Tracking ────────────────────────────────────────────────
create table if not exists ai_usage (
  user_id      text primary key references users(id) on delete cascade,
  prompt_count integer not null default 0,
  updated_at   timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────
create index if not exists idx_tasks_place_id      on tasks(place_id);
create index if not exists idx_tasks_completed     on tasks(completed);
create index if not exists idx_notes_place_id      on notes(place_id);
create index if not exists idx_checklists_place_id on checklists(place_id);
create index if not exists idx_rules_place_id      on rules(place_id);
create index if not exists idx_journey_stations_journey_id on journey_stations(journey_id);
create index if not exists idx_ai_chat_user_id     on ai_chat_messages(user_id);
create index if not exists idx_users_email         on users(email);
