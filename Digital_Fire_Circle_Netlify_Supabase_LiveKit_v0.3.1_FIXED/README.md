# Digital Fire Circle — Netlify + Supabase + LiveKit

DFC is an audio-first storytelling and reading web app rooted in African oral tradition.

## Architecture

- **Netlify** — web application hosting
- **Supabase** — PostgreSQL, Auth, Storage, Realtime, Edge Functions
- **LiveKit Cloud** — live Fire Circle audio
- **GitHub** — source repository

There is **no Vercel dependency** in this build.

## What is included

- Mobile-first responsive web app
- PWA/app-like installation support
- Family accounts and managed child profiles
- Elder storyteller applications
- Story library and audio player
- Fire Circle scheduling and joining
- Manager/admin dashboard
- Story moderation
- Storyteller management
- Family management
- Circle management
- Content reports
- Audit logging
- Supabase RLS
- Private audio storage with signed access
- Supabase Edge Functions for secure server-side operations
- LiveKit token integration
- Seed/demo content

## Admin access

The first account you create becomes a normal family account by default.

After creating the account, use the Supabase SQL Editor to promote **your own account** to `platform_admin`:

```sql
update public.profiles
set role = 'platform_admin'
where id = (
  select id from auth.users
  where email = 'YOUR_EMAIL_HERE'
);
```

Replace `YOUR_EMAIL_HERE` with the email you used.

Admin access is protected by database RLS. Do not put Supabase service-role keys into Netlify environment variables exposed to the browser.

## Supabase setup

1. Create a new Supabase project dedicated to DFC.
2. Open **SQL Editor**.
3. Run the migration files in `supabase/migrations/` in filename order.
4. Run `supabase/seed.sql`.
5. Create/configure the required Edge Functions in `supabase/functions/`.
6. Add the required secrets to Supabase Edge Functions.

The migration layer is the authoritative database schema. Do not use older standalone setup SQL files from previous DFC experiments.

## Netlify setup

This project is configured for Netlify's current Next.js support. Netlify automatically applies its maintained OpenNext adapter for modern Next.js projects, so this repository intentionally does **not** install or pin `@netlify/plugin-nextjs`. This avoids unnecessary dependency resolution and lets Netlify manage the adapter automatically.


1. Put this repository in GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the GitHub repository.
4. Build command:

```text
npm run build
```

5. Publish directory:

```text
.next
```

6. Add the environment variables listed in `.env.example`.
7. Deploy.

If Netlify detects the Next.js framework automatically, keep its generated Next.js settings.

## Required environment variables

At minimum:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

Only public values belong in `NEXT_PUBLIC_*`.

## PWA / app-like behaviour

DFC is designed as a Progressive Web App:

- responsive mobile interface
- installable from a supported browser
- app icon
- standalone display
- mobile navigation
- persistent authentication
- audio player
- offline-friendly shell where practical

It is still a web app. No Play Store/App Store build is required for the pilot.

## Production checklist

Before public launch:

- [ ] Create dedicated Supabase project
- [ ] Run migrations
- [ ] Run seed
- [ ] Configure Storage
- [ ] Configure Edge Function secrets
- [ ] Create LiveKit project
- [ ] Configure Netlify environment variables
- [ ] Deploy to Netlify
- [ ] Create first account
- [ ] Promote your own account to platform_admin
- [ ] Test manager dashboard
- [ ] Test family registration
- [ ] Test elder application
- [ ] Test story publication
- [ ] Test signed audio access
- [ ] Test Fire Circle access
- [ ] Test mobile/PWA installation
- [ ] Replace demo content before public launch

## Important

This project does not require a Vercel project.

Do not expose:

- Supabase service-role key
- LiveKit API secret

to browser-side code.
