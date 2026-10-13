-- ============================================================
-- FILE: supabase/schema.sql
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Students table
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  class_name text not null,
  parent_name text not null,
  parent_email text not null,
  created_at timestamptz default now()
);

-- Behavior badges table
create table if not exists behavior_badges (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  badge_type text not null,       -- e.g. 'helpful', 'focused', 'creative'
  badge_emoji text not null,      -- e.g. '⭐', '📝', '🎨'
  badge_label text not null,      -- e.g. 'Helpful', 'Focused', 'Creative'
  notes text,                     -- optional teacher note
  awarded_by text not null,       -- teacher name
  awarded_at timestamptz default now()
);

-- Email queue table
create table if not exists email_queue (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  parent_email text not null,
  subject text not null,
  body text not null,
  status text default 'pending',  -- pending | approved | sent | failed
  approved_at timestamptz,
  sent_at timestamptz,
  tracking_token uuid default uuid_generate_v4(),  -- for open tracking
  opened_at timestamptz,                            -- null until opened
  created_at timestamptz default now()
);

-- Email analytics table
create table if not exists email_analytics (
  id uuid primary key default uuid_generate_v4(),
  email_id uuid references email_queue(id) on delete cascade,
  event_type text not null,       -- 'opened'
  recorded_at timestamptz default now(),
  user_agent text,
  ip_address text
);

-- RLS Policies (Row Level Security) - basic open policy for dev
alter table students enable row level security;
alter table behavior_badges enable row level security;
alter table email_queue enable row level security;
alter table email_analytics enable row level security;

create policy "Allow all for now" on students for all using (true);
create policy "Allow all for now" on behavior_badges for all using (true);
create policy "Allow all for now" on email_queue for all using (true);
create policy "Allow all for now" on email_analytics for all using (true);

-- Seed sample students
insert into students (name, class_name, parent_name, parent_email) values
  ('Arjun Sharma', 'Class 6A', 'Ramesh Sharma', 'ramesh.sharma@example.com'),
  ('Priya Patel', 'Class 6A', 'Sunita Patel', 'sunita.patel@example.com'),
  ('Riya Mehta', 'Class 6B', 'Deepa Mehta', 'deepa.mehta@example.com'),
  ('Kabir Singh', 'Class 6B', 'Gurpreet Singh', 'gurpreet.singh@example.com'),
  ('Ananya Roy', 'Class 6A', 'Subrata Roy', 'subrata.roy@example.com')
on conflict do nothing;
