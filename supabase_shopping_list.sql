-- Create Shopping List Table
create table shopping_list (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references public.products, -- Optional, can be text-only item
  text text not null,
  is_checked boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table shopping_list enable row level security;

create policy "Users can manage their own shopping list"
  on shopping_list for all
  using (auth.uid() = user_id);

-- Optional: Indexes
create index idx_shopping_list_user_id on shopping_list(user_id);
