-- =====================================================================
--  UNIVERSAL COLLECTIONS (books / meds / tools / ...)
--  Run this whole file once in the Supabase SQL Editor.
-- =====================================================================

-- ---------- Tables ---------------------------------------------------

create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users not null,
  type        text not null,                 -- 'books' | 'meds' | ... (registry lives in the app)
  name        text not null,                 -- "Моя библиотека", "Домашняя аптечка"
  icon        text,                          -- lucide icon name override (optional)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists collection_categories (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid references collections on delete cascade not null,
  name           text not null,
  color          text,
  icon           text,
  sort           int default 0,
  created_at     timestamptz default now(),
  unique (collection_id, name)
);

create table if not exists collection_items (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid references collections on delete cascade not null,
  created_by     uuid references auth.users default auth.uid(),
  title          text not null,              -- book title / drug name
  subtitle       text,                       -- author / dosage form
  cover_url      text,
  photos         jsonb default '[]'::jsonb,  -- extra photo urls
  category_id    uuid references collection_categories on delete set null,
  tags           text[] default '{}',
  quantity       numeric default 1,          -- сколько экземпляров
  location       text,                       -- где лежит дома
  status         text,                       -- 'have' | 'for_sale' | 'low' | 'expired' ...
  price          numeric,                    -- запрашиваемая цена, если на продажу
  notes          text,
  data           jsonb default '{}'::jsonb,  -- type-specific: {isbn,author,year} / {expiry,dosage}
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists collection_shares (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid references collections on delete cascade not null,
  owner_id       uuid references auth.users not null,
  member_email   text not null,
  member_id      uuid references auth.users,          -- filled once the invitee signs in
  role           text not null default 'viewer',      -- 'editor' | 'viewer'
  created_at     timestamptz default now(),
  unique (collection_id, member_email)
);

create index if not exists idx_collections_owner        on collections(owner_id);
create index if not exists idx_coll_items_collection     on collection_items(collection_id);
create index if not exists idx_coll_items_category       on collection_items(category_id);
create index if not exists idx_coll_items_tags           on collection_items using gin(tags);
create index if not exists idx_coll_cats_collection      on collection_categories(collection_id);
create index if not exists idx_coll_shares_collection    on collection_shares(collection_id);
create index if not exists idx_coll_shares_member        on collection_shares(member_id);
create index if not exists idx_coll_shares_member_email  on collection_shares(member_email);

-- ---------- Access helpers (security definer avoids RLS recursion) --

create or replace function can_access_collection(cid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from collections c
                 where c.id = cid and c.owner_id = auth.uid())
      or exists (select 1 from collection_shares s
                 where s.collection_id = cid and s.member_id = auth.uid());
$$;

create or replace function can_edit_collection(cid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from collections c
                 where c.id = cid and c.owner_id = auth.uid())
      or exists (select 1 from collection_shares s
                 where s.collection_id = cid and s.member_id = auth.uid()
                   and s.role = 'editor');
$$;

-- Link invitations addressed to my email after I sign in.
create or replace function link_my_shares()
returns void language sql security definer as $$
  update collection_shares
     set member_id = auth.uid()
   where member_id is null
     and lower(member_email) = lower((select email from auth.users where id = auth.uid()));
$$;

-- ---------- RLS ----------------------------------------------------

alter table collections           enable row level security;
alter table collection_categories enable row level security;
alter table collection_items      enable row level security;
alter table collection_shares     enable row level security;

-- collections
drop policy if exists "collections read"  on collections;
drop policy if exists "collections write" on collections;
-- NB: use the helper, not an inline subquery — a bare `id` inside a subquery
-- over collection_shares binds to collection_shares.id, not collections.id.
create policy "collections read" on collections for select
  using (owner_id = auth.uid() or can_access_collection(id));
create policy "collections write" on collections for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- categories
drop policy if exists "categories read"  on collection_categories;
drop policy if exists "categories write" on collection_categories;
create policy "categories read" on collection_categories for select
  using (can_access_collection(collection_id));
create policy "categories write" on collection_categories for all
  using (can_edit_collection(collection_id))
  with check (can_edit_collection(collection_id));

-- items
drop policy if exists "items read"   on collection_items;
drop policy if exists "items insert" on collection_items;
drop policy if exists "items update" on collection_items;
drop policy if exists "items delete" on collection_items;
create policy "items read" on collection_items for select
  using (can_access_collection(collection_id));
create policy "items insert" on collection_items for insert
  with check (can_edit_collection(collection_id));
create policy "items update" on collection_items for update
  using (can_edit_collection(collection_id))
  with check (can_edit_collection(collection_id));
create policy "items delete" on collection_items for delete
  using (can_edit_collection(collection_id));

-- shares
drop policy if exists "shares owner"  on collection_shares;
drop policy if exists "shares member" on collection_shares;
create policy "shares owner" on collection_shares for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "shares member" on collection_shares for select
  using (member_id = auth.uid());

-- ---------- Storage bucket for photos ----------------------------

insert into storage.buckets (id, name, public)
values ('collection-photos', 'collection-photos', true)
on conflict (id) do nothing;

drop policy if exists "coll photos read"   on storage.objects;
drop policy if exists "coll photos write"  on storage.objects;
drop policy if exists "coll photos delete" on storage.objects;
create policy "coll photos read" on storage.objects for select
  using (bucket_id = 'collection-photos');
create policy "coll photos write" on storage.objects for insert
  with check (bucket_id = 'collection-photos' and auth.role() = 'authenticated');
create policy "coll photos delete" on storage.objects for delete
  using (bucket_id = 'collection-photos' and owner = auth.uid());
