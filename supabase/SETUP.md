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

## Order receipt emails (EmailJS)

A confirmation email goes out automatically when an order is submitted, sent
client-side via [EmailJS](https://emailjs.com) right after the Supabase
insert succeeds. Setup:

1. Sign up at [emailjs.com](https://emailjs.com).
2. Email Services -> connect a Gmail (or Outlook) account — ideally a
   dedicated chapter account rather than a personal one, since it'll be the
   "from" address on every receipt.
3. Email Templates -> create a template for order receipts using these
   variables (names must match exactly): `{{buyer_name}}`, `{{email}}`,
   `{{items}}`, `{{total}}`, `{{order_id}}`. Write the subject/body however
   you'd like it to read to a buyer.
4. Account -> API Keys -> note the Public Key, Service ID, and Template ID.
5. Add them to your `.env` file at the repo root (see `.env.example`):
   ```
   VITE_EMAILJS_PUBLIC_KEY=...
   VITE_EMAILJS_SERVICE_ID=...
   VITE_EMAILJS_TEMPLATE_ID=...
   ```
6. Place a test order and confirm the email arrives. If it doesn't, check the
   browser console — the send is non-blocking, so a failure logs an error
   there but does not stop the order from completing.

This only confirms the order was received — it is not payment confirmation
(the fundraising chair still manually reviews the Venmo screenshot). Note:
the free EmailJS tier caps out at 200 emails/month, and failed sends are not
retried.

## Out of scope (by design)

- Payment verification: Venmo screenshots are stored as proof only, never
  verified programmatically.
- No separate backend server — the frontend talks to Supabase directly with
  the anon key; RLS policies are the only access control.
- Retrying failed receipt emails, and EmailJS usage/rate tracking beyond the
  free tier.
