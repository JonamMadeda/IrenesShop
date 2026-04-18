alter table public.items
add column if not exists sku text,
add column if not exists barcode text,
add column if not exists reorder_level integer default 5,
add column if not exists updated_at timestamptz default now();

create index if not exists items_user_id_name_idx
  on public.items (user_id, name);

create index if not exists items_user_id_category_idx
  on public.items (user_id, category);

create unique index if not exists items_user_id_sku_unique_idx
  on public.items (user_id, sku)
  where sku is not null;

create or replace function public.set_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_items_updated_at_trigger on public.items;
create trigger set_items_updated_at_trigger
before update on public.items
for each row
execute function public.set_items_updated_at();
