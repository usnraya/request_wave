-- Full Designer Monitor schema bootstrap.
-- Safe to run before the incremental migrations in this directory.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null,
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
  request_code text not null unique,
  notion_id text not null,
  title text not null,
  team_id text not null references public.teams(id),
  category_id text not null references public.categories(id),
  requester_id uuid not null references public.profiles(id),
  designer_id uuid references public.profiles(id),
  request_date date not null,
  deadline date not null,
  completed_date date,
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null check (status in ('new', 'in_progress', 'waiting_feedback', 'revision', 'done', 'cancelled')),
  estimated_hours numeric not null check (estimated_hours >= 0),
  actual_hours numeric check (actual_hours >= 0),
  description text,
  figma_url text,
  drive_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));
create index if not exists requests_request_date_idx on public.requests (request_date);
create index if not exists requests_status_idx on public.requests (status);
create index if not exists requests_team_idx on public.requests (team_id);
create index if not exists requests_category_idx on public.requests (category_id);
create index if not exists requests_requester_idx on public.requests (requester_id);
create index if not exists requests_designer_idx on public.requests (designer_id);

insert into public.teams (id, name, short_name) values
  ('expansion', 'Expansion', 'EXP'),
  ('marketing-online', 'Marketing Team Online', 'MKT Online'),
  ('curriculum', 'Curriculum', 'CUR'),
  ('hq', 'HQ', 'HQ'),
  ('hisensei', 'Hisensei', 'HIS'),
  ('overseas', 'Overseas', 'OVR'),
  ('ycwc', 'Big Event YCWC', 'YCWC'),
  ('marketing-offline', 'Marketing Team Offline', 'MKT Offline'),
  ('playschool', 'Playschool', 'PLAY'),
  ('timedoor', 'Timedoor', 'TDR')
on conflict (id) do update set name = excluded.name, short_name = excluded.short_name;

insert into public.categories (id, name) values
  ('general', 'General Request'),
  ('content-social', 'Content Media Social'),
  ('branch', 'Branch Interior & Exterior'),
  ('web', 'WEB'),
  ('marketing-ads', 'Marketing Things / ADS'),
  ('lms', 'LMS'),
  ('footage', 'Collect Footage'),
  ('internal', 'Internal / Coordination'),
  ('campaign', 'Campaign / Event'),
  ('merchandise', 'Merchandise'),
  ('guideline', 'Guideline'),
  ('teacher-support', 'Teacher Support'),
  ('training', 'Training / Team Development'),
  ('certificate', 'Certificate'),
  ('hiring', 'Hiring'),
  ('offline-ads', 'Offline Ads'),
  ('greetings', 'Greetings'),
  ('curriculum-materials', 'Curriculum Materials'),
  ('team-system', 'Team System'),
  ('uniform', 'Uniform Design')
on conflict (id) do update set name = excluded.name;

create or replace function public.is_pm()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'PM'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.categories enable row level security;
alter table public.requests enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'full authenticated read profiles') then
    create policy "full authenticated read profiles" on public.profiles for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'full user updates own profile') then
    create policy "full user updates own profile" on public.profiles for update to authenticated
      using (id = auth.uid())
      with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'teams' and policyname = 'full authenticated read teams') then
    create policy "full authenticated read teams" on public.teams for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'teams' and policyname = 'full pm write teams') then
    create policy "full pm write teams" on public.teams for all to authenticated using (public.is_pm()) with check (public.is_pm());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'full authenticated read categories') then
    create policy "full authenticated read categories" on public.categories for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'full pm write categories') then
    create policy "full pm write categories" on public.categories for all to authenticated using (public.is_pm()) with check (public.is_pm());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'requests' and policyname = 'full authenticated read requests') then
    create policy "full authenticated read requests" on public.requests for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'requests' and policyname = 'full pm write requests') then
    create policy "full pm write requests" on public.requests for all to authenticated using (public.is_pm()) with check (public.is_pm());
  end if;
end;
$$;
