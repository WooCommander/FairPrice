-- =====================================================================
--  SHARING FOR THE BIRTHDAYS LIST  (share all, or selected entries)
--  Run once in the Supabase SQL Editor. Safe to re-run.
--  Assumes the `birthdays` table already exists with its own
--  "manage own" RLS policy (auth.uid() = user_id) — that is left intact.
-- =====================================================================

create table if not exists birthday_shares (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users not null,
  owner_email   text,                                   -- shown to the invitee
  member_email  text not null,
  member_id     uuid references auth.users,             -- filled once the invitee signs in
  scope         text not null default 'all',            -- 'all' | 'selected'
  created_at    timestamptz default now(),
  unique (owner_id, member_email)
);

create table if not exists birthday_share_items (
  share_id     uuid references birthday_shares on delete cascade not null,
  birthday_id  uuid references birthdays on delete cascade not null,
  primary key (share_id, birthday_id)
);

create index if not exists idx_bday_shares_owner     on birthday_shares(owner_id);
create index if not exists idx_bday_shares_member    on birthday_shares(member_id);
create index if not exists idx_bday_share_items_bday on birthday_share_items(birthday_id);

-- ---------- Functions (security definer -> no RLS recursion) --------

create or replace function link_my_birthday_shares()
returns void language sql security definer as $$
  update birthday_shares
     set member_id = auth.uid()
   where member_id is null
     and lower(member_email) = lower((select email from auth.users where id = auth.uid()));
$$;

create or replace function birthday_shared_with_me(bid uuid, owner uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from birthday_shares s
    where s.owner_id = owner
      and s.member_id = auth.uid()
      and (
        s.scope = 'all'
        or exists (select 1 from birthday_share_items i
                   where i.share_id = s.id and i.birthday_id = bid)
      )
  );
$$;

-- ---------- RLS ---------------------------------------------------

alter table birthday_shares      enable row level security;
alter table birthday_share_items enable row level security;

drop policy if exists "bday shares owner"  on birthday_shares;
drop policy if exists "bday shares member" on birthday_shares;
create policy "bday shares owner" on birthday_shares for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "bday shares member" on birthday_shares for select
  using (member_id = auth.uid());

drop policy if exists "bday share items owner"  on birthday_share_items;
drop policy if exists "bday share items member" on birthday_share_items;
create policy "bday share items owner" on birthday_share_items for all
  using (exists (select 1 from birthday_shares s
                 where s.id = share_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from birthday_shares s
                      where s.id = share_id and s.owner_id = auth.uid()));
create policy "bday share items member" on birthday_share_items for select
  using (exists (select 1 from birthday_shares s
                 where s.id = share_id and s.member_id = auth.uid()));

-- Additional SELECT policy on birthdays: an invitee can read shared rows.
-- OR-combines with the existing owner policy; the owner policy is untouched.
drop policy if exists "birthdays shared read" on birthdays;
create policy "birthdays shared read" on birthdays for select
  using (birthday_shared_with_me(id, user_id));
