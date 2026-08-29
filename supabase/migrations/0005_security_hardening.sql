revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_story_access(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.is_family_member(uuid) from public, anon, authenticated;
revoke execute on function public.is_manager() from public, anon, authenticated;
revoke execute on function public.is_staff(uuid) from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
