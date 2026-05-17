-- Recruiters can delete resumes belonging to their own jobs. Keyed on the
-- storage path prefix (slug/) rather than the candidates table, so cleanup
-- still works for files orphaned by a job deletion.

drop policy if exists "Recruiters delete resumes for their jobs" on storage.objects;

create policy "Recruiters delete resumes for their jobs"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'resumes'
    and exists (
      select 1 from public.jobs j
      where j.created_by = auth.uid()
        and storage.objects.name like j.slug || '/%'
    )
  );
