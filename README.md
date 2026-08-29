# Digital Fire Circle

DFC is an audio-first, people-first African storytelling and community platform for families, elders, schools and cultural communities.

## Production architecture

- **Netlify** — Next.js web/PWA hosting
- **Supabase** — PostgreSQL, Auth, Storage, RLS and Edge Functions
- **LiveKit Cloud** — live Digital Fire Circle audio
- **GitHub** — source control and automated deployment source

**Vercel is not used.**

## Product modules

- Public story library
- Language and culture discovery
- Family accounts and managed child profiles
- Child-friendly listening experience
- Elder storyteller applications
- Storyteller profiles and verification
- Story submission and audio workflow
- Human moderation
- Live Fire Circle scheduling and attendance
- Protected story audio with short-lived signed URLs
- School/ECD licensing foundation
- Storyteller earnings and payout ledger
- Notifications
- Audit logging
- PWA installation/app-like mobile experience
- Platform administrator console

## Supabase production source of truth

The production project is `kmeinntwtbupbacxlzvd`. The repository's `supabase/migrations/` history is timestamped to match the migrations already applied to production. Do not re-introduce the obsolete `0001_dfc.sql`–`0007_*.sql` migration files.

New database changes must be added as new timestamped migrations after `20260829142514` and pushed through GitHub. The Supabase GitHub integration is configured to deploy `main` to production.

## First administrator

Create your first account through DFC, then in Supabase SQL Editor run:

```sql
update public.profiles
set role='platform_admin', updated_at=now()
where id=(
  select id from auth.users
  where email='YOUR_EMAIL_HERE'
);
```

After changing the role, sign out and sign in again.

## Netlify

Connect this repository to Netlify.

Build command:

```text
npm run build
```

Node is pinned to 22 using `.nvmrc` and `netlify.toml`.

Required public variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
```

LiveKit variables:

```text
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

Only the Supabase publishable key belongs in browser-exposed variables. Never place a Supabase service-role key or LiveKit API secret in GitHub or client-side code.

## Supabase Edge Functions

Functions in `supabase/functions/` include:

- `create-story-stream-url` — checks story access and issues a short-lived private audio URL
- `livekit-webhook` — records Fire Circle attendance from verified LiveKit events

## Health check

`/api/health` verifies that the Next.js server can reach the production `story_catalog` and reports whether LiveKit server configuration is present without exposing secrets.

## Development

Use Node 22 and npm 10 locally:

```text
npm install
npm run build
npm run dev
```
