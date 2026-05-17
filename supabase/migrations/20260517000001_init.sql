-- open-recruiter initial schema.
-- Tables: jobs, candidates. Storage: resumes. RLS enforces recruiter ownership;
-- anonymous candidates can submit through a narrow surface only.

create extension if not exists "pgcrypto";

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  resume_path text not null,
  parsed jsonb,
  score int check (score is null or (score between 0 and 100)),
  rationale text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index candidates_job_id_idx on public.candidates(job_id);
create index candidates_score_idx on public.candidates(job_id, score desc nulls last);

alter table public.jobs enable row level security;
alter table public.candidates enable row level security;

create policy "Recruiters read their own jobs"
  on public.jobs
  for select
  to authenticated
  using (created_by = auth.uid());

create policy "Recruiters insert jobs as themselves"
  on public.jobs
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Recruiters update their own jobs"
  on public.jobs
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Recruiters delete their own jobs"
  on public.jobs
  for delete
  to authenticated
  using (created_by = auth.uid());

create policy "Anyone can submit a candidate"
  on public.candidates
  for insert
  to anon, authenticated
  with check (true);

create policy "Recruiters read their own candidates"
  on public.candidates
  for select
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = candidates.job_id and j.created_by = auth.uid()
    )
  );

create policy "Recruiters update their own candidates"
  on public.candidates
  for update
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = candidates.job_id and j.created_by = auth.uid()
    )
  );

create or replace function public.get_job_by_slug(p_slug text)
returns table (id uuid, slug text, title text, description text)
language sql
security definer
set search_path = public
as $$
  select j.id, j.slug, j.title, j.description
  from public.jobs j
  where j.slug = p_slug
$$;

revoke all on function public.get_job_by_slug(text) from public;
grant execute on function public.get_job_by_slug(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can upload a resume"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'resumes');

create policy "Recruiters read resumes they own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and exists (
      select 1
      from public.candidates c
      join public.jobs j on j.id = c.job_id
      where c.resume_path = storage.objects.name
        and j.created_by = auth.uid()
    )
  );
