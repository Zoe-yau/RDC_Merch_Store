# Supabase setup

1. Create a project at supabase.com.
2. SQL Editor -> paste `schema.sql` -> Run. This creates tables, RLS policies,
   storage buckets, and the `check_member` RPC.
3. Table Editor -> `members` -> Import data from CSV -> upload your own
   `supabase/members_seed.csv` (columns already match: `first_name,last_name`;
   see `members_seed.example.csv` for the format — the real roster file is
   gitignored since it contains member names).
4. Authentication -> Users -> Add user, once per exec board member who needs
   admin access (email + password). These are the only accounts that can sign
   in via `adminLogin` and get write access to products/orders/settings.
5. Project Settings -> API -> copy the Project URL and anon public key into
   a `.env` file at the repo root (see `.env.example`):
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
6. `npm run dev`.

## Out of scope (by design)

- Payment verification: Venmo screenshots are stored as proof only, never
  verified programmatically.
- Receipt emails: would hook in right after the `orders` insert in
  `submitOrder` (src/lib/api.ts) — e.g. a Supabase Edge Function triggered by
  a `orders` insert webhook, calling an email API (Resend, Postmark, etc.).
  Not implemented here.
- No separate backend server — the frontend talks to Supabase directly with
  the anon key; RLS policies are the only access control.
