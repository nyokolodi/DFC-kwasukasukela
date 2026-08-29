-- Replace the email with the email you used to create your DFC account.
update public.profiles set role='platform_admin',updated_at=now() where id=(select id from auth.users where email='YOUR_EMAIL_HERE');
