create extension if not exists pgcrypto;
create type public.app_role as enum('family_owner','family_member','elder_applicant','storyteller','teacher','school_admin','moderator','content_manager','finance_manager','platform_admin');
create type public.review_status as enum('draft','submitted','review','approved','rejected','published','archived');
create type public.access_level as enum('public','subscriber','school','restricted');
create type public.circle_status as enum('draft','scheduled','live','completed','cancelled');

create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,display_name text,phone text,role public.app_role not null default 'family_owner',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.families(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id) on delete cascade,name text not null default 'My Family',created_at timestamptz not null default now());
create table public.family_members(family_id uuid references public.families(id) on delete cascade,user_id uuid references public.profiles(id) on delete cascade,relationship text not null default 'guardian',primary key(family_id,user_id));
create table public.child_profiles(id uuid primary key default gen_random_uuid(),family_id uuid not null references public.families(id) on delete cascade,display_name text not null,birth_year int check(birth_year between 2000 and 2100),preferred_languages text[] not null default '{}',created_at timestamptz not null default now());

create table public.storyteller_applications(id uuid primary key default gen_random_uuid(),user_id uuid unique not null references public.profiles(id) on delete cascade,display_name text not null,phone text not null,languages text[] not null,community text not null,biography text not null,status text not null default 'submitted' check(status in('draft','submitted','approved','rejected')),review_notes text,reviewed_by uuid references public.profiles(id),reviewed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.storyteller_profiles(id uuid primary key default gen_random_uuid(),user_id uuid unique not null references public.profiles(id) on delete cascade,public_name text not null,biography text,community text,verified boolean not null default false,created_at timestamptz not null default now());

create table public.languages(id uuid primary key default gen_random_uuid(),code text unique not null,name text unique not null);
create table public.cultures(id uuid primary key default gen_random_uuid(),name text unique not null,description text);
create table public.stories(id uuid primary key default gen_random_uuid(),slug text unique not null,title text not null,original_title text,summary text not null,language_id uuid not null references public.languages(id),culture_id uuid references public.cultures(id),storyteller_id uuid references public.storyteller_profiles(id),age_min int not null default 4,age_max int not null default 12,themes text[] not null default '{}',moral_lesson text,historical_context text,rights_holder text,rights_notes text,cultural_restrictions text,access_level public.access_level not null default 'public',status public.review_status not null default 'draft',published_at timestamptz,created_by uuid references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.story_audio_assets(id uuid primary key default gen_random_uuid(),story_id uuid not null references public.stories(id) on delete cascade,variant text not null check(variant in('master','standard','low_data')),storage_path text not null,mime_type text,duration_seconds int,file_size_bytes bigint,approved boolean not null default false,created_at timestamptz not null default now(),unique(story_id,variant));
create table public.story_transcripts(id uuid primary key default gen_random_uuid(),story_id uuid not null references public.stories(id) on delete cascade,language_id uuid not null references public.languages(id),transcript text not null,is_translation boolean not null default false,created_at timestamptz not null default now());

create table public.fire_circles(id uuid primary key default gen_random_uuid(),title text not null,description text,storyteller_id uuid references public.storyteller_profiles(id),starts_at timestamptz not null,ends_at timestamptz,capacity int not null default 100 check(capacity between 1 and 10000),status public.circle_status not null default 'draft',livekit_room_name text unique not null default('dfc-'||gen_random_uuid()::text),recording_allowed boolean not null default false,created_by uuid references public.profiles(id),created_at timestamptz not null default now());
create table public.circle_reservations(id uuid primary key default gen_random_uuid(),circle_id uuid not null references public.fire_circles(id) on delete cascade,family_id uuid not null references public.families(id) on delete cascade,seats int not null default 1 check(seats between 1 and 10),status text not null default 'confirmed',created_at timestamptz not null default now(),unique(circle_id,family_id));
create table public.circle_attendance(id uuid primary key default gen_random_uuid(),circle_id uuid not null references public.fire_circles(id) on delete cascade,user_id uuid references public.profiles(id) on delete cascade,joined_at timestamptz not null default now(),left_at timestamptz,seconds_present int);

create table public.content_entitlements(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id) on delete cascade,plan text not null,starts_at timestamptz not null default now(),ends_at timestamptz,active boolean not null default true,created_at timestamptz not null default now());
create table public.listening_progress(id uuid primary key default gen_random_uuid(),child_profile_id uuid not null references public.child_profiles(id) on delete cascade,story_id uuid not null references public.stories(id) on delete cascade,position_seconds int not null default 0,completed boolean not null default false,updated_at timestamptz not null default now(),unique(child_profile_id,story_id));
create table public.content_reports(id uuid primary key default gen_random_uuid(),reporter_id uuid references public.profiles(id),story_id uuid references public.stories(id),circle_id uuid references public.fire_circles(id),reason text not null,details text,status text not null default 'open',resolved_by uuid references public.profiles(id),resolved_at timestamptz,created_at timestamptz not null default now());
create table public.audit_log(id bigint generated always as identity primary key,actor_id uuid,action text not null,entity_type text not null,entity_id text,metadata jsonb not null default '{}',created_at timestamptz not null default now());

create or replace function public.is_staff(uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.profiles p where p.id=uid and p.role in('platform_admin','moderator','content_manager','finance_manager','school_admin'));$$;
create or replace function public.is_family_member(fid uuid,uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.family_members m where m.family_id=fid and m.user_id=uid);$$;
create or replace function public.has_story_access(sid uuid,uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.stories s where s.id=sid and s.status='published' and (s.access_level='public' or exists(select 1 from public.content_entitlements e where e.user_id=uid and e.active=true and (e.ends_at is null or e.ends_at>now()))) );$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$declare fid uuid;begin insert into public.profiles(id,display_name,phone) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',null),new.phone) on conflict(id) do nothing;insert into public.families(owner_id,name) values(new.id,'My Family') returning id into fid;insert into public.family_members(family_id,user_id,relationship) values(fid,new.id,'guardian') on conflict do nothing;return new;end;$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role() returns trigger language plpgsql security definer set search_path=public as $$begin if new.role is distinct from old.role and not public.is_staff(auth.uid()) then raise exception 'Role changes are restricted to DFC staff';end if;return new;end;$$;
create trigger protect_profile_role before update on public.profiles for each row execute function public.protect_profile_role();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end;$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger applications_touch before update on public.storyteller_applications for each row execute function public.touch_updated_at();
create trigger stories_touch before update on public.stories for each row execute function public.touch_updated_at();
create trigger progress_touch before update on public.listening_progress for each row execute function public.touch_updated_at();

create or replace view public.story_catalog with(security_invoker=true) as select s.id,s.slug,s.title,s.original_title,s.summary,l.name language_name,c.name culture_name,s.age_min,s.age_max,s.themes,s.moral_lesson,s.access_level,s.status,s.published_at,tp.public_name storyteller_name,a.duration_seconds,a.storage_path audio_path from public.stories s join public.languages l on l.id=s.language_id left join public.cultures c on c.id=s.culture_id left join public.storyteller_profiles tp on tp.id=s.storyteller_id left join public.story_audio_assets a on a.story_id=s.id and a.variant='standard' and a.approved=true where s.status='published';

create index stories_published_idx on public.stories(status,published_at desc);
create index stories_language_idx on public.stories(language_id);
create index circles_starts_idx on public.fire_circles(status,starts_at);
create index reports_status_idx on public.content_reports(status,created_at desc);

insert into storage.buckets(id,name,public) values('story-audio-private','story-audio-private',false),('story-covers','story-covers',true),('elder-submissions-private','elder-submissions-private',false) on conflict(id) do nothing;

alter table public.profiles enable row level security;alter table public.families enable row level security;alter table public.family_members enable row level security;alter table public.child_profiles enable row level security;alter table public.storyteller_applications enable row level security;alter table public.storyteller_profiles enable row level security;alter table public.languages enable row level security;alter table public.cultures enable row level security;alter table public.stories enable row level security;alter table public.story_audio_assets enable row level security;alter table public.story_transcripts enable row level security;alter table public.fire_circles enable row level security;alter table public.circle_reservations enable row level security;alter table public.circle_attendance enable row level security;alter table public.content_entitlements enable row level security;alter table public.listening_progress enable row level security;alter table public.content_reports enable row level security;alter table public.audit_log enable row level security;

create policy profiles_select on public.profiles for select using(id=auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update using(id=auth.uid() or public.is_staff()) with check(id=auth.uid() or public.is_staff());
create policy families_select on public.families for select using(owner_id=auth.uid() or public.is_family_member(id) or public.is_staff());
create policy families_insert on public.families for insert with check(owner_id=auth.uid());
create policy families_update on public.families for update using(owner_id=auth.uid() or public.is_staff()) with check(owner_id=auth.uid() or public.is_staff());
create policy family_members_select on public.family_members for select using(user_id=auth.uid() or public.is_family_member(family_id) or public.is_staff());
create policy family_members_manage on public.family_members for all using(exists(select 1 from public.families f where f.id=family_id and f.owner_id=auth.uid()) or public.is_staff()) with check(exists(select 1 from public.families f where f.id=family_id and f.owner_id=auth.uid()) or public.is_staff());
create policy children_select on public.child_profiles for select using(public.is_family_member(family_id) or public.is_staff());
create policy children_manage on public.child_profiles for all using(public.is_family_member(family_id) or public.is_staff()) with check(public.is_family_member(family_id) or public.is_staff());

create policy applications_select on public.storyteller_applications for select using(user_id=auth.uid() or public.is_staff());
create policy applications_insert on public.storyteller_applications for insert with check(user_id=auth.uid());
create policy applications_update on public.storyteller_applications for update using(user_id=auth.uid() or public.is_staff()) with check(user_id=auth.uid() or public.is_staff());
create policy storyteller_profiles_public on public.storyteller_profiles for select using(true);
create policy storyteller_profiles_manage on public.storyteller_profiles for all using(user_id=auth.uid() or public.is_staff()) with check(user_id=auth.uid() or public.is_staff());
create policy language_public on public.languages for select using(true);create policy culture_public on public.cultures for select using(true);

create policy stories_public_or_entitled on public.stories for select using(status='published' and (access_level='public' or public.has_story_access(id)));
create policy stories_staff on public.stories for all using(public.is_staff()) with check(public.is_staff());
create policy audio_entitled on public.story_audio_assets for select using(public.has_story_access(story_id));create policy audio_staff on public.story_audio_assets for all using(public.is_staff()) with check(public.is_staff());
create policy transcripts_access on public.story_transcripts for select using(public.has_story_access(story_id));create policy transcripts_staff on public.story_transcripts for all using(public.is_staff()) with check(public.is_staff());

create policy circles_public on public.fire_circles for select using(status in('scheduled','live') or public.is_staff());
create policy circles_staff on public.fire_circles for all using(public.is_staff()) with check(public.is_staff());
create policy reservations_access on public.circle_reservations for select using(exists(select 1 from public.families f where f.id=family_id and f.owner_id=auth.uid()) or public.is_staff());
create policy reservations_insert on public.circle_reservations for insert with check(exists(select 1 from public.families f where f.id=family_id and f.owner_id=auth.uid()));
create policy reservations_update on public.circle_reservations for update using(exists(select 1 from public.families f where f.id=family_id and f.owner_id=auth.uid()) or public.is_staff());
create policy attendance_self on public.circle_attendance for select using(user_id=auth.uid() or public.is_staff());
create policy attendance_insert on public.circle_attendance for insert with check(user_id=auth.uid() or public.is_staff());

create policy entitlement_self on public.content_entitlements for select using(user_id=auth.uid() or public.is_staff());create policy entitlement_staff on public.content_entitlements for all using(public.is_staff()) with check(public.is_staff());
create policy progress_self on public.listening_progress for all using(exists(select 1 from public.child_profiles c join public.family_members m on m.family_id=c.family_id where c.id=child_profile_id and m.user_id=auth.uid()) or public.is_staff()) with check(exists(select 1 from public.child_profiles c join public.family_members m on m.family_id=c.family_id where c.id=child_profile_id and m.user_id=auth.uid()) or public.is_staff());
create policy reports_insert on public.content_reports for insert with check(reporter_id=auth.uid());create policy reports_select on public.content_reports for select using(reporter_id=auth.uid() or public.is_staff());create policy reports_staff on public.content_reports for update using(public.is_staff()) with check(public.is_staff());
create policy audit_staff on public.audit_log for select using(public.is_staff());create policy audit_insert on public.audit_log for insert with check(actor_id=auth.uid() or public.is_staff());

create policy story_audio_storage_read on storage.objects for select using(bucket_id='story-audio-private' and auth.role()='authenticated');
create policy story_audio_storage_staff on storage.objects for all using(bucket_id='story-audio-private' and public.is_staff()) with check(bucket_id='story-audio-private' and public.is_staff());
create policy covers_public on storage.objects for select using(bucket_id='story-covers');
create policy covers_staff on storage.objects for all using(bucket_id='story-covers' and public.is_staff()) with check(bucket_id='story-covers' and public.is_staff());
create policy elder_upload_own on storage.objects for insert with check(bucket_id='elder-submissions-private' and auth.uid()::text=split_part(name,'/',1));
create policy elder_read_own on storage.objects for select using(bucket_id='elder-submissions-private' and (auth.uid()::text=split_part(name,'/',1) or public.is_staff()));

