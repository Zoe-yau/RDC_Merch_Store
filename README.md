# Rho Delta Chi Merch Shop

A private, invite-only merch storefront for the chapter. Members log in with
their name (checked against the chapter roster), browse products, and check
out by uploading a Venmo payment screenshot as proof of payment. Exec board
members sign in separately to manage products, review/fulfill orders, and
toggle maintenance mode.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- [Supabase](https://supabase.com) (Postgres, Auth, Storage) — called directly
  from the frontend, no separate backend server

## Getting started

1. Install dependencies:
   ```
   npm install
   ```
2. Set up a Supabase project and wire up your `.env` — see
   [`supabase/SETUP.md`](supabase/SETUP.md) for the full walkthrough
   (schema, RLS policies, storage buckets, roster import, admin accounts).
3. Run the dev server:
   ```
   npm run dev
   ```

## Project structure

- `src/pages/` — routed pages (member login, shop, product detail, cart,
  checkout, order confirmation, admin login, admin dashboard)
- `src/context/ShopContext.tsx` — app-wide state (cart, current user,
  products/orders, maintenance mode) backed by Supabase
- `src/lib/supabaseClient.ts` — Supabase client instance
- `src/lib/api.ts` — every Supabase call (auth, DB queries, storage uploads)
  lives here
- `src/data/mockData.ts` — shared TypeScript interfaces (`Product`, `Order`,
  `Member`, etc.)
- `supabase/schema.sql` — tables, RLS policies, storage buckets, and the
  `check_member` RPC, reproducible in a fresh Supabase project
- `supabase/members_seed.example.csv` — format for the chapter roster CSV
  import (the real roster file, `members_seed.csv`, is gitignored)

## Access model

- **Members** enter their first/last name, checked against the roster via a
  Postgres RPC. This is a low-security allowlist gate by design, not a
  password system.
- **Admins** sign in with real Supabase Auth (email/password). Any
  authenticated admin account has write access to products, orders, and
  site settings via Row Level Security policies — see `supabase/schema.sql`.

## Out of scope

- Real payment processing (Venmo screenshots are stored as proof only, never
  verified programmatically)
- Receipt emails (a Supabase Edge Function triggered off the `orders` table
  is the natural hook if this is added later)
