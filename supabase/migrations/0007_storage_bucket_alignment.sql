-- Historical migration already applied to production before timestamp history was normalized.
-- Kept in Git so Supabase GitHub integration can match the remote migration record.
insert into storage.buckets(id,name,public)
values('story-covers-public','story-covers-public',true)
on conflict(id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='public covers read'
  ) then
    create policy "public covers read"
      on storage.objects for select
      using(bucket_id='story-covers-public');
  end if;
end $$;
