alter table public.requests
  add column if not exists figma_url text,
  add column if not exists drive_url text;
