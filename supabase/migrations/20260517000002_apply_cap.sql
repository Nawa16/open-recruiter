-- Per-job application cap.
-- Adds max_applications to jobs, a BEFORE INSERT trigger that enforces the
-- cap on candidate submissions, and replaces get_job_by_slug to surface the
-- live count + an "accepting" boolean used by the public apply page.

alter table public.jobs
  add column if not exists max_applications int not null default 50
  check (max_applications > 0 and max_applications <= 10000);

create or replace function public.enforce_application_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int;
  cnt int;
begin
  select max_applications into cap from public.jobs where id = new.job_id;
  if cap is null then return new; end if;
  select count(*) into cnt from public.candidates where job_id = new.job_id;
  if cnt >= cap then
    raise exception 'application cap reached for job %', new.job_id
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_cap_before_insert on public.candidates;
create trigger enforce_cap_before_insert
  before insert on public.candidates
  for each row execute function public.enforce_application_cap();

drop function if exists public.get_job_by_slug(text);

create or replace function public.get_job_by_slug(p_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  max_applications int,
  current_count int,
  accepting boolean
)
language sql
security definer
set search_path = public
as $$
  select
    j.id,
    j.slug,
    j.title,
    j.description,
    j.max_applications,
    (select count(*) from public.candidates c where c.job_id = j.id)::int as current_count,
    ((select count(*) from public.candidates c where c.job_id = j.id) < j.max_applications) as accepting
  from public.jobs j
  where j.slug = p_slug;
$$;

revoke all on function public.get_job_by_slug(text) from public;
grant execute on function public.get_job_by_slug(text) to anon, authenticated;
