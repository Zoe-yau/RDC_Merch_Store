# Supabase setup

1. Create a project at supabase.com.
2. SQL Editor -> paste `schema.sql` -> Run. This creates tables, RLS policies,
   storage buckets, and the `check_member` RPC.
3. Table Editor -> `members` -> Import data from CSV -> upload your own
   `supabase/members_seed.csv` (columns already match: `first_name,last_name`;
   see `members_seed.example.csv` for the format — the real roster file is
   gitignored since it contains member names).
4. Authentication -> Users -> Add user, once per fundraising chair who needs
   admin access (email + password). These are the only accounts that can sign
   in via `adminLogin` and get write access to products/orders/settings.
5. Project Settings -> API -> copy the Project URL and anon public key into
   a `.env` file at the repo root (see `.env.example`):
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
6. `npm run dev`.

## Order receipt emails

A confirmation email goes out automatically when an order is submitted, via
a Supabase Edge Function (`supabase/functions/send-order-receipt`) triggered
by a database webhook on `orders` INSERT. Setup:

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and log
   in / link it to your project:
   ```
   supabase login
   supabase link --project-ref your-project-ref
   ```
2. Create a [Resend](https://resend.com) account, verify a sending domain
   (or use their sandbox domain, `onboarding@resend.dev`, for testing), and
   grab an API key.
3. Set the Edge Function secrets:
   ```
   supabase secrets set RESEND_API_KEY=re_your_key
   supabase secrets set RECEIPT_FROM="Rho Delta Chi Shop <onboarding@resend.dev>"
   supabase secrets set RECEIPT_REPLY_TO=RDC.BetaFundraisingChair@gmail.com
   supabase secrets set WEBHOOK_SECRET=$(openssl rand -hex 32)
   ```
   `RECEIPT_REPLY_TO` is optional — set it so replies to the receipt land in
   a real inbox even though `RECEIPT_FROM` is a Resend/sandbox address (you
   can't send *as* a `gmail.com` address without owning that domain, but you
   can set it as the reply-to).
4. Deploy the function:
   ```
   supabase functions deploy send-order-receipt --no-verify-jwt
   ```
   (`--no-verify-jwt` is needed because the webhook calls it without a
   Supabase user JWT; the function checks `WEBHOOK_SECRET` itself instead.)
5. Dashboard -> Database -> Webhooks -> Create a new webhook:
   - Table: `orders`, Events: `Insert`
   - Type: HTTP Request -> POST to
     `https://your-project-ref.supabase.co/functions/v1/send-order-receipt`
   - Add an HTTP header: `x-webhook-secret` -> the same value you set for
     `WEBHOOK_SECRET` above.
6. Place a test order and confirm the email arrives. Check
   Edge Functions -> Logs in the dashboard if it doesn't.

This only confirms the order was received — it is not payment confirmation
(the fundraising chair still manually reviews the Venmo screenshot).

## Out of scope (by design)

- Payment verification: Venmo screenshots are stored as proof only, never
  verified programmatically.
- No separate backend server — the frontend talks to Supabase directly with
  the anon key; RLS policies are the only access control.
