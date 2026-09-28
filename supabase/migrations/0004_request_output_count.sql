-- Design output count per request: one task title can represent multiple
-- design outputs (e.g. 5 hampers designs under one task). Statistics sum
-- this instead of counting task rows.
alter table public.requests add column if not exists output_count integer;

update public.requests
set output_count = 1
where output_count is null or output_count < 1;

alter table public.requests alter column output_count set default 1;
alter table public.requests alter column output_count set not null;

alter table public.requests drop constraint if exists requests_output_count_check;
alter table public.requests add constraint requests_output_count_check check (output_count >= 1);
