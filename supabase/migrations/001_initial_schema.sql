-- ============================================
-- Symphix Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- Profiles table — extends Supabase auth.users
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto profile creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Workflows table — stores user workflows
-- ============================================
create table if not exists public.workflows (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  status text default 'draft' check (status in ('draft', 'running', 'completed', 'failed', 'cancelled')),
  agents jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  completed_at timestamptz
);

-- ============================================
-- Workflow Runs — individual execution records
-- ============================================
create table if not exists public.workflow_runs (
  id uuid default uuid_generate_v4() primary key,
  workflow_id uuid references public.workflows(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'running' check (status in ('running', 'completed', 'failed', 'cancelled')),
  logs jsonb default '[]'::jsonb,
  result text,
  feedback text check (feedback in ('up', 'down')),
  started_at timestamptz default now() not null,
  completed_at timestamptz
);

-- ============================================
-- Row Level Security — privacy first
-- ============================================

alter table public.profiles enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Workflows: users can CRUD their own
create policy "Users can view own workflows" on public.workflows
  for select using (auth.uid() = user_id);
create policy "Users can create workflows" on public.workflows
  for insert with check (auth.uid() = user_id);
create policy "Users can update own workflows" on public.workflows
  for update using (auth.uid() = user_id);
create policy "Users can delete own workflows" on public.workflows
  for delete using (auth.uid() = user_id);

-- Runs: users can CRUD their own
create policy "Users can view own runs" on public.workflow_runs
  for select using (auth.uid() = user_id);
create policy "Users can create runs" on public.workflow_runs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own runs" on public.workflow_runs
  for update using (auth.uid() = user_id);

-- Index for fast queries
create index if not exists idx_workflows_user_id on public.workflows(user_id);
create index if not exists idx_workflow_runs_workflow_id on public.workflow_runs(workflow_id);
create index if not exists idx_workflow_runs_user_id on public.workflow_runs(user_id);
