# Digital Fire Circle

Full DFC web platform: Netlify + Next.js + Supabase + LiveKit.

## Deploy
1. Create a dedicated Supabase project.
2. Run `supabase/migrations/0001_dfc.sql` in Supabase SQL Editor.
3. Run `supabase/seed.sql`.
4. In Supabase Auth, create your account through the website.
5. Run `supabase/promote_first_admin.sql` for your own email.
6. Create a LiveKit Cloud project and add its URL/key/secret to Netlify environment variables.
7. Connect this GitHub repository to Netlify and deploy with `npm run build`.

## Core modules
Public library, family hub, elder onboarding, live Fire Circles, storyteller profiles, admin console, moderation, content access, PWA shell, secure LiveKit token endpoint.

## Security
The browser receives only the Supabase publishable key. The LiveKit API secret and any Supabase service-role key stay server-side. Database roles are protected by RLS and a trigger that blocks client-side role escalation.

## No Vercel dependency
DFC is a Netlify deployment.
