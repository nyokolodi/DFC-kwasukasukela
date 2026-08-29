-- DFC authentication, RLS and private storage.
-- IMPORTANT: role changes are manager-only; clients cannot promote themselves.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare new_family uuid;
begin
  insert into public.profiles(id,display_name)
  values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(coalesce(new.email,''),'@',1),'Family User'));

  insert into public.families(owner_id,name)
  values(new.id,'My Family')
  returning id into new_family;

  insert into public.family_members(family_id,user_id,relationship)
  values(new_family,new.id,'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid()
      and role in ('moderator','content_manager','finance_manager','platform_admin')
  );
$$;

create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.family_members
    where family_id=p_family_id and user_id=auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.child_profiles enable row level security;
alter table public.storyteller_applications enable row level security;
alter table public.storyteller_profiles enable row level security;
alter table public.languages enable row level security;
alter table public.cultures enable row level security;
alter table public.stories enable row level security;
alter table public.story_audio_assets enable row level security;
alter table public.story_transcripts enable row level security;
alter table public.fire_circles enable row level security;
alter table public.circle_reservations enable row level security;
alter table public.circle_attendance enable row level security;
alter table public.listening_progress enable row level security;
alter table public.content_reports enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: users may edit their own safe profile fields, but never their role.
create policy "profiles own read"
on public.profiles for select
using(id=auth.uid() or public.is_manager());

create policy "profiles own safe update"
on public.profiles for update
using(id=auth.uid() or public.is_manager())
with check(
  public.is_manager()
  or (id=auth.uid() and role = (select p.role from public.profiles p where p.id=auth.uid()))
);

create policy "profiles manager insert"
on public.profiles for insert
with check(public.is_manager());

-- Family access.
create policy "families member read"
on public.families for select
using(public.is_family_member(id) or public.is_manager());

create policy "families owner insert"
on public.families for insert
with check(owner_id=auth.uid() or public.is_manager());

create policy "families owner update"
on public.families for update
using(owner_id=auth.uid() or public.is_manager())
with check(owner_id=auth.uid() or public.is_manager());

create policy "family members read"
on public.family_members for select
using(user_id=auth.uid() or public.is_manager());

create policy "family owner manages members"
on public.family_members for all
using(
  public.is_manager()
  or exists(select 1 from public.families f where f.id=family_id and f.owner_id=auth.uid())
)
with check(
  public.is_manager()
  or exists(select 1 from public.families f where f.id=family_id and f.owner_id=auth.uid())
);

create policy "children family all"
on public.child_profiles for all
using(public.is_family_member(family_id) or public.is_manager())
with check(public.is_family_member(family_id) or public.is_manager());

-- Elder applications and profiles.
create policy "applications own insert"
on public.storyteller_applications for insert
with check(user_id=auth.uid());

create policy "applications own read"
on public.storyteller_applications for select
using(user_id=auth.uid() or public.is_manager());

create policy "applications own update"
on public.storyteller_applications for update
using(user_id=auth.uid() or public.is_manager())
with check(user_id=auth.uid() or public.is_manager());

create policy "storyteller profiles read"
on public.storyteller_profiles for select
using(verified=true or user_id=auth.uid() or public.is_manager());

create policy "storyteller profiles manager write"
on public.storyteller_profiles for all
using(public.is_manager())
with check(public.is_manager());

-- Public reference data.
create policy "public reference data"
on public.languages for select using(true);
create policy "public cultures"
on public.cultures for select using(true);

-- Stories: only published stories are publicly visible; all management is manager-only.
create policy "published stories public"
on public.stories for select
using(status='published' or public.is_manager());

create policy "manager stories"
on public.stories for all
using(public.is_manager())
with check(public.is_manager());

create policy "published audio metadata"
on public.story_audio_assets for select
using(approved=true or public.is_manager());

create policy "manager audio"
on public.story_audio_assets for all
using(public.is_manager())
with check(public.is_manager());

create policy "published transcripts"
on public.story_transcripts for select
using(exists(select 1 from public.stories s where s.id=story_id and s.status='published') or public.is_manager());

create policy "manager transcripts"
on public.story_transcripts for all
using(public.is_manager())
with check(public.is_manager());

-- Fire circles.
create policy "upcoming circles public"
on public.fire_circles for select
using(status in ('scheduled','live','completed') or public.is_manager());

create policy "manager circles"
on public.fire_circles for all
using(public.is_manager())
with check(public.is_manager());

create policy "family reservations"
on public.circle_reservations for select
using(public.is_manager() or public.is_family_member(family_id));

create policy "family reservation create"
on public.circle_reservations for insert
with check(public.is_family_member(family_id) or public.is_manager());

create policy "family reservation update"
on public.circle_reservations for update
using(public.is_family_member(family_id) or public.is_manager())
with check(public.is_family_member(family_id) or public.is_manager());

create policy "attendance own read"
on public.circle_attendance for select
using(user_id=auth.uid() or public.is_manager());

create policy "attendance manager write"
on public.circle_attendance for all
using(public.is_manager())
with check(public.is_manager());

-- Listening progress belongs to the family member managing the child.
create policy "listening progress family"
on public.listening_progress for all
using(
  exists(
    select 1 from public.child_profiles cp
    where cp.id=child_profile_id and public.is_family_member(cp.family_id)
  ) or public.is_manager()
)
with check(
  exists(
    select 1 from public.child_profiles cp
    where cp.id=child_profile_id and public.is_family_member(cp.family_id)
  ) or public.is_manager()
);

-- Reports and audit.
create policy "reports create"
on public.content_reports for insert
with check(reporter_id=auth.uid());

create policy "reports manager read"
on public.content_reports for select
using(public.is_manager());

create policy "reports manager update"
on public.content_reports for update
using(public.is_manager())
with check(public.is_manager());

create policy "audit manager"
on public.audit_log for select
using(public.is_manager());

create policy "audit manager insert"
on public.audit_log for insert
with check(public.is_manager() or actor_id=auth.uid());

-- Private media buckets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
('story-audio-private','story-audio-private',false,104857600,array['audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/x-wav']),
('story-covers-public','story-covers-public',true,10485760,array['image/jpeg','image/png','image/webp']),
('elder-submissions-private','elder-submissions-private',false,104857600,array['audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/x-wav'])
on conflict(id) do nothing;

-- IMPORTANT: there is deliberately NO authenticated-user read policy for story-audio-private.
-- Audio is issued through the server-side stream function after entitlement/access checks.
create policy "manager story audio write"
on storage.objects for all to authenticated
using(bucket_id='story-audio-private' and public.is_manager())
with check(bucket_id='story-audio-private' and public.is_manager());

create policy "public covers read"
on storage.objects for select
using(bucket_id='story-covers-public');

create policy "elder own submission upload"
on storage.objects for insert to authenticated
with check(
  bucket_id='elder-submissions-private'
  and (storage.foldername(name))[1]=auth.uid()::text
);

create policy "elder own submission read"
on storage.objects for select to authenticated
using(
  bucket_id='elder-submissions-private'
  and ((storage.foldername(name))[1]=auth.uid()::text or public.is_manager())
);

create policy "manager elder submission write"
on storage.objects for all to authenticated
using(bucket_id='elder-submissions-private' and public.is_manager())
with check(bucket_id='elder-submissions-private' and public.is_manager());
