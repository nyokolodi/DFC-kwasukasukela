create table if not exists public.content_entitlements(
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.profiles(id) on delete cascade,
 plan text not null,
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 active boolean not null default true,
 created_at timestamptz not null default now()
);

create or replace function public.is_staff(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$ select exists (
  select 1 from public.profiles
  where id=uid
    and role in ('platform_admin','moderator','content_manager','finance_manager','school_admin')
); $$;

create or replace function public.has_story_access(sid uuid,uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$ select exists(
  select 1 from public.stories s
  where s.id=sid and s.status='published'
  and (
    s.access_level='public'
    or exists(
      select 1 from public.content_entitlements e
      where e.user_id=uid and e.active=true
      and (e.ends_at is null or e.ends_at>now())
    )
  )
); $$;

alter table public.content_entitlements enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='content_entitlements' and policyname='entitlement_self'
  ) then
    create policy entitlement_self on public.content_entitlements
      for select using (user_id=auth.uid() or public.is_staff());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='content_entitlements' and policyname='entitlement_staff'
  ) then
    create policy entitlement_staff on public.content_entitlements
      for all using (public.is_staff()) with check (public.is_staff());
  end if;
end $$;

create index if not exists content_entitlements_user_idx
  on public.content_entitlements(user_id,active,ends_at);

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
  if new.role is distinct from old.role and not public.is_staff(auth.uid()) then
    raise exception 'Role changes are restricted to DFC staff';
  end if;
  return new;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname='protect_profile_role' and tgrelid='public.profiles'::regclass
  ) then
    create trigger protect_profile_role
      before update on public.profiles
      for each row execute function public.protect_profile_role();
  end if;
end $$;
