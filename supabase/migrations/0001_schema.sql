-- Request Wave schema: profiles, teams, categories, requests
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null check (role in ('PM', 'VIEWER')),
  initials text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id text primary key,
  name text not null unique,
  short_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id text primary key,
  request_code text not null,
  notion_id text not null,
  title text not null,
  team_id text not null references public.teams,
  category_id text not null references public.categories,
  requester_id uuid not null references public.profiles,
  designer_id uuid references public.profiles,
  request_date date not null,
  deadline date not null,
  completed_date date,
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null check (status in ('new', 'in_progress', 'waiting_feedback', 'revision', 'done', 'cancelled')),
  estimated_hours numeric not null check (estimated_hours >= 0),
  actual_hours numeric check (actual_hours >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_request_date_idx on public.requests (request_date);
create index if not exists requests_status_idx on public.requests (status);
create index if not exists requests_team_idx on public.requests (team_id);
create index if not exists requests_category_idx on public.requests (category_id);
create index if not exists requests_requester_idx on public.requests (requester_id);
create index if not exists requests_designer_idx on public.requests (designer_id);

create or replace function public.is_pm()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'PM'
  );
$$;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.categories enable row level security;
alter table public.requests enable row level security;

create policy "authenticated read profiles"
  on public.profiles for select to authenticated using (true);

create policy "user updates own profile (not role)"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "authenticated read teams"
  on public.teams for select to authenticated using (true);
create policy "pm write teams"
  on public.teams for all to authenticated
  using (public.is_pm()) with check (public.is_pm());

create policy "authenticated read categories"
  on public.categories for select to authenticated using (true);
create policy "pm write categories"
  on public.categories for all to authenticated
  using (public.is_pm()) with check (public.is_pm());

create policy "authenticated read requests"
  on public.requests for select to authenticated using (true);
create policy "pm write requests"
  on public.requests for all to authenticated
  using (public.is_pm()) with check (public.is_pm());
