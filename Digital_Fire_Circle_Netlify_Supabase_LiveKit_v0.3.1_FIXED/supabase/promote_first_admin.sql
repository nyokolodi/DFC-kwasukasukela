-- Run this AFTER you create your first DFC account.
-- Replace the email below with YOUR OWN account email.
update public.profiles
set role = 'platform_admin', updated_at = now()
where id = (
  select id from auth.users
  where email = 'YOUR_EMAIL_HERE'
);
