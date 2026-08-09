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

## Order receipt emails (Brevo via Edge Function)

A confirmation email goes out automatically when an order is submitted. It's
sent server-side by the `send-order-receipt` Supabase Edge Function (see
`supabase/functions/send-order-receipt/index.ts`), which calls Brevo's
transactional email API right after the Supabase insert succeeds. Sending
happens server-side (rather than client-side, as a prior EmailJS-based
version did) so the Brevo API key never ends up in the public JS bundle.
Setup:

1. Sign up at [brevo.com](https://www.brevo.com) (free tier: 300 emails/day).
2. SMTP & API -> API Keys -> generate a new API key.
3. Senders, Domains & Dedicated IPs -> Senders -> add and verify the address
   you want receipts to come from — ideally a dedicated chapter address
   rather than a personal one. Brevo will silently drop mail from unverified
   senders even if the API call reports success, so don't skip this.
4. Deploy the function and set its secrets (the CLI must be linked to your
   project — `supabase link`):
   ```
   supabase functions deploy send-order-receipt
   supabase secrets set BREVO_API_KEY=... BREVO_SENDER_EMAIL=... BREVO_SENDER_NAME="Rho Delta Chi"
   ```
5. Place a test order and confirm the email arrives. If it doesn't, check the
   browser console (the send is non-blocking, so a failure logs an error
   there but does not stop the order from completing) and Brevo's own
   Transactional -> Logs page for the delivery status of that specific send.

This only confirms the order was received — it is not payment confirmation
(the fundraising chair still manually reviews the Venmo screenshot).

## Out of scope (by design)

- Payment verification: Venmo screenshots are stored as proof only, never
  verified programmatically.
- No separate backend server for the main app — the frontend talks to
  Supabase directly with the anon key, and RLS policies are the only access
  control; the `send-order-receipt` Edge Function is the one exception,
  needed only to keep the Brevo API key off the client.
- Retrying failed receipt emails, and Brevo usage/rate tracking beyond the
  free tier.
