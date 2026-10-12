-- Rho Delta Chi Merch Shop — Supabase schema
-- Run this once against a fresh Supabase project (SQL Editor -> New query -> paste -> Run).

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  -- garment_types: [{ "type": "Hoodie", "price": 40, "sizes": ["S","M","L"], "inStock": true,
  --   "colorVariants": [{ "name": "Dusty Rose", "photos": ["<public storage URL>", ...], "swatch": "#..." }, ...] }, ...]
  -- One product is a "design" that can offer several garment types (t-shirt, tank,
  -- hoodie, ...), each with its own price/sizes/stock/colors/photos.
  garment_types jsonb not null default '[]',
  sort_order integer not null default 0, -- lower shows first on the shop page; admin-reorderable
  created_at timestamptz not null default now()
);

-- If this schema was already applied before 'Tanks' was a valid category or
-- before sort_order existed, bring an existing table up to date.
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists garment_types jsonb not null default '[]';

-- Migrating an existing table from the old single-garment shape (price,
-- category, sizes, color_variants, in_stock all directly on the row) to the
-- multi-garment-type "design" shape above is a breaking change — old rows
-- won't match the new `Product` shape the app expects, so they must be
-- re-created through the admin UI after applying this. Drop the old columns
-- once you've done that (or immediately, if this is a fresh/test dataset):
alter table public.products drop constraint if exists products_category_check;
alter table public.products drop column if exists price;
alter table public.products drop column if exists category;
alter table public.products drop column if exists sizes;
alter table public.products drop column if exists color_variants;
alter table public.products drop column if exists in_stock;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_name text not null,
  referrer text not null,
  email text not null,
  phone text not null,
  -- items: [{ "productId", "productName", "garmentType", "size", "color", "quantity", "unitPrice" }, ...]
  items jsonb not null,
  total numeric(10, 2) not null check (total >= 0),
  -- path within the private "payment-proofs" bucket, e.g. "2026/07/29-abc123.jpg" — NOT a public URL
  payment_proof_path text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'fulfilled')),
  created_at timestamptz not null default now()
);

-- If this schema was already applied before the `phone` column existed, this
-- adds it to the existing table (new orders still require it via the app).
alter table public.orders add column if not exists phone text not null default '';

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  maintenance_mode boolean not null default false
);

-- Ensure exactly one settings row exists.
insert into public.site_settings (maintenance_mode)
select false
where not exists (select 1 from public.site_settings);

-- Sale announcement banner (shown in the site header) and the admin-editable
-- static Information page. Added after the initial table — use `add column
-- if not exists` so this is safe to re-run against an existing database.
alter table public.site_settings add column if not exists banner_enabled boolean not null default false;
alter table public.site_settings add column if not exists banner_text text not null default '';
alter table public.site_settings add column if not exists info_title text not null default 'Fundraiser Info';
alter table public.site_settings add column if not exists info_deadline text not null default '';
alter table public.site_settings add column if not exists info_venmo text not null default '';
alter table public.site_settings add column if not exists info_shipping text not null default 'Orders will be shipped within 2-4 weeks. Items are made to order.';
alter table public.site_settings add column if not exists info_goal text not null default '';
alter table public.site_settings add column if not exists info_chair_name text not null default '';
alter table public.site_settings add column if not exists info_chair_phone text not null default '';
alter table public.site_settings add column if not exists info_chair_email text not null default '';
alter table public.site_settings add column if not exists info_chair_email_2 text not null default '';
-- Homepage photos (hero + "How it works" band), uploaded from Admin > Settings.
alter table public.site_settings add column if not exists hero_image_url text not null default '';
alter table public.site_settings add column if not exists promise_image_url text not null default '';
-- Superseded by the structured info_* columns above; drop if present from an
-- earlier version of this schema.
alter table public.site_settings drop column if exists info_content;

-- ============================================================================
-- Member login check (RPC)
-- ============================================================================
-- This is a low-security allowlist check by design, not a password system.
-- It runs as SECURITY DEFINER so it can read `members` even though the table
-- itself has no public SELECT policy (see RLS below) — this keeps the full
-- roster from ever being queryable/readable directly from the client.
create or replace function public.check_member(p_first_name text, p_last_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where lower(first_name) = lower(trim(p_first_name))
      and lower(last_name) = lower(trim(p_last_name))
  );
$$;

-- Allow anon/authenticated to call the RPC (the function body still fully
-- controls what data comes back — just a boolean, never rows).
revoke all on function public.check_member(text, text) from public;
grant execute on function public.check_member(text, text) to anon, authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.members enable row level security;
-- No policies: members is fully locked down for direct client access.
-- All reads go through the check_member() SECURITY DEFINER function above.

alter table public.products enable row level security;

create policy "products are publicly readable"
  on public.products for select
  using (true);

create policy "products are writable by admins only"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

alter table public.orders enable row level security;

create policy "anyone can submit an order"
  on public.orders for insert
  to anon, authenticated
  with check (true);

create policy "orders are readable by admins only"
  on public.orders for select
  to authenticated
  using (true);

create policy "orders are updatable by admins only"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

create policy "orders are deletable by admins only"
  on public.orders for delete
  to authenticated
  using (true);

alter table public.site_settings enable row level security;

create policy "site settings are publicly readable"
  on public.site_settings for select
  using (true);

create policy "site settings are writable by admins only"
  on public.site_settings for update
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- Storage buckets
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- product-images: public read (handled by bucket's `public = true` flag above),
-- writes restricted to authenticated admins.
create policy "product images are writable by admins only"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "product images are updatable by admins only"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "product images are deletable by admins only"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- payment-proofs: anyone can upload during checkout, but only admins can
-- list/view (bucket is private, so unauthenticated reads are already
-- blocked at the bucket level; these policies gate storage.objects too).
create policy "anyone can upload a payment proof"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

create policy "payment proofs are readable by admins only"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs');

-- ============================================================================
-- Admin accounts
-- ============================================================================
-- Admin login uses real Supabase Auth (email/password), not a table in this
-- schema. Create the 1-2 exec board accounts via:
--   Supabase Dashboard -> Authentication -> Users -> Add user
-- or the Admin API (service role key required, run server-side/CLI only —
-- never from the frontend):
--   supabase.auth.admin.createUser({ email, password, email_confirm: true })
-- Any authenticated Supabase Auth user is treated as an admin by the RLS
-- policies above, so only create accounts for people who should have
-- full write/admin access.
