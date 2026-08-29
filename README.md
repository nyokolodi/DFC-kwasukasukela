# Digital Fire Circle

DFC is an audio-first African storytelling and reading platform for families, elders, schools and cultural communities.

## Production architecture

- **Netlify** — Next.js web/PWA hosting
- **Supabase** — PostgreSQL, Auth, Storage, RLS and Edge Functions
- **LiveKit Cloud** — live Digital Fire Circle audio
- **GitHub** — source control and automated build checks

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

## Supabase database

Run these SQL migrations in order in the DFC Supabase project:

1. `supabase/migrations/0001_dfc.sql`
2. `supabase/migrations/0002_school_and_earnings.sql`
3. `supabase/migrations/0003_platform_operations.sql`
4. `supabase/seed.sql`

The migrations create the DFC schema, security policies, storage buckets, school/licensing foundations, revenue tables, rights/consent records and starter data.

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

Platform administrators can manage people, roles, stories, audio approvals, publication, storytellers, circles and moderation.

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

Configure required server secrets inside Supabase Edge Functions.

## PWA

DFC includes:

- web manifest
- installable home-screen experience
- standalone display
- service worker
- responsive mobile layout
- protected routes excluded from generic caching

This is intentionally a web app for the pilot. No native Android/iOS build is required.

## Security model

The platform uses database-side role enforcement and Row Level Security. Client users cannot simply promote their own role. Private story audio is not directly readable from browser Storage policies; access is mediated through the signed-URL function.

## Development

Use Node 22 and npm 10 locally. Run:

```text
npm install
npm run build
npm run dev
```

