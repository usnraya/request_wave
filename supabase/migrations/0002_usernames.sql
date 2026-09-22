-- Add unique username to profiles; backfill from name
alter table public.profiles add column if not exists username text;

-- Backfill: slugified name, disambiguated with a numeric suffix
update public.profiles p
set username = base.slug || case when dup.rn > 1 then dup.rn::text else '' end
from (
  select id,
    regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') as raw,
    row_number() over (partition by regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') order by created_at, id) as rn
  from public.profiles
) dup
cross join lateral (select 1) x
cross join lateral (select dup.raw) base(slug)
where p.id = dup.id and p.username is null;

-- Empty or punctuation-only names get an id-derived fallback.
update public.profiles
set username = 'user-' || substring(id::text from 1 for 8)
where username is null or username = '' or username = '-';

alter table public.profiles alter column username set not null;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));
