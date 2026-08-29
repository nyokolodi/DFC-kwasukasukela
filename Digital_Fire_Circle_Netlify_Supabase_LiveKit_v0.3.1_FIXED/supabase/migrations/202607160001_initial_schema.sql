create extension if not exists pgcrypto;

create type public.app_role as enum ('family_owner','family_member','elder_applicant','storyteller','teacher','school_admin','moderator','content_manager','finance_manager','platform_admin');
create type public.review_status as enum ('draft','submitted','review','approved','rejected','published','archived');
create type public.access_level as enum ('public','subscriber','school','restricted');
create type public.circle_status as enum ('draft','scheduled','live','completed','cancelled');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 role public.app_role not null default 'family_owner',
 phone text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.families (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), name text not null default 'My Family', created_at timestamptz not null default now());
create table public.family_members (family_id uuid references public.families(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, relationship text not null default 'guardian', primary key(family_id,user_id));
create table public.child_profiles (id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id) on delete cascade, display_name text not null, birth_year int check(birth_year between 2000 and 2100), preferred_languages text[] not null default '{}', created_at timestamptz not null default now());

create table public.storyteller_applications (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade, display_name text not null, phone text not null, languages text[] not null, community text not null, biography text not null, status text not null default 'submitted' check(status in ('draft','submitted','approved','rejected')), review_notes text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.storyteller_profiles (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id), public_name text not null, biography text, community text, verified boolean not null default false, created_at timestamptz not null default now());

create table public.languages (id uuid primary key default gen_random_uuid(), code text unique not null, name text unique not null);
create table public.cultures (id uuid primary key default gen_random_uuid(), name text unique not null, description text);
create table public.stories (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, original_title text, summary text not null, language_id uuid not null references public.languages(id), culture_id uuid references public.cultures(id), storyteller_id uuid references public.storyteller_profiles(id), age_min int not null default 4, age_max int not null default 12, themes text[] not null default '{}', moral_lesson text, historical_context text, rights_holder text, rights_notes text, cultural_restrictions text, access_level public.access_level not null default 'public', status public.review_status not null default 'draft', published_at timestamptz, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.story_audio_assets (id uuid primary key default gen_random_uuid(), story_id uuid not null references public.stories(id) on delete cascade, variant text not null check(variant in ('master','standard','low_data')), storage_path text not null, mime_type text, duration_seconds int, file_size_bytes bigint, approved boolean not null default false, created_at timestamptz not null default now(), unique(story_id,variant));
create table public.story_transcripts (id uuid primary key default gen_random_uuid(), story_id uuid not null references public.stories(id) on delete cascade, language_id uuid not null references public.languages(id), transcript text not null, is_translation boolean not null default false, created_at timestamptz not null default now());

create table public.fire_circles (id uuid primary key default gen_random_uuid(), title text not null, description text, storyteller_id uuid references public.storyteller_profiles(id), starts_at timestamptz not null, ends_at timestamptz, capacity int not null default 100, status public.circle_status not null default 'draft', livekit_room_name text unique not null default ('dfc-'||gen_random_uuid()::text), recording_allowed boolean not null default false, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.circle_reservations (id uuid primary key default gen_random_uuid(), circle_id uuid not null references public.fire_circles(id) on delete cascade, family_id uuid not null references public.families(id) on delete cascade, seats int not null default 1 check(seats between 1 and 10), status text not null default 'confirmed', created_at timestamptz not null default now(), unique(circle_id,family_id));
create table public.circle_attendance (id uuid primary key default gen_random_uuid(), circle_id uuid not null references public.fire_circles(id) on delete cascade, user_id uuid references public.profiles(id), joined_at timestamptz not null default now(), left_at timestamptz, seconds_present int);

create table public.listening_progress (id uuid primary key default gen_random_uuid(), child_profile_id uuid not null references public.child_profiles(id) on delete cascade, story_id uuid not null references public.stories(id) on delete cascade, position_seconds int not null default 0, completed boolean not null default false, updated_at timestamptz not null default now(), unique(child_profile_id,story_id));
create table public.content_reports (id uuid primary key default gen_random_uuid(), reporter_id uuid references public.profiles(id), story_id uuid references public.stories(id), circle_id uuid references public.fire_circles(id), reason text not null, details text, status text not null default 'open', resolved_by uuid references public.profiles(id), resolved_at timestamptz, created_at timestamptz not null default now());
create table public.audit_log (id bigint generated always as identity primary key, actor_id uuid, action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}', created_at timestamptz not null default now());

create or replace view public.story_catalog with (security_invoker=true) as
select s.id,s.slug,s.title,s.original_title,s.summary,l.name language_name,c.name culture_name,s.age_min,s.age_max,s.access_level,s.published_at,a.duration_seconds,a.storage_path audio_path,null::text cover_url
from public.stories s join public.languages l on l.id=s.language_id left join public.cultures c on c.id=s.culture_id left join public.story_audio_assets a on a.story_id=s.id and a.variant='standard' and a.approved=true where s.status='published';

