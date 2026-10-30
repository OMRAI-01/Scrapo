# Scrapo

Give electronics a second life. This is a visual prototype for collection, refurbishment, student donation, and rewards.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Screens use the samples in `lib/mock/data.ts`. Listings, inspections, and admin actions you make are stored in this browser under `reloop.prototype.v1`. They are not sent to a server. Demo banners mark that data.

## Supabase

The app does not call Supabase yet. When you are ready:

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Keep the secret key server-only. Never prefix it with `NEXT_PUBLIC_`.
4. Review `supabase/schema.sql`, then apply it in your project. It enables row level security. Roles belong in `app_metadata`, not user-editable metadata.
5. Replace `lib/supabase/database.types.ts` with generated types, and swap the readers in `lib/mock` for queries through `lib/supabase/client.ts` and `lib/supabase/server.ts`.

`lib/supabase/client.ts` throws if the public env vars are missing, so a half-configured client cannot silently run.
