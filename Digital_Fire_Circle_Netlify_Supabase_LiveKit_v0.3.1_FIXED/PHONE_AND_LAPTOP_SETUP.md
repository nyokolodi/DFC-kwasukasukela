# Digital Fire Circle — Laptop Setup

You are using the laptop workflow now. Do not use the separate phone-only SQL file.

## 1. Supabase SQL Editor

Run these in this exact order:

1. `supabase/migrations/202607160001_initial_schema.sql`
2. `supabase/migrations/202607160002_auth_rls_storage.sql`
3. `supabase/seed.sql`

Run one file at a time and confirm it succeeds before moving to the next.

## 2. Important security decisions

- Users cannot promote their own account to a manager/admin role.
- Story audio remains in a private Storage bucket.
- The browser never receives direct read access to the private audio bucket.
- The story stream Edge Function issues a short-lived signed URL.
- Phase 1 stream access is limited to published public stories.
- Subscriber/school/restricted access should not be enabled until the entitlement/billing layer is installed.

## 3. Edge Functions

Deploy from the Supabase Dashboard editor if you do not want to use the CLI:

- `create-story-stream-url`
- `livekit-webhook`

The `create-story-stream-url` function requires the normal Supabase function environment variables supplied by the platform. LiveKit webhook configuration requires its LiveKit credentials/secrets.

## 4. Frontend

The Next.js application can then be connected to Netlify through GitHub. Add the Supabase URL and publishable/anon key as Netlify environment variables.
