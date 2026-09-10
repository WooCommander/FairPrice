-- =====================================================================
--  PRICES & PRODUCTS — tighten write access to "author or admin"
--  (voting/moderation paused: everything is visible immediately;
--   only the author or an admin may edit / delete).
--
--  Run once in the Supabase SQL Editor. This REPLACES every existing
--  RLS policy on public.prices and public.products.
--
--  Admin = server-controlled app_metadata.role = 'admin'
--  Set it in Supabase: Auth > Users > <user> > app_metadata:
--     { "role": "admin" }
-- =====================================================================

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---- wipe existing policies on the two tables --------------------
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename in ('prices', 'products')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

alter table public.prices   enable row level security;
alter table public.products enable row level security;

-- ---- prices -----------------------------------------------------
create policy "prices: public read" on public.prices
  for select using (true);

create policy "prices: insert own" on public.prices
  for insert with check (auth.uid() = created_by);

create policy "prices: update author or admin" on public.prices
  for update
  using (auth.uid() = created_by or public.is_admin())
  with check (auth.uid() = created_by or public.is_admin());

create policy "prices: delete author or admin" on public.prices
  for delete
  using (auth.uid() = created_by or public.is_admin());

-- ---- products -------------------------------------------------
create policy "products: public read" on public.products
  for select using (true);

create policy "products: insert own" on public.products
  for insert with check (auth.uid() = created_by);

-- author or admin for edits; admin also covers the moderation "approve"
-- action (products.is_moderated) now that anyone-can-moderate is off.
create policy "products: update author or admin" on public.products
  for update
  using (auth.uid() = created_by or public.is_admin())
  with check (auth.uid() = created_by or public.is_admin());

create policy "products: delete author or admin" on public.products
  for delete
  using (auth.uid() = created_by or public.is_admin());
