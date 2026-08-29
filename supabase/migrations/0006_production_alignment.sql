-- Historical migration already applied to production before timestamp history was normalized.
-- Kept in Git so Supabase GitHub integration can match the remote migration record.
create index if not exists child_profiles_family_id_idx on public.child_profiles(family_id);
create index if not exists circle_attendance_circle_id_idx on public.circle_attendance(circle_id);
create index if not exists circle_attendance_user_id_idx on public.circle_attendance(user_id);
create index if not exists circle_reservations_family_id_idx on public.circle_reservations(family_id);
create index if not exists consent_records_granted_by_idx on public.consent_records(granted_by);
create index if not exists content_entitlements_school_id_idx on public.content_entitlements(school_id);
create index if not exists content_entitlements_story_id_idx on public.content_entitlements(story_id);
create index if not exists content_reports_reporter_id_idx on public.content_reports(reporter_id);
create index if not exists content_reports_story_id_idx on public.content_reports(story_id);
create index if not exists content_reports_circle_id_idx on public.content_reports(circle_id);
create index if not exists content_reports_resolved_by_idx on public.content_reports(resolved_by);
create index if not exists families_owner_id_idx on public.families(owner_id);
create index if not exists family_members_user_id_idx on public.family_members(user_id);
create index if not exists fire_circles_created_by_idx on public.fire_circles(created_by);
create index if not exists fire_circles_storyteller_id_idx on public.fire_circles(storyteller_id);
create index if not exists listening_progress_story_id_idx on public.listening_progress(story_id);
create index if not exists payments_subscription_id_idx on public.payments(subscription_id);
create index if not exists payouts_storyteller_id_idx on public.payouts(storyteller_id);
create index if not exists school_licences_school_id_idx on public.school_licences(school_id);
create index if not exists stories_created_by_idx on public.stories(created_by);
create index if not exists stories_culture_id_idx on public.stories(culture_id);
create index if not exists stories_storyteller_id_idx on public.stories(storyteller_id);
create index if not exists story_rights_story_id_idx on public.story_rights(story_id);
create index if not exists story_transcripts_story_id_idx on public.story_transcripts(story_id);
create index if not exists story_transcripts_language_id_idx on public.story_transcripts(language_id);
create index if not exists storyteller_applications_reviewed_by_idx on public.storyteller_applications(reviewed_by);
create index if not exists storyteller_earnings_story_id_idx on public.storyteller_earnings(story_id);
create index if not exists storyteller_earnings_circle_id_idx on public.storyteller_earnings(circle_id);
create index if not exists storyteller_verifications_storyteller_id_idx on public.storyteller_verifications(storyteller_id);
create index if not exists storyteller_verifications_verified_by_idx on public.storyteller_verifications(verified_by);
create index if not exists subscriptions_plan_id_idx on public.subscriptions(plan_id);

drop view if exists public.story_catalog;
create view public.story_catalog with (security_invoker=true) as
select s.id,s.slug,s.title,s.original_title,s.summary,
       l.name as language_name,c.name as culture_name,
       s.age_min,s.age_max,s.themes,s.moral_lesson,
       s.access_level,s.status,s.published_at,
       tp.public_name as storyteller_name,
       a.duration_seconds,a.storage_path as audio_path,
       null::text as cover_url
from public.stories s
join public.languages l on l.id=s.language_id
left join public.cultures c on c.id=s.culture_id
left join public.storyteller_profiles tp on tp.id=s.storyteller_id
left join public.story_audio_assets a on a.story_id=s.id and a.variant='standard' and a.approved=true
where s.status='published';
